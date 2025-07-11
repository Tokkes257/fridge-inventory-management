import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { RecipeBody } from "../../../contracts/recipe/recipe.body";
import { RecipeView } from "../../../contracts/recipe/recipe.view";

export const getList = async (search?: string): Promise<RecipeView[]> => {
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

    return recipes.map(recipe => plainToInstance(RecipeView, recipe));
};