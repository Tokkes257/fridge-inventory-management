import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const deleteAllProductsInFridge = async (
    userId: string,
    fridgeId?: string
): Promise<void> => {

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new NotFoundException("User not found");
    }

    // Check if the fridge exists
    if (fridgeId) {
        const fridge = await prisma.fridge.findUnique({
            where: { id: fridgeId },
        });
        if (!fridge) {
            throw new NotFoundException("Fridge not found");
        }
    }

    // Delete all productFridge entries for the user in the specified fridge
    const deletedEntries = await prisma.productFridge.deleteMany({
        where: {
            userId: userId,
            fridgeId: fridgeId,
        },
    });

    if (deletedEntries.count === 0) {
        throw new NotFoundException("No products found in this fridge for the user to delete");
    }
}