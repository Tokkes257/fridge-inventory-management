import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { RecipeBody } from "../../../contracts/recipe/recipe.body";

export const get = async (id: string): Promise<RecipeBody> => {
	const recipe = await prisma.recipe.findUnique({
		where: { id },
	});

	if (!recipe) {
		throw new NotFoundException("Recipe not found");
	}

	// Fetch products for recipe 
	const recipeProducts = await prisma.recipeProduct.findMany({
		where: { recipeId: id },
		include: {
			product: true,
		},
	});
	const products = recipeProducts.map(rp => ({
		id: rp.product.id,
		quantity: rp.quantity,
	}));

	return plainToInstance(RecipeBody, { ...recipe, products });
};