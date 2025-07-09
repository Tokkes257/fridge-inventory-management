import { UnauthorizedException } from "@nestjs/common";
import { AccessTokenView } from "../../../contracts/accessToken.view";
import { LoginBody } from "../../../contracts/login.body";
import * as jwt from "jsonwebtoken";
import config from "../../../config.json";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";


export const createToken = async (body: LoginBody): Promise<AccessTokenView> => {
    const user = await prisma.user.findUnique({
        where: { email: body.email },
    });

    if (
        !user || 
        !(await bcrypt.compare(body.password, user.password))
    ) {
        throw new UnauthorizedException("Invalid credentials");
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
		expiresIn: "1h",
	});

    return {
        token,
        expiresIn: 3600,
    };
};