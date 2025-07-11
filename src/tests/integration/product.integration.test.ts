import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import { before, beforeEach, after, describe, it } from "mocha";
import request from "supertest";

import { AppModule } from "../../app.module";
import { prisma } from "../../lib/prisma";
import { ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ProductBody } from "../../contracts/product/product.body";

export async function seed() {
    // Add some fridges to the database
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
            location: 2,
            capacity: 50,
        },
    });

    // Add 2 basic users to the database
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

    await prisma.user.delete({ where: { id: "2" } }).catch(() => {});
    await prisma.user.create({
        data: {
            id: "2",
            email: "b@b.com",
            password: await bcrypt.hash("password", 10),
            firstName: "Jane",
            lastName: "Doe",
        },
    });
};

describe("Integration tests", () => {
    describe("Product Tests", () => {
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

        it("Product life cycle test", async () => {
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

            // Put product in fridge
            const { body: createResponse } = await request(app.getHttpServer())
                .post(`/api/products/${userId}`)
                .set("x-auth", token)
                .send({
                    "name": "Chocolate",
                    "type": "FOOD",
                    "amount": 10,
                    "size": 5,
                    "fridgeId": "1"
                } as ProductBody)
                .expect(HttpStatus.CREATED);
            
            expect(createResponse.name === "Chocolate").true;
            expect(createResponse.type === ProductType.FOOD).true;
            expect(createResponse.amount === 10).true;
            expect(createResponse.size === 5).true;
            expect(createResponse.fridgeId === "1").true;

            let products = await prisma.product.findMany();
            expect(products.length).equal(1);
            expect(await prisma.product.findUnique({ where: { id: products[0].id } })).not.null;

            // Put 2 other products for future tests
            await request(app.getHttpServer())
                .post(`/api/products/${userId}`)
                .set("x-auth", token)
                .send({
                    "name": "Milk",
                    "type": "DRINK",
                    "amount": 5,
                    "size": 2,
                    "fridgeId": "1"
                } as ProductBody)
                .expect(HttpStatus.CREATED);

            await request(app.getHttpServer())
                .post(`/api/products/${userId}`)
                .set("x-auth", token)
                .send({
                    "name": "Cola",
                    "type": "DRINK",
                    "amount": 3,
                    "size": 1,
                    "fridgeId": "2"
                } as ProductBody)
                .expect(HttpStatus.CREATED);


            // Get product by id
            const { body: getResponse } = await request(app.getHttpServer())
                .get(`/api/products/${products[0].id}/user/${userId}`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);
            
            expect(getResponse.length).equal(1);
            expect(getResponse[0].name === "Chocolate").true;
            expect(getResponse[0].type === ProductType.FOOD).true;
            expect(getResponse[0].amount === 10).true;
            expect(getResponse[0].size === 5).true;
            expect(getResponse[0].fridgeId === "1").true;


            // Get all products in fridge
            const { body: fridgeProducts } = await request(app.getHttpServer())
                .get(`/api/products/fridge/1/user/${userId}`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);
            
            expect(fridgeProducts.length).equal(2);
            expect(fridgeProducts[0].name === "Chocolate" || fridgeProducts[1].name === "Chocolate").true;
            expect(fridgeProducts[0].name === "Milk" || fridgeProducts[1].name === "Milk").true;


            // Get all products in all fridges for user
            const { body: allProducts } = await request(app.getHttpServer())
                .get(`/api/products/user/${userId}`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            expect(allProducts.length).equal(3);
            expect(allProducts.some(p => p.name === "Chocolate")).true;
            expect(allProducts.some(p => p.name === "Milk")).true;
            expect(allProducts.some(p => p.name === "Cola")).true;


            // Get all products on given location for user
            const location = 1;
            const { body: locationProducts } = await request(app.getHttpServer())
                .get(`/api/products/location/${location}/user/${userId}`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            expect(locationProducts.length).equal(2);
            expect(locationProducts.some(p => p.name === "Chocolate")).true;
            expect(locationProducts.some(p => p.name === "Milk")).true;


            // Gift product to user 2
            products = await prisma.product.findMany();
            const colaId = products.find(p => p.name === "Cola")!.id;

            const { body: giftResponse } = await request(app.getHttpServer())
                .patch(`/api/products/${colaId}/gift/${userId}/2`)
                .set("x-auth", token)
                .send()
                .expect(HttpStatus.OK);

            expect(giftResponse).empty;
            const giftedProduct = await prisma.productFridge.findFirst({
                where: { 
                    productId: colaId,
                    userId: "2"
                }
            });
            expect(giftedProduct).not.null;
            expect(giftedProduct!.quantity).equal(3);

            
            // Gift all products from fridge 1 to user 2
            const { body: giftAllInFridgeResponse } = await request(app.getHttpServer())
                .patch(`/api/products/fridge/1/gift/${userId}/2`)
                .set("x-auth", token)
                .send()
                .expect(HttpStatus.OK);

            expect(giftAllInFridgeResponse).empty;
            const giftedProducts = await prisma.productFridge.findMany({
                where: {
                    fridgeId: "1",
                    userId: "2"
                }
            });
            expect(giftedProducts.length).equal(2);


            // Gift all products from all fridges to user 1 (since user 2 is now the owner of everything)
            const { body: giftAllResponse } = await request(app.getHttpServer())
                .patch(`/api/products/gift/2/1`)
                .set("x-auth", token)
                .send()
                .expect(HttpStatus.OK);

            expect(giftAllResponse).empty;
            const giftedProducts2 = await prisma.productFridge.findMany({
                where: {
                    userId: "1"
                }
            });
            expect(giftedProducts2.length).equal(3);


            // Delete product from fridge 2
            products = await prisma.product.findMany();
            const colaIdNew = products.find(p => p.name === "Cola")!.id;

            await request(app.getHttpServer())
                .delete(`/api/products/${colaIdNew}`)
                .set("x-auth", token)
                .send({
                    userId: "1",
                    amount: 1,
                    fridgeId: "2"
                })
                .expect(HttpStatus.NO_CONTENT);
            
            const remainingProducts = await prisma.productFridge.findMany({
                where: { fridgeId: "2" }
            });
            expect(remainingProducts.length).equal(1);
            expect(remainingProducts[0].productId).equal(colaIdNew);
            expect(remainingProducts[0].quantity).equal(2);


            // Delete all products from fridge 1
            await request(app.getHttpServer())
                .delete(`/api/products/fridge/1/user/${userId}`)
                .set("x-auth", token)
                .send()
                .expect(HttpStatus.NO_CONTENT);

            const remainingProducts2 = await prisma.productFridge.findMany({
                where: { fridgeId: "1" }
            });
            expect(remainingProducts2.length).equal(0);


            // Add a product to fridge 1
            await request(app.getHttpServer())
                .post(`/api/products/${userId}`)
                .set("x-auth", token)
                .send({
                    "name": "Milk",
                    "type": "DRINK",
                    "amount": 5,
                    "size": 2,
                    "fridgeId": "1"
                } as ProductBody)
                .expect(HttpStatus.CREATED);


            // Delete all products from all fridges for user 1
            await request(app.getHttpServer())
                .delete(`/api/products/user/${userId}`)
                .set("x-auth", token)
                .send()
                .expect(HttpStatus.NO_CONTENT);

            const remainingProducts3 = await prisma.productFridge.findMany({
                where: { userId: "1" }
            });
            expect(remainingProducts3.length).equal(0);
        });
    });
});