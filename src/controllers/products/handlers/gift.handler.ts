import { prisma } from "../../../lib/prisma"
import { InternalServerErrorException, NotAcceptableException, NotFoundException } from "@nestjs/common";

export const gift = async (productId: string, receiverUserId: string, senderUserId: string): Promise<void> => {

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

    // Get all productFridge entries where productId and senderUserId matches the productId in the body
    const fridgeEntries = await prisma.productFridge.findMany({
        where: {
            productId: productId,
            userId: senderUserId,
        },
    });
    if (!fridgeEntries || fridgeEntries.length === 0) {
        throw new NotFoundException("Product not found in sender's fridge");
    }

    // Upsert every fridge entry where productId, fridgeId and receiverUserId matches with the quantity from the fridge entry
    const updatedEntries = await Promise.all(fridgeEntries.map(async (entry) => {
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

    // Delete the the given products from the sender's fridge
    const deletedEntries = await prisma.productFridge.deleteMany({
        where: {
            productId: productId,
            userId: senderUserId,
        },
    });
    if (deletedEntries.count === 0) {
        throw new NotFoundException("No product fridge entries found for deletion");
    }
};