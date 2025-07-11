import { plainToInstance } from "class-transformer";
import { UserBody } from "../../../contracts/user/user.body";
import { UserView } from "../../../contracts/user/user.view";
import { prisma } from "../../../lib/prisma"
import bcrypt from "bcryptjs";

export const create = async (body: UserBody): Promise<UserView> => {
	// Hash the password before saving
	const hashedPassword = await bcrypt.hash(body.password, 10);

	// Add user to the DB
	const user = await prisma.user.create({
		data: {
			firstName: body.firstName,
			lastName: body.lastName,
			email: body.email,
			password: hashedPassword,
		},
	});

	return plainToInstance(UserView, user);
};