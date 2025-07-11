import { PrismaClient, ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { create } from "../../controllers/recipes/handlers/create.handler";
import { deleteRecipe } from "../../controllers/recipes/handlers/delete.handler";
import { get } from "../../controllers/recipes/handlers/get.handler";
import { RecipeBody } from "../../contracts/recipe/recipe.body";
import { expect } from "chai";
import { getList } from "../../controllers/recipes/handlers/getList.handler";
import { getMissingProducts } from "../../controllers/recipes/handlers/getMissingProducts.handler";
import { RecipeUpdateBody } from "../../contracts/recipe/recipe.update.body";
import { update } from "../../controllers/recipes/handlers/update.handler";


export async function seed() {
    // Add some fridges to the database
    const prisma = new PrismaClient();
    await prisma.fridge.upsert({
        where: { id: "1" },
        update: {},
        create: {
            id: "1",
            location: 1,
            capacity: 100,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "2" },
        update: {},
        create: {
            id: "2",
            location: 1,
            capacity: 50,
        },
    });

    // Add a user to the database
    await prisma.user.delete({ where: { id: "1" } }).catch(() => {});
    await prisma.user.create({
        data: {
            id: "1",
            email: "a@a.com",
            password: await bcrypt.hash("password", 10),
            firstName: "John",
            lastName: "Doe",
        },
    });

    // Add some test products to the database
    await prisma.product.upsert({
        where: { id: "1" },
        update: {},
        create: {
            id: "1",
            name: "Chocolate",
            type: ProductType.FOOD,
            size: 1,
        },
    });
    await prisma.product.upsert({
        where: { id: "2" },
        update: {},
        create: {
            id: "2",
            name: "Mango",
            type: ProductType.FOOD,
            size: 1,
        },
    });
    await prisma.product.upsert({
        where: { id: "3" },
        update: {},
        create: {
            id: "3",
            name: "Cola",
            type: ProductType.DRINK,
            size: 1,
        },
    });

    // add a product to fridge 1 for user 1
    await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                userId: "1",
                fridgeId: "1",
                productId: "1",
            },
        },
        update: {},
        create: {
            userId: "1",
            fridgeId: "1",
            productId: "1",
            quantity: 3,
        },
    });

    // add products to fridge 2 for user 1
    await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                userId: "1",
                fridgeId: "2",
                productId: "2",
            },
        },
        update: {},
        create: {
            userId: "1",
            fridgeId: "2",
            productId: "2",
            quantity: 3,
        },
    });

    await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                userId: "1",
                fridgeId: "2",
                productId: "3",
            },
        },
        update: {},
        create: {
            userId: "1",
            fridgeId: "2",
            productId: "3",
            quantity: 5,
        },
    });
}

describe("Recipe handler tests", () => {
    describe("Create recipe tests", () => {
        let body: RecipeBody;
        beforeEach(async () => {
            // Clean up the whole database
            await prisma.fridge.deleteMany();
            await prisma.productFridge.deleteMany();
            await prisma.product.deleteMany();
            await prisma.recipeProduct.deleteMany();
            await prisma.recipe.deleteMany();
            await prisma.user.deleteMany();

            // Seed the database
            await seed();
            
            // no products for the test body, can be added later in specific tests
            body = {
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1"
            } as RecipeBody;
        });

        it("should throw error if user does not exist", async () => {
            try {
                body.userId = "999";
                await create(body);
            } catch (error) {
                expect(error.message).include("User does not exist");
            }
        });

        it("should throw error when unknown product is passed", async () => {
            try {
                body.products = [
                    {
                        id: "some fake id",
                        quantity: 5
                    }
                ];
                await create(body);
            } catch (error) {
                expect(error.message).include("One or more products do not exist")
            }
        });

        it("should throw error when there already is a recipe with the same name", async () => {
            await create(body);
            try {
                await create(body);
            } catch (error) {
                expect(error.message).include("Recipe with this name already exists")
            }
        });

        it("should throw error when product quantity <= 0", async () => {
            try {
                body.products = [
                    {
                        id: "1",
                        quantity: 0
                    }
                ];
                await create(body);
            } catch (error) {
                expect(error.message).include("Product quantity must be greater than 0")
            }

            try {
                body.products = [
                    {
                        id: "1",
                        quantity: -1
                    }
                ];
                body.name = "recipe2";
                await create(body);
            } catch (error) {
                expect(error.message).include("Product quantity must be greater than 0")
            }
        });

        it("should create recipe", async () => {
            const recipesFirst = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            })
            expect(recipesFirst.length).equal(0);

            await create(body);

            const recipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            })

            expect(recipes.length).equal(1);
            expect(recipes[0]).include({
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1"
            })
        });
    });

    describe("Delete recipe tests", () => {
        let body: RecipeBody;
        beforeEach(async () => {
            // Clean up the whole database
            await prisma.fridge.deleteMany();
            await prisma.productFridge.deleteMany();
            await prisma.product.deleteMany();
            await prisma.recipeProduct.deleteMany();
            await prisma.recipe.deleteMany();
            await prisma.user.deleteMany();

            // Seed the database
            await seed();

            // Create a recipe to delete later
            body = {
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1"
            } as RecipeBody;
            await create(body);
        });

        it("should throw error when deleting non existing recipe", async () => {
            try {
                await deleteRecipe("999");
            } catch (error) {
                expect(error.message).include("Recipe not found");
            }
        });

        it("should delete recipe", async () => {
            const recipesBefore = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });
            expect(recipesBefore.length).equal(1);

            await deleteRecipe(recipesBefore[0].id);

            const recipesAfter = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });
            expect(recipesAfter.length).equal(0);
        });
    });

    describe("Get recipe tests", () => {
        let body: RecipeBody;
        beforeEach(async () => {
            // Clean up the whole database
            await prisma.fridge.deleteMany();
            await prisma.productFridge.deleteMany();
            await prisma.product.deleteMany();
            await prisma.recipeProduct.deleteMany();
            await prisma.recipe.deleteMany();
            await prisma.user.deleteMany();

            // Seed the database
            await seed();

            // Create a recipe to delete later
            body = {
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1"
            } as RecipeBody;
        });

        it("should throw error when no recipe with given id", async () => {
            await create(body);
            try {
                await get("999");
            } catch (error) {
                expect(error.message).include("Recipe not found");
            }
        })

        it("should get recipe (no products)", async () => {
            await create(body);
            const recipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            })

            const recipe = await get(recipes[0].id);
            const expected = {
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1"
            }
            expect(recipe).include(expected);
        });

        it("should get recipe (with products)", async () => {
            body.products = [
                {
                    id: "1",
                    quantity: 5
                }
            ]

            await create(body);
            const recipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            })

            const recipe = await get(recipes[0].id);
            const expected = {
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1",
                products: [
                    {
                        id: "1",
                        quantity: 5
                    }
                ]
            }
            expect(recipe).deep.include(expected);
        });
    });

    describe("Get recipe list tests", () => {
        let body: RecipeBody;
        beforeEach(async () => {
            // Clean up the whole database
            await prisma.fridge.deleteMany();
            await prisma.productFridge.deleteMany();
            await prisma.product.deleteMany();
            await prisma.recipeProduct.deleteMany();
            await prisma.recipe.deleteMany();
            await prisma.user.deleteMany();

            // Seed the database
            await seed();

            // Create a recipe to delete later
            body = {
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1"
            } as RecipeBody;
        });

        it("should get all recipes", async () => {
            await create(body);
            body.name = "recipe 2";
            await create(body);

            const recipes = await getList();

            expect(recipes.length).equal(2);
            expect(recipes.some((x) => x.name === "test recipe")).true;
            expect(recipes.some((x) => x.name === "recipe 2")).true;
        });

        it("should search recipes by name or description", async () => {
            await create(body);
            body.name = "recipe 2";
            body.description = "description of recipe 2";
            await create(body);

            const recipes = await getList("recipe 2");

            expect(recipes.length).equal(1);
            expect(recipes[0].name).equal("recipe 2");

            const recipes2 = await getList('test');
            expect(recipes2.length).equal(1);
            expect(recipes2[0].name).equal("test recipe");

            const recipes3 = await getList('recipe');
            expect(recipes3.length).equal(2);
            expect(recipes3.some((x) => x.name === "test recipe")).true;
            expect(recipes3.some((x) => x.name === "recipe 2")).true;
        });
    });

    describe("Get missing recipe products tests", () => {
        let body: RecipeBody;
        beforeEach(async () => {
            // Clean up the whole database
            await prisma.fridge.deleteMany();
            await prisma.productFridge.deleteMany();
            await prisma.product.deleteMany();
            await prisma.recipeProduct.deleteMany();
            await prisma.recipe.deleteMany();
            await prisma.user.deleteMany();

            // Seed the database
            await seed();

            // Create a recipe to delete later
            body = {
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1"
            } as RecipeBody;
        });

        it("should throw error when recipe does not exist", async () => {
            try {
                await getList("999");
            } catch (error) {
                expect(error.message).include("Recipe not found");
            }
        });

        it("should get missing recipe products", async () => {
            body.products = [
                {
                    id: "1",
                    quantity: 6
                },
                {
                    id: "3",
                    quantity: 7
                }
            ];
            await create(body);

            const recipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });

            const missing = await getMissingProducts(recipes[0].id);
            missing.sort((a, b) => a.productId.localeCompare(b.productId));
            expect(missing.length).equal(2);
            expect(missing).deep.equal([
                {
                    productId: "1",
                    name: "Chocolate",
                    type: ProductType.FOOD,
                    size: 1,
                    amount: 3
                },
                {
                    productId: "3",
                    name: "Cola",
                    type: ProductType.DRINK,
                    size: 1,
                    amount: 2
                }
            ]);
        });
    });

    describe("Update recipe tests", () => {
        let body: RecipeBody;
        beforeEach(async () => {
            // Clean up the whole database
            await prisma.fridge.deleteMany();
            await prisma.productFridge.deleteMany();
            await prisma.product.deleteMany();
            await prisma.recipeProduct.deleteMany();
            await prisma.recipe.deleteMany();
            await prisma.user.deleteMany();

            // Seed the database
            await seed();

            // Create a recipe to delete later
            body = {
                name: "test recipe",
                description: "description of the test recipe",
                userId: "1"
            } as RecipeBody;
        });

        it("should throw error when recipe does not exist", async () => {
            try {
                await create(body);
                await get("999");
            } catch (error) {
                expect(error.message).include("Recipe not found");
            }
        });

        it("should update recipe name", async () => {
            await create(body);
            const recipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });

            const updateBody: RecipeUpdateBody = {
                name: "new recipe name"
            };
            await update(recipes[0].id, updateBody);
            const updatedRecipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });
            expect(updatedRecipes.length).equal(1);
            expect(updatedRecipes[0]).deep.include({
                name: "new recipe name",
                description: "description of the test recipe",
                userId: "1"
            });
        })

        it("should update recipe description", async () => {
            await create(body);
            const recipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });


            const updateBody: RecipeUpdateBody = {
                description: "description"
            };
            await update(recipes[0].id, updateBody);
            const updatedRecipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });
            expect(updatedRecipes.length).equal(1);
            expect(updatedRecipes[0]).deep.include({
                name: "test recipe",
                description: "description",
                userId: "1"
            });
        })

        it("should update recipe name & description", async () => {
            await create(body);
            const recipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });


            const updateBody: RecipeUpdateBody = {
                name: "new recipe name",
                description: "description"
            };
            await update(recipes[0].id, updateBody);
            const updatedRecipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });
            expect(updatedRecipes.length).equal(1);
            expect(updatedRecipes[0]).deep.include({
                name: "new recipe name",
                description: "description",
                userId: "1"
            });
        })

        it("should update recipe name & products", async () => {
            await create(body);
            const recipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });

            const updateBody: RecipeUpdateBody = {
                name: "new recipe name",
                products: [
                    {
                        id: "1",
                        quantity: 5
                    },
                    {
                        id: "3",
                        quantity: 2
                    }
                ]
            };

            await update(recipes[0].id, updateBody);
            const updatedRecipes = await prisma.recipe.findMany({
                where: {
                    userId: body.userId
                }
            });
            expect(updatedRecipes.length).equal(1);
            expect(updatedRecipes[0]).deep.include({
                name: "new recipe name"
            });

            const recipeProducts = await prisma.recipeProduct.findMany({
                where: {
                    recipeId: updatedRecipes[0].id
                }
            });
            expect(recipeProducts.length).equal(2);
            expect(recipeProducts[0]).deep.include({
                productId: "1",
                quantity: 5
            });
            expect(recipeProducts[1]).deep.include({
                productId: "3",
                quantity: 2
            });
        })
    });
});