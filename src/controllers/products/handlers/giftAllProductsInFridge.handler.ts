import { InternalServerErrorException, NotAcceptableException, NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const giftAllProductsInFridge = async (
    senderUserId: string,
    receiverUserId: string,
    fridgeId?: string
): Promise<void> => {

    // Check that sender and receiver are not the same
    if (senderUserId === receiverUserId) {
        throw new NotAcceptableException("Sender and receiver cannot be the same user");
    }

    // Check that sender and receiver exist
    const users = await prisma.user.findMany({
        where: {
            id: { in: [senderUserId, receiverUserId] },
        },
    });
    if (users.length !== 2) {
        throw new NotFoundException("Sender or receiver user not found");
    }

    // Check that fridge exists
    if (fridgeId !== undefined) {
        const fridge = await prisma.fridge.findUnique({
            where: { id: fridgeId },
        });
        if (!fridge) {
            throw new NotFoundException("Fridge not found");
        }
    }

    // Fetch all products in the fridge for the sender
    const products = await prisma.productFridge.findMany({
        where: {
            userId: senderUserId,
            ...(fridgeId !== undefined && { fridgeId }),
        },
    });
    if (!products || products.length === 0) {
        throw new NotFoundException("No products found in fridge(s)");
    }

    // Give receiverUserId all products in the fridge
    const updatedEntries = await Promise.all(products.map(async (entry) => {
            return prisma.productFridge.upsert({
                where: {
                    productId_fridgeId_userId: {
                        productId: entry.productId,
                        fridgeId: entry.fridgeId,
                        userId: receiverUserId,
                    },
                },
                update: {
                    quantity: {
                        increment: entry.quantity,
                    },
                },
                create: {
                    productId: entry.productId,
                    fridgeId: entry.fridgeId,
                    userId: receiverUserId,
                    quantity: entry.quantity,
                },
            });
        }));
        if (!updatedEntries || updatedEntries.length === 0) {
            throw new InternalServerErrorException("Failed to update or create product fridge entries");
        }
    
        // Delete the productFridge entries from the sender's fridge
        const deletedEntries = await Promise.all(products.map(async (entry) => {
            return prisma.productFridge.deleteMany({
                where: {
                    productId: entry.productId,
                    fridgeId: entry.fridgeId,
                    userId: senderUserId,
                },
            });
        }));
        if (!deletedEntries || deletedEntries.length === 0) {
            throw new NotFoundException("No product fridge entries found for deletion");
        }
}