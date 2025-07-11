import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { RecipeUpdateBody } from "../../../contracts/recipe/recipe.update.body";
import { RecipeBody } from "../../../contracts/recipe/recipe.body";

export const update = async (id: string, body: RecipeUpdateBody): Promise<RecipeBody> => {
	const recipe = await prisma.recipe.findUnique({
		where: { id },
	});

	if (!recipe) {
		throw new NotFoundException("Recipe not found");
	}

	const updateData: any = {};
	if (body.name !== undefined) updateData.name = body.name;
	if (body.description !== undefined) updateData.description = body.description;
	if (body.products !== undefined) updateData.products = body.products;

	const updatedRecipe = await prisma.recipe.update({
		where: { id },
		data: {
			name: updateData.name,
			description: updateData.description,
		},
	});

	// if body.products exists, update the recipeProduct table. first delete all existing products for the recipe, then add the new ones
	if (body.products && body.products.length > 0) {
		await prisma.recipeProduct.deleteMany({
			where: { recipeId: id },
		});
		
		await Promise.all(body.products.map(async (product) => {
			await prisma.recipeProduct.create({
				data: {
					recipeId: updatedRecipe.id,
					productId: product.id,
					quantity: product.quantity,
				},
			});
		}));
	}

	return plainToInstance(RecipeBody, { ...updatedRecipe, products: body.products || [] });
};