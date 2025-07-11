import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { UserView } from "../../../contracts/user/user.view";

export const getList = async (search?: string): Promise<UserView[]> => {
    const where = search
		? {
            OR: [
                {
                    firstName: {
                        contains: search,
                        mode: "insensitive" as const,
                    },
                },
                {
                    lastName: {
                        contains: search,
                        mode: "insensitive" as const,
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: "insensitive" as const,
                    },
                },
            ],
		  }
		: {};

    const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    return users.map(user => plainToInstance(UserView, user));
};