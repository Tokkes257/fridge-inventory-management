import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const deleteUser = async (id: string): Promise<void> => {
	const user = await prisma.user.findUnique({
		where: { id },
	});

	if (!user) {
		throw new NotFoundException("User not found");
	}

	await prisma.user.delete({
		where: { id },
	});
};