import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { ProductView } from "../../../contracts/product/product.view";

export const getProductsInFridge = async (userId: string, fridgeId?: string, location?: number): Promise<ProductView[]> => {

    // Check that user exists
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) {
        throw new NotFoundException("User not found");
    }

    // check that fridge exists
    if (fridgeId) {
        const fridge = await prisma.fridge.findUnique({
            where: { id: fridgeId },
        });
        if (!fridge) {
            throw new NotFoundException("Fridge not found");
        }
    }

    // Fetch products in the fridge for the user
    let productList = await prisma.productFridge.findMany({
        where: {
            userId: userId,
            fridgeId: fridgeId,
        },
        include: {
            product: true,
            fridge: location ? true : false,
        },
    });

    // If location is provided, filter products by fridge location
    if (location) {
        productList = productList.filter(product => product.fridge.location === location);
        if (productList.length === 0) {
            throw new NotFoundException(`No products found in fridge at location: ${location}`);
        }
    }

    if (!productList || productList.length === 0) {
        throw new NotFoundException("No products found in this fridge");
    }

    return productList.map((product) => plainToInstance(ProductView, {
            id: product.product.id,
            name: product.product.name,
            type: product.product.type,
            size: product.product.size,
            amount: product.quantity,
            fridgeId: product.fridgeId,
        }));
}