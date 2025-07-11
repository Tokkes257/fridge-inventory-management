import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const deleteRecipe = async (id: string): Promise<void> => {
	const recipe = await prisma.recipe.findUnique({
		where: { id },
	});

	if (!recipe) {
		throw new NotFoundException("Recipe not found");
	}

	await prisma.recipe.delete({
		where: { id },
	});
};