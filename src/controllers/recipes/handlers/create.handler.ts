import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma"
import { NotAcceptableException } from "@nestjs/common";
import { RecipeBody } from "../../../contracts/recipe/recipe.body";
import { RecipeView } from "../../../contracts/recipe/recipe.view";

export const create = async (body: RecipeBody): Promise<RecipeView> => {

	// check that the user exists in the DB
	const user = await prisma.user.findUnique({
		where: { id: body.userId },
	});
	if (!user) {
		throw new NotAcceptableException("User does not exist");
	}

	// check that all products exist in the DB
	if (body.products && body.products.length > 0) {
		const products = await prisma.product.findMany({
			where: {
				id: { in: body.products.map(product => product.id) },
			},
		});
		if (products.length !== body.products.length) {
			throw new NotAcceptableException("One or more products do not exist");
		}
	}

	// check that user has no recipe with the same name
	const recipeExists = await prisma.recipe.findFirst({
		where: {
			name: body.name,
			userId: body.userId,
		},
	});
	if (recipeExists) {
		throw new NotAcceptableException("Recipe with this name already exists");
	}

	// Add recipe to the DB
	const recipe = await prisma.recipe.create({
		data: {
			name: body.name,
			description: body.description,
			userId: body.userId,
		},
	});

	// add given products in the body.products to the recipeProduct table
	if (body.products && body.products.length > 0) {
		await Promise.all(body.products.map(async (product) => {
			// only add those with quantity > 0
			if (product.quantity <= 0) {
				throw new NotAcceptableException("Product quantity must be greater than 0");
			}
			await prisma.recipeProduct.create({
				data: {
					recipeId: recipe.id,
					productId: product.id,
					quantity: product.quantity,
				},
			});
		}));
	}

	return plainToInstance(RecipeView, {
		id: recipe.id,
		name: recipe.name,
		description: recipe.description,
		userId: recipe.userId,
		products: body.products || [],
	});
};