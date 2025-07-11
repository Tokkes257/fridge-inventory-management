import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { RecipeBody } from "../../../contracts/recipe/recipe.body";

export const getList = async (search?: string): Promise<RecipeBody[]> => {
    const where = search
		? {
            OR: [
                {
                    name: {
                        contains: search,
                        mode: "insensitive" as const,
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: "insensitive" as const,
                    },
                },
            ],
		  }
		: {};

    const recipes = await prisma.recipe.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    return recipes.map(recipe => plainToInstance(RecipeBody, recipe));
};