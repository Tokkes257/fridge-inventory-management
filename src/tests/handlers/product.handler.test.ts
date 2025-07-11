import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";

import { create } from "../../controllers/products/handlers/create.handler";
import { deleteProduct } from "../../controllers/products/handlers/delete.handler";
import { deleteAllProductsInFridge } from "../../controllers/products/handlers/deleteAllProductsInFridge.handler";
import { get } from "../../controllers/products/handlers/get.handler";
import { getProductsInFridge } from "../../controllers/products/handlers/getProductsInFridge.handler";
import { gift } from "../../controllers/products/handlers/gift.handler";
import { giftAllProductsInFridge } from "../../controllers/products/handlers/giftAllProductsInFridge.handler";

import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { PrismaClient, ProductType } from "@prisma/client";
import { ProductBody } from "../../contracts/product/product.body";


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
    await prisma.fridge.upsert({
        where: { id: "3" },
        update: {},
        create: {
            id: "3",
            location: 2,
            capacity: 80,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "4" },
        update: {},
        create: {
            id: "4",
            location: 3,
            capacity: 100,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "5" },
        update: {},
        create: {
            id: "5",
            location: 3,
            capacity: 50,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "6" },
        update: {},
        create: {
            id: "6",
            location: 4,
            capacity: 100,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "7" },
        update: {},
        create: {
            id: "7",
            location: 4,
            capacity: 200,
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

    await prisma.user.delete({ where: { id: "3" } }).catch(() => {});
    await prisma.user.create({
        data: {
            id: "3",
            email: "c@c.com",
            password: await bcrypt.hash("password", 10),
            firstName: "Someone",
            lastName: "Else",
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

    // add a product to fridge 2 for user 1
    await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                userId: "1",
                fridgeId: "2",
                productId: "1",
            },
        },
        update: {},
        create: {
            userId: "1",
            fridgeId: "2",
            productId: "1",
            quantity: 5,
        },
    });

    // add products to fridge 5 for user 1
    await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                userId: "2",
                fridgeId: "5",
                productId: "2",
            },
        },
        update: {},
        create: {
            userId: "2",
            fridgeId: "5",
            productId: "2",
            quantity: 3,
        },
    });

    await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                userId: "2",
                fridgeId: "5",
                productId: "3",
            },
        },
        update: {},
        create: {
            userId: "2",
            fridgeId: "5",
            productId: "3",
            quantity: 5,
        },
    });
};

describe("Product handler tests", () => {
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
    });

    describe("Create product tests", () => {
        it("should create a product in the fridge", async () => {
            const userId = "1";
            const body = {
                name: "Milk",
                type: ProductType.DRINK,
                size: 1,
                amount: 2,
                fridgeId: "1",
            } as ProductBody;

            const res = await create(userId, body);
            expect(res.name).equal("Milk");
            expect(res.type).equal(ProductType.DRINK);
            expect(res.size).equal(1);
            expect(res.amount).equal(2);
            expect(res.fridgeId).equal("1");

            // Verify product is in the database
            const product = await prisma.productFridge.findFirst({
                where: {
                    userId: userId,
                    fridgeId: "1",
                    product: {
                        name: "Milk",
                    },
                },
                include: {
                    product: true,
                    fridge: true,
                },
            });
            expect(product).not.null;
            expect(product!.product.name).equal("Milk");
            expect(product!.product.type).equal(ProductType.DRINK);
            expect(product!.quantity).equal(2);
            expect(product!.fridgeId).equal("1");
            expect(product!.fridge.location).equal(1);
        });

        it("should not create a product if user does not exist", async () => {
            const userId = "999";
            const body = {
                name: "Milk",
                type: ProductType.DRINK,
                size: 1,
                amount: 2,
                fridgeId: "1",
            } as ProductBody;

            try {
                await create(userId, body);
            } catch (error) {
                expect(error.message).include("User not found");
            }
        });

        it("should not add to fridge if fridge does not exist", async () => {
            const userId = "1";
            const body = {
                name: "Milk",
                type: ProductType.DRINK,
                size: 1,
                amount: 2,
                fridgeId: "999",
            } as ProductBody;

            try {
                await create(userId, body);
            } catch (error) {
                expect(error.message).include("Fridge not found");
            }
        });

        it("should not add to fridge if not enough space in fridge", async () => {
            const userId = "1";
            const body = {
                name: "Milk",
                type: ProductType.DRINK,
                size: 200,
                amount: 2,
                fridgeId: "1",
            } as ProductBody;

            try {
                await create(userId, body);
            } catch (error) {
                expect(error.message).include("Not enough space in the fridge");
            }
        });

        it("should not create a product if product already exists", async () => {
            const userId = "1";
            const body = {
                name: "Chocolate",
                type: ProductType.FOOD,
                size: 1,
                amount: 2,
                fridgeId: "1",
            } as ProductBody;

            // Since chocolate already exists, adding it again should have no effect
            const res = await create(userId, body);
            
            const chocolateProducts = await prisma.product.findMany({
                where: {
                    name: "Chocolate",
                    type: ProductType.FOOD,
                    size: 1,
                },
            });
            expect(chocolateProducts.length).equal(1);
        });

        it("should update quantity if product already exists in fridge", async () => {
            const userId = "1";
            const body = {
                name: "Chocolate",
                type: ProductType.FOOD,
                size: 1,
                amount: 2,
                fridgeId: "1",
            } as ProductBody;

            // already seeded with 3, so adding 2 results in 5
            await create(userId, body);

            const product = await prisma.productFridge.findFirst({
                where: {
                    userId: userId,
                    fridgeId: "1",
                    product: {
                        name: "Chocolate",
                    },
                },
            });
            expect(product).not.null;
            expect(product!.quantity).equal(5);
        });
    });

    describe("Delete product tests", () => {
        it("should not delete product if it is in no fridges", async () => {
            const userId = "1";
            const productId = "1";
            const body = {
                fridgeId: "1",
                userId: userId,
                amount: 5,
            };

            await deleteProduct(productId, body);

            body.fridgeId = "2";
            await deleteProduct(productId, body);

            const product = await prisma.product.findUnique({
                where: { id: productId },
            });
            expect(product).not.null;
            expect(product!.name).equal("Chocolate");
            expect(product!.type).equal(ProductType.FOOD);
            expect(product!.size).equal(1);

            // check that no fridge has the deleted product
            const productFridge = await prisma.productFridge.findFirst({
                where: {
                    productId: productId,
                },
            });
            expect(productFridge).null;
        });

        it("should delete product from fridge (for given user) if the quantity to delete >= quantity in fridge", async () => {
            const userId = "1";
            const productId = "1";
            const body = {
                fridgeId: "1",
                userId: userId,
                amount: 5,
            };

            await deleteProduct(productId, body);

            // check that no fridge has the deleted product
            const productFridge = await prisma.productFridge.findFirst({
                where: {
                    productId: productId,
                    fridgeId: "1",
                    userId: userId,
                },
            });
            expect(productFridge).null;

            // fridge should be empty (because we deleted the sole contents of it)
            const fridgeEntries = await prisma.productFridge.findMany({
                where: {
                    fridgeId: "1",
                },
            });
            expect(fridgeEntries).empty;
        });

        it("should decrease quantity if amount to delete < quantity in fridge", async () => {
            const userId = "1";
            const productId = "1";
            const body = {
                fridgeId: "1",
                userId: userId,
                amount: 2,
            };

            await deleteProduct(productId, body);

            const productFridge = await prisma.productFridge.findFirst({
                where: {
                    productId: productId,
                    fridgeId: "1",
                    userId: userId,
                },
            });
            expect(productFridge).not.null;
            expect(productFridge!.quantity).equal(1);
        });
    });

    describe("Delete all products in fridge test", () => {
        it("should throw error when user does not exist", async () => {
            try {
                await deleteAllProductsInFridge("999");
            } catch (error) {
                expect(error.message).include("User not found");
            }
        });

        it("should throw error when fridge does not exist", async () => {
            try {
                await deleteAllProductsInFridge("1", "999");
            } catch (error) {
                expect(error.message).include("Fridge not found");
            }
        });

        it("should throw error when fridge does not have user's products", async () => {
            try {
                await deleteAllProductsInFridge("1", "7");
            } catch (error) {
                expect(error.message).include("No products found in this fridge for the user to delete");
            }
        });

        it("should delete all products from given fridge for given user", async () => {
            const userId = "1";
            const body = {
                name: "Milk",
                type: ProductType.DRINK,
                size: 1,
                amount: 2,
                fridgeId: "1",
            } as ProductBody;

            create(userId, body);

            try {
                await deleteAllProductsInFridge(userId, "1");
            } catch (error) {
                expect(error).null;
                const products = await prisma.productFridge.findMany({
                    where: {
                        userId: userId,
                        fridgeId: "1"
                    }
                })
                expect(products).equal([]);

                const products2 = await prisma.productFridge.findMany({
                    where: {
                        userId: userId,
                        fridgeId: "2"
                    }
                })
                expect(products2.length).equal(1);
            }
        });

        it("should delete all products from all fridges for given user", async () => {
            const userId = "1";

            try {
                await deleteAllProductsInFridge(userId);
            } catch (error) {
                expect(error).null;
                const products = await prisma.productFridge.findMany({
                    where: {
                        userId: userId,
                    }
                })
                expect(products).equal([]);
            }
        });
    });

    describe("Get product tests", () => {
        it("should throw error when user does not exist", async () => {
            try {
                await get("1", "999");
            } catch (error) {
                expect(error.message).include("User not found");
            }
        });

        it("should get product by id", async () => {
            const userId = "1";
            const productId = "1";

            const products = await get(productId, userId);

            expect(products.length).equal(2);
            const sortedProducts = products.sort((a, b) => a.fridgeId.localeCompare(b.fridgeId));
            expect(sortedProducts[0].fridgeId).equal("1");
            expect(sortedProducts[1]).include(
                {
                    id: "1",
                    name: "Chocolate",
                    type: ProductType.FOOD,
                    size: 1,
                    amount: 5,
                    fridgeId: "2"
                }
            );
        })
        
        it("should throw error when retrieving product that user does not have", async () => {
            try {
                await get("1", "1");
            } catch (error) {
                expect(error.message).include("Product not found");
            }
        });
    });

    describe("Get products in fridge for given user", () => {
        it("should throw error when user does not exist", async () => {
            try {
                await getProductsInFridge("999", "1");
            } catch (error) {
                expect(error.message).include("User not found");
            }
        });

        it("should throw error when fridge does not exist", async () => {
            try {
                await getProductsInFridge("1", "999");
            } catch (error) {
                expect(error.message).include("Fridge not found");
            }
        });

        it("should get products from given fridge for given user", async () => {
            const fridgeId = "1";
            const userId = "1";

            const body = {
                name: "Milk",
                type: ProductType.DRINK,
                size: 1,
                amount: 2,
                fridgeId: "1",
            } as ProductBody;
            const res = await create(userId, body);


            const products = await getProductsInFridge(userId, fridgeId);
            
            expect(products.length).equal(2);
            expect(products[0]).include(
                {
                    id: "1",
                    name: "Chocolate",
                    type: ProductType.FOOD,
                    size: 1,
                    amount: 3,
                    fridgeId: "1",
                }
            );
            expect(products[1]).include(body);
        });

        it("should throw error when no products found for the given fridge", async () => {
            const userId = "1";
            const fridgeId = "6";

            try {
                const products = await getProductsInFridge(userId, fridgeId);
            } catch (error) {
                expect(error.message).include("No products found in this fridge");
            }
            
        });

        it("should get all products on given location for given user", async () => {
            const userId = "1";
            const location = 1;

            const products = await getProductsInFridge(userId, undefined, location);

            expect(products.length).equal(2);

            const fridge1 = {
                id: "1",
                name: "Chocolate",
                type: ProductType.FOOD,
                size: 1,
                amount: 3,
                fridgeId: "1",
            }
            const fridge2 = {
                id: "1",
                name: "Chocolate",
                type: ProductType.FOOD,
                size: 1,
                amount: 5,
                fridgeId: "2",
            }

            products.sort((a, b) => a.fridgeId.localeCompare(b.fridgeId));
            expect(products[0]).include(fridge1);
            expect(products[1]).include(fridge2);
        });

        it("should throw error when no products found for the given location", async () => {
            const userId = "1";
            const location = 3;
            try {
                await getProductsInFridge(userId, undefined, location);
            } catch (error) {
                expect(error.message).include(`No products found in fridge at location: ${location}`)
            }
        });
    });

    describe("Gift product tests", () => {
        it("should throw error if sender and receiver are the same", async () => {
            const senderUserId = "1";
            const receiverUserId = "1";
            const productId = "1";
            try {
                await gift(productId, receiverUserId, senderUserId);
            } catch (error) {
                expect(error.message).include("Sender and receiver cannot be the same user");
            }
        });

        it("should throw error if sender or receiver does not exist", async () => {
            try {
                await gift("1", "1", "999");
            } catch (error) {
                expect(error.message).include("Sender or receiver user not found");
            }

            try {
                await gift("1", "999", "1");
            } catch (error) {
                expect(error.message).include("Sender or receiver user not found");
            }
        });

        it("should throw error if sender does not have the product in any fridge", async () => {
            const senderUserId = "1";
            const receiverUserId = "2";
            const productId = "2";

            try {
                await gift(productId, receiverUserId, senderUserId);
            } catch (error) {
                expect(error.message).include("Product not found in sender's fridge");
            }
        });

        it("should gift product to other user", async () => {
            const senderUserId = "1";
            const receiverUserId = "2";
            const productId = "1";

            await gift(productId, receiverUserId, senderUserId);

            const receiverProductFridge = await prisma.productFridge.findMany({
                where: {
                    userId: receiverUserId,
                    productId: productId,
                },
            });
            expect(receiverProductFridge).not.empty;
            expect(receiverProductFridge.length).equal(2);
            const sortedReceiverProductFridge = receiverProductFridge.sort((a, b) => a.fridgeId.localeCompare(b.fridgeId));
            expect(sortedReceiverProductFridge[0].quantity).equal(3);
            expect(sortedReceiverProductFridge[0].fridgeId).equal("1");
            expect(sortedReceiverProductFridge[1].quantity).equal(5);
            expect(sortedReceiverProductFridge[1].fridgeId).equal("2");

            const senderProductFridge = await prisma.productFridge.findFirst({
                where: {
                    userId: senderUserId,
                    productId: productId,
                },
            });
            expect(senderProductFridge).null;
        });
    });

    describe("Gift products in fridge tests", () => {
        it("should throw error if sender and receiver are the same", async () => {
            const senderUserId = "1";
            const receiverUserId = "1";
            const productId = "1";
            try {
                await giftAllProductsInFridge(productId, receiverUserId, senderUserId);
            } catch (error) {
                expect(error.message).include("Sender and receiver cannot be the same user");
            }
        });

        it("should throw error if sender or receiver does not exist", async () => {
            try {
                await giftAllProductsInFridge("999", "1", "999");
            } catch (error) {
                expect(error.message).include("Sender or receiver user not found");
            }

            try {
                await giftAllProductsInFridge("1", "999", "1");
            } catch (error) {
                expect(error.message).include("Sender or receiver user not found");
            }
        });

        it("should throw error if fridge does not exist", async () => {
            try {
                await giftAllProductsInFridge("1", "2", "999");
            } catch (error) {
                expect(error.message).include("Fridge not found");
            }
        });

        it("should gift all products in given fridge to given user", async () => {
            const senderId = "2";
            const receiverId = "1";
            const fridgeId = "5";

            // user 1 should have 0 items, user 2 should have 2
            let products = await prisma.productFridge.findMany({
                where: {
                    userId: receiverId,
                    fridgeId: fridgeId
                }
            });
            expect(products.length).equal(0);
            products = await prisma.productFridge.findMany({
                where: {
                    userId: senderId,
                    fridgeId: fridgeId
                }
            });
            expect(products.length).equal(2);

            await giftAllProductsInFridge(senderId, receiverId, fridgeId);

            // user 1 should have 2 items, user 2 should have 0
            products = await prisma.productFridge.findMany({
                where: {
                    userId: receiverId,
                    fridgeId: fridgeId
                }
            });
            expect(products.length).equal(2);
            products = await prisma.productFridge.findMany({
                where: {
                    userId: senderId,
                    fridgeId: fridgeId
                }
            });
            expect(products.length).equal(0);
        });

        it("should throw error when no products in given fridge", async () => {
            const senderId = "1";
            const receiverId = "2";
            const fridgeId = "5";

            try {
                await giftAllProductsInFridge(senderId, receiverId, fridgeId);
            } catch (error) {
                expect(error.message).contains("No products found in fridge(s)");
            }
        });

        it("should gift all products from all fridges to given user", async () => {
            const senderId = "1";
            const receiverId = "3";
            const fridgeId = undefined;

            // user 1 should have 2 items, user 3 should have 0
            let products = await prisma.productFridge.findMany({
                where: {
                    userId: senderId,
                }
            });
            expect(products.length).equal(2);
            products = await prisma.productFridge.findMany({
                where: {
                    userId: receiverId,
                }
            });
            expect(products.length).equal(0);

            // user 1 gives all products he/she owns to user 3
            await giftAllProductsInFridge(senderId, receiverId, fridgeId);

            // user 1 should have 0 items, user 3 should have 2
            products = await prisma.productFridge.findMany({
                where: {
                    userId: senderId,
                }
            });
            expect(products.length).equal(0);
            products = await prisma.productFridge.findMany({
                where: {
                    userId: receiverId,
                }
            });
            expect(products.length).equal(2);

            // products of user 3 should be in fridges with ids 1 and 2
            const sortedProducts = products.sort((a, b) => a.fridgeId.localeCompare(b.fridgeId));
            expect(sortedProducts[0].fridgeId).equal("1");
            expect(sortedProducts[1].fridgeId).equal("2");
        })

        it("should throw error when user has no products in any fridge", async () => {
            const senderId = "3";
            const receiverId = "1";
            const fridgeId = undefined;

            try {
                await giftAllProductsInFridge(senderId, receiverId, fridgeId);
            } catch (error) {
                expect(error.message).contains("No products found in fridge(s)");
            }
        });
    });
});