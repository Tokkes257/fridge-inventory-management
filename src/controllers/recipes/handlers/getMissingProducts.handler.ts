import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { RecipeMissingProductView } from "../../../contracts/recipe/recipe.missing.product.view";

export const getMissingProducts = async (id: string): Promise<RecipeMissingProductView[]> => {
    const recipe = await prisma.recipe.findUnique({
        where: { id },
    });
    if (!recipe) {
        throw new NotFoundException("Recipe not found");
    }

    // get all products for the recipe from the recipeProduct table
    const recipeProducts = await prisma.recipeProduct.findMany({
        where: { recipeId: id },
    });
    if (!recipeProducts || recipeProducts.length === 0) {
        return [];
    }

    // Get which products the user does not have in the fridge or which amount they are missing for a product that they don't have enough of
    const missingProducts: RecipeMissingProductView[] = [];
    for (const recipeProduct of recipeProducts) {
        const fridgeProducts = await prisma.productFridge.findMany({
            where: {
                productId: recipeProduct.productId,
                userId: recipe.userId,
            },
            include: {
                product: true
            },
        });

        if (fridgeProducts.length === 0) {
            // Need to retrieve details separately because no products in fridgeProducts list
            const productDetails = await prisma.product.findUnique({
                where: { id: recipeProduct.productId },
            });

            missingProducts.push({
                productId: productDetails.id,
                name: productDetails.name,
                type: productDetails.type,
                size: productDetails.size,
                amount: recipeProduct.quantity,
            });
        } else {
            // Product is one or more fridges, check if the summed quantity is less than the recipe quantity
            const totalQuantity = fridgeProducts.reduce((sum, p) => sum + p.quantity, 0);
            if (totalQuantity < recipeProduct.quantity) {
                missingProducts.push({
                    productId: fridgeProducts[0].product.id,
                    name: fridgeProducts[0].product.name,
                    type: fridgeProducts[0].product.type,
                    size: fridgeProducts[0].product.size,
                    amount: recipeProduct.quantity - totalQuantity,
                });
            }
        }
    }

    return missingProducts;
}