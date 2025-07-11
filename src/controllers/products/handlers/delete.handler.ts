import { NotFoundException } from "@nestjs/common";
import { ProductDeleteBody } from "../../../contracts/product/product.delete.body";
import { prisma } from "../../../lib/prisma";

export const deleteProduct = async (productId: string, body: ProductDeleteBody): Promise<void> => {

    // Delete the product from the fridge when body.amount is more than what's stored, otherwise reduce the quantity stored in the fridge
    const deleted = await prisma.productFridge.deleteMany({
        where: {
            productId: productId,
            fridgeId: body.fridgeId,
            userId: body.userId,
            quantity: {
                lte: body.amount,
            },
        },
    });

    // if deleted count is 0, try to reduce the quantity
    if (deleted.count === 0) {
        const updated = await prisma.productFridge.updateMany({
            where: {
                productId: productId,
                fridgeId: body.fridgeId,
                userId: body.userId,
            },
            data: {
                quantity: {
                    decrement: body.amount,
                },
            },
        });

        if (updated.count === 0) {
            throw new NotFoundException("No product found to update quantity");
        }
    }
}