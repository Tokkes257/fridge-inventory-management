import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { RecipeBody } from "../../../contracts/recipe/recipe.body";
import { RecipeView } from "../../../contracts/recipe/recipe.view";

export const get = async (id: string): Promise<RecipeView> => {
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

	return plainToInstance(RecipeView, { ...recipe, products });
};