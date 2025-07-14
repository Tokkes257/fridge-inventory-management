import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import z from "zod";
import { plainToInstance } from "class-transformer";
import { RecipeBody } from "../../../contracts/recipe/recipe.body";

export const getRecipeSuggestions = async (userId: string): Promise<RecipeBody[]> => {

    // Check that user exists
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) {
        throw new NotFoundException("User not found");
    }

    // Get list of all products a user has
    const products = await prisma.productFridge.findMany({
        where: {
            userId: userId,
        },
        include: {
            product: true,
        },
    });
    if (!products || products.length === 0) {
        throw new NotFoundException("No products found for user");
    }

    
    // Define a schema corresponding to an array of RecipeView
    const recipeViewSchema = z.object({
        recipes: z.array(z.object({
            name: z.string(),
            description: z.string().nullable(),
            userId: z.string(),
            products: z.array(z.object({
                id: z.string(),
                quantity: z.number(),
            })),
        }))
    });

    const result = await generateObject({
        model: anthropic("claude-3-5-sonnet-latest"),
        schema: recipeViewSchema,
        prompt: `Suggest multiple recipes (as many as possible, at least one) based on the following ingredients (stay within the amount of every ingredient available). 
Here is the full list of products with all their info:
${products.map(p => `- id: ${p.product.id}, name: ${p.product.name}, quantity: ${p.quantity}, details: ${JSON.stringify(p.product)}`).join("\n")}
For each recipe, include the instructions in the 'description' field. Respond with an array of recipe objects.`,
    });

    const parsedResult = recipeViewSchema.parse(result.object);

    return parsedResult.recipes.map(recipe => {
        return plainToInstance(RecipeBody, {
            name: recipe.name,
            description: recipe.description || "",
            userId: userId,
            products: recipe.products.map(product => ({ id: product.id, quantity: product.quantity })),
        });
    });
};
