import { plainToInstance } from "class-transformer";
import { ProductView } from "../../../contracts/product/product.view";
import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const get = async (productId: string, userId: string): Promise<ProductView[]> => {

    // check that user exists
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) {
        throw new NotFoundException("User not found");
    }

    // get the product by productId from db
    const productList = await prisma.productFridge.findMany({
        where: {
            productId: productId,
            userId: userId,
        },
        include: {
            product: true,
        },
    });
    if (!productList || productList.length === 0) {
        throw new NotFoundException("Product not found");
    }

    return productList.map((product) => {
        return plainToInstance(ProductView, {
            id: product.product.id,
            name: product.product.name,
            type: product.product.type,
            size: product.product.size,
            amount: product.quantity,
            fridgeId: product.fridgeId,
        });
    });
};