import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import { before, beforeEach, after, describe, it } from "mocha";
import request from "supertest";

import { AppModule } from "../../app.module";
import { prisma } from "../../lib/prisma";
import { ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seed() {
    // Add fridge to the database
    await prisma.fridge.upsert({
        where: { id: "1" },
        update: {},
        create: {
            id: "1",
            location: 1,
            capacity: 100,
        },
    });

    // Add user to the database
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

    // Add products to the database
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

    // Add product to fridge
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
            quantity: 5,
        },
    });
    await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                userId: "1",
                fridgeId: "1",
                productId: "2",
            },
        },
        update: {},
        create: {
            userId: "1",
            fridgeId: "1",
            productId: "2",
            quantity: 3,
        },
    });
    await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                userId: "1",
                fridgeId: "1",
                productId: "3",
            },
        },
        update: {},
        create: {
            userId: "1",
            fridgeId: "1",
            productId: "3",
            quantity: 1,
        },
    });
};

describe("Integration tests", () => {
    describe("Recipe Tests", () => {
        let app: INestApplication;

        before(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule(
                {
                    imports: [AppModule],
                }
            ).compile();

            app = moduleFixture.createNestApplication();

            // Apply the same configuration as in main.ts
            app.useGlobalPipes(
                new ValidationPipe({
                    whitelist: true,
                    forbidNonWhitelisted: true,
                    transform: true,
                })
            );

            app.enableCors({
                origin: "*",
                credentials: true,
                exposedHeaders: ["x-auth"],
            });

            app.setGlobalPrefix("api");

            await app.init();

            await prisma.$connect();
        });

        beforeEach(async () => {
            await prisma.fridge.deleteMany();
            await prisma.productFridge.deleteMany();
            await prisma.product.deleteMany();
            await prisma.recipeProduct.deleteMany();
            await prisma.recipe.deleteMany();
            await prisma.user.deleteMany();

            await seed();
        });

        after(async () => {
            await app.close();
        });

        it("Recipe life cycle test", async () => {
            const userId = "1";

            // Login to get JWT token
            const { body: loginResponse } = await request(app.getHttpServer())
                .post(`/api/auth/login`)
                .send({
                    email: "a@a.com",
                    password: "password",
                })
                .expect(HttpStatus.OK);

            const token = loginResponse.token;
            expect(token).to.be.a("string");

            
            // Create recipe
            const recipeData = {
                name: "test recipe",
                description: "desc1",
                userId: userId,
                products: [
                    { id: "1", quantity: 6 },
                    { id: "2", quantity: 3 },
                    { id: "3", quantity: 10 },
                ],
            };
            const { body: createRecipeResponse } = await request(app.getHttpServer())
                .post(`/api/recipes`)
                .set("x-auth", token)
                .send(recipeData)
                .expect(HttpStatus.CREATED);

            expect(createRecipeResponse.userId).equal(userId);
            expect(createRecipeResponse.name).equal(recipeData.name);
            expect(createRecipeResponse.description).equal(recipeData.description);

            const recipes = await prisma.recipe.findMany({
                where: { userId: userId }
            });
            expect(recipes.length).equal(1);
            expect(recipes[0].name).equal(recipeData.name);


            // Add other recipe
            const otherRecipeData = {
                name: "test recipe 2",
                description: "desc2",
                userId: userId,
                products: [
                    { id: "1", quantity: 6 },
                    { id: "2", quantity: 3 },
                ],
            };
            const { body: createOtherRecipeResponse } = await request(app.getHttpServer())
                .post(`/api/recipes`)
                .set("x-auth", token)
                .send(otherRecipeData)
                .expect(HttpStatus.CREATED);

            // get all recipes
            const { body: allRecipesResponse } = await request(app.getHttpServer())
                .get(`/api/recipes`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            allRecipesResponse.sort((a, b) => a.name.localeCompare(b.name));
            expect(allRecipesResponse.length).equal(2);
            expect(allRecipesResponse[0].name).equal(recipeData.name);
            expect(allRecipesResponse[1].name).equal(otherRecipeData.name);

            // get recipe by id
            const { body: recipeByIdResponse } = await request(app.getHttpServer())
                .get(`/api/recipes/${createRecipeResponse.id}`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            expect(recipeByIdResponse.name).equal(recipeData.name);
            expect(recipeByIdResponse.description).equal(recipeData.description);
            expect(recipeByIdResponse.products.length).equal(3);


            // Update recipe
            const updatedRecipeData = {
                name: "updated name"
            };
            const { body: updateRecipeResponse } = await request(app.getHttpServer())
                .patch(`/api/recipes/${createRecipeResponse.id}`)
                .set("x-auth", token)
                .send(updatedRecipeData)
                .expect(HttpStatus.OK);

            expect(updateRecipeResponse.name).equal(updatedRecipeData.name);
            const updatedRecipe = await prisma.recipe.findUnique({ where: { id: createRecipeResponse.id } });
            expect(updatedRecipe).not.null;
            expect(updatedRecipe!.name).equal(updatedRecipeData.name);


            // Get missing products
            const { body: missingProductsResponse } = await request(app.getHttpServer())
                .get(`/api/recipes/${createRecipeResponse.id}/missing-products`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            missingProductsResponse.sort((a, b) => a.productId.localeCompare(b.productId));
            expect(missingProductsResponse.length).equal(2);
            expect(missingProductsResponse[0].productId).equal("1");
            expect(missingProductsResponse[0].amount).equal(1);
            expect(missingProductsResponse[1].productId).equal("3");
            expect(missingProductsResponse[1].amount).equal(9);


            // Delete recipe
            await request(app.getHttpServer())
                .delete(`/api/recipes/${createRecipeResponse.id}`)
                .set("x-auth", token)
                .expect(HttpStatus.NO_CONTENT);
            
            const recipesAfterDelete = await prisma.recipe.findMany({ where: { userId: userId } });
            expect(recipesAfterDelete.length).equal(1);
            expect(recipesAfterDelete[0].id).equal(createOtherRecipeResponse.id);
        });
    });
});