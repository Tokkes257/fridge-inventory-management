import { UserUpdateBody } from "../../../contracts/user.update.body";
import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { UserView } from "../../../contracts/user.view";
import { plainToInstance } from "class-transformer";

export const update = async (id: string, body: UserUpdateBody): Promise<UserView> => {
	const user = await prisma.user.findUnique({
		where: { id },
	});

	if (!user) {
		throw new NotFoundException("User not found");
	}

	const updateData: any = {};
	if (body.firstName !== undefined) updateData.firstName = body.firstName;
	if (body.lastName !== undefined) updateData.lastName = body.lastName;
	if (body.email !== undefined) updateData.email = body.email;
	if (body.password !== undefined) {
		updateData.password = await bcrypt.hash(body.password, 10);
	}

	const updated = await prisma.user.update({
		where: { id },
		data: updateData,
	});

	return plainToInstance(UserView, updated);
};