import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";

import { create } from "../../controllers/users/handlers/create.handler";
import { deleteUser } from "../../controllers/users/handlers/delete.handler";
import { get } from "../../controllers/users/handlers/get.handler";
import { getList } from "../../controllers/users/handlers/getList.handler";
import { update } from "../../controllers/users/handlers/update.handler";
import { createToken } from "../../controllers/users/handlers/login.handler";
import { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const userFixtures = [
	{
		name: "test1",
		email: "test-user+1@panenco.com",
		password: "password1",
	},
	{
		name: "test2",
		email: "test-user+2@panenco.com",
		password: "password2",
	},
];

describe("Handler tests", () => {
	describe("User Tests", () => {
		beforeEach(() => {
			console.log("beforeEach");
		});

		it("should test absolutely nothing", () => {
			expect(true).true;
		});
	});

    describe("Users handler tests", () => {
        let users: any[];

        beforeEach(async () => {
			// Clean up database
			await prisma.user.deleteMany();

			// Create test users
			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					const hashedPassword = await bcrypt.hash(
						fixture.password,
						10
					);
					return prisma.user.create({
						data: {
							name: fixture.name,
							email: fixture.email,
							password: hashedPassword,
						},
					});
				})
			);
		});

        it("should get users", async () => {
            const res = await getList(undefined);
            expect(res.length).equal(2);
            expect(res.some((x) => x.name === "test1")).true;
            expect(res.some((x) => x.name === "test2")).true;
        });

        it("should search users", async () => {
            const res = await getList("test1");
            expect(res.length).equal(1);
            expect(res.some((x) => x.name === "test1")).true;
        });

        it("should get user by id", async () => {
            const res = await get(users[1].id);
            expect(res.name === "test2").true;
            expect(res.email === "test-user+2@panenco.com").true;
        });

        it("should fail when getting user by unknown id", async () => {
            try {
				const res = await get(randomUUID());
			} catch (error) {
				expect(error.message).equal("User not found");
				return;
			}
			expect(true, "should have thrown an error").false;
        });

        it("should create user", async () => {
            const res = await create(
                { 
                    name: "John",
                    email: "john@john.com",
                    password: "I'mJohn"
                 } as User
            );

            expect(res.name === "John");
            expect(res.email === "john@john.com");
        });

        it("should update user", async () => {
            const res = await update(
                users[1].id,
                { 
                    name: "Johnny"
                } as User
            );

            expect(res.id === 1);
            expect(res.name === "Johnny");
            expect(res.email === "test-user+2@panenco.com");
        });

        it("should delete user by id", async () => {
            const initialCount = await prisma.user.count();
			await deleteUser(users[0].id);

			expect(await prisma.user.findUnique({ where: { id: users[0].id } })).to.be.null;
			expect(initialCount - 1).equal(await prisma.user.count());
        });

        it("should login user", async () => {
            const loginBody = {
                email: "test-user+1@panenco.com",
                password: "password1"
            };
            const res = await createToken(loginBody);
            expect(res.token).to.be.a("string");
            expect(res.expiresIn).equal(3600);
        });
    });
});