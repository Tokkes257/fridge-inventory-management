import { prisma } from "../../../lib/prisma"
import { ProductBody } from "../../../contracts/product/product.body";
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";

export const create = async (userId: string, body: ProductBody): Promise<ProductBody> => {
    // check that user exists
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) {
        throw new NotFoundException("User not found");
    }

    // Create product in database if it does not exist
    const product = await prisma.product.upsert({
        where: { name_type_size: {
            name: body.name,
            type: body.type,
            size: body.size,
        }},
        update: {},
        create: {
            name: body.name,
            type: body.type,
            size: body.size,
        },
    });
    if (!product) {
        throw new InternalServerErrorException("Failed to create or find product");
    }

    const sizeNeeded = body.amount * body.size;

    // Get the fridge from db
    const fridge = await prisma.fridge.findUnique({
        where: {
            id: body.fridgeId,
        },
    });
    if (!fridge) {
        throw new NotFoundException("Fridge not found");
    }

    // Get all entries where fridgeId matches the fridgeId in the body (from the productFridge table) and join with products
    const fridgeEntries = await prisma.productFridge.findMany({
        where: {
            fridgeId: body.fridgeId,
        },
        include: {
            product: true,
        },
    });
    if (!fridgeEntries) {
        throw new InternalServerErrorException("Failed to retrieve fridge entries");
    }

    // Calculate total size of all products in the fridge
    const totalSize = fridgeEntries.reduce((acc, entry) => {
        return acc + entry.product.size * entry.quantity;
    }, 0);
    if (totalSize + sizeNeeded > fridge.capacity) {
        throw new NotFoundException("Not enough space in the fridge");
    }


    // Put the product in the fridge or update quantity if it already exists
    const productFridge = await prisma.productFridge.upsert({
        where: {
            productId_fridgeId_userId: {
                productId: product.id,
                fridgeId: body.fridgeId,
                userId: userId,
            },
        },
        update: {
            quantity: {
                increment: body.amount,
            },
        },
        create: {
            productId: product.id,
            userId: userId,
            fridgeId: body.fridgeId,
            quantity: body.amount,
        },
    });
    if (!productFridge) {
        throw new InternalServerErrorException("Failed to add product to fridge");
    }

    return body;
};