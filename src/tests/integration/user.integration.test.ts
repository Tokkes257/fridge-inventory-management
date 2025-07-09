import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import { before, beforeEach, after, describe, it } from "mocha";
import request from "supertest";

import { AppModule } from "../../app.module";
import { prisma } from "../../lib/prisma";
import { User } from "@prisma/client";


describe("Integration tests", () => {
	describe("User Tests", () => {
		let app: INestApplication;

		before(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule(
				{
					imports: [AppModule],
				}
			).compile();

			app = moduleFixture.createNestApplication();

			// Apply the same configuration as in main.ts
			app.useGlobalPipes(
				new ValidationPipe({
					whitelist: true,
					forbidNonWhitelisted: true,
					transform: true,
				})
			);

			app.enableCors({
				origin: "*",
				credentials: true,
				exposedHeaders: ["x-auth"],
			});

			app.setGlobalPrefix("api");

			await app.init();

            await prisma.$connect();
		});

		beforeEach(async () => {
			await prisma.user.deleteMany(); // Clean up users before each test
		});

		after(async () => {
			await app.close();
		});

        it("create user => get user => delete user", async () => {

            // Create the user
            const { body: createResponse } = await request(app.getHttpServer())
                .post(`/api/users`)
                .send({
                    firstName: "first1",
                    lastName: "last1",
                    email: "test-user+1@panenco.com",
                    password: "real secret stuff",
                } as User)
                .expect(HttpStatus.CREATED);

            expect(createResponse.firstName === "first1");
            expect(createResponse.lastName === "last1");
            expect(createResponse.email === "test-user+1@panenco.com");
            expect(createResponse.password).equal(undefined);
            expect(await prisma.user.findUnique({ where: { email: createResponse.email } })).not.null;

            
            // Login to get JWT token
            const { body: loginResponse } = await request(app.getHttpServer())
                .post(`/api/auth/login`)
                .send({
                    email: "test-user+1@panenco.com",
                    password: "real secret stuff",
                })
                .expect(HttpStatus.OK);

            const token = loginResponse.token;
            expect(token).to.be.a("string");


            // Try to access protected endpoint without token (should fail)
            await request(app.getHttpServer()).get(`/api/users`).expect(401);


            // Get the user
            const { body: getResponse } = await request(app.getHttpServer())
                .get(`/api/users/${createResponse.id}`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            expect(getResponse.firstName === "first1");
            expect(getResponse.lastName === "last1");
            expect(getResponse.email === "test-user+1@panenco.com");
            expect(getResponse.password === "real secret stuff");


            // Update the user
            const { body: updateResponse } = await request(app.getHttpServer())
                .patch(`/api/users/${createResponse.id}`)
                .send({
                    email: "mynewmail@mail.com"
                })
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            expect(updateResponse.firstName === "first1");
            expect(updateResponse.lastName === "last1");
            expect(updateResponse.email === "mynewmail@mail.com");
            expect(updateResponse.password === undefined);

            // Get all users
            const { body: getAllResponse } = await request(app.getHttpServer())
                .get(`/api/users`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            const newUser = getAllResponse.find(
                (x: User) => x.firstName === getResponse.firstName
            );
            expect(newUser).not.undefined;
            expect(newUser.firstName).equal("first1");
            expect(newUser.lastName).equal("last1");
            expect(newUser.email).equal("mynewmail@mail.com");
            expect(getAllResponse.length).equal(1);


            // Delete the user
            await request(app.getHttpServer()).delete(`/api/users/${createResponse.id}`).set("x-auth", token).expect(HttpStatus.NO_CONTENT);


            // Get all users again after deleted the only user
            const { body: getNewResponse } = await request(app.getHttpServer())
                .get(`/api/users`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);
            expect(getNewResponse.length).equal(0);
        });
	});
});