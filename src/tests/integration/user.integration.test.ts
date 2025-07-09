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
                    name: "test",
                    email: "test-user+1@panenco.com",
                    password: "real secret stuff",
                } as User)
                .expect(HttpStatus.CREATED);
            
            expect(createResponse.name === "test");
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

            expect(getResponse.name === "test");
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

            expect(updateResponse.name === "test");
            expect(updateResponse.email === "mynewmail@mail.com");
            expect(updateResponse.password === undefined);

            // Get all users
            const { body: getAllResponse } = await request(app.getHttpServer())
                .get(`/api/users`)
                .set("x-auth", token)
                .expect(HttpStatus.OK);

            const newUser = getAllResponse.find(
                (x: User) => x.name === getResponse.name
            );
            expect(newUser).not.undefined;
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


// bootstrapping the server with supertest
/* describe("Integration tests", () => {
	describe("User Tests", () => {
		let request: any;
		beforeEach(() => {
			UserStore.users = [];
			const app = new AppModule();
			request = supertest(app.host);
		});

        it("create user => get user => delete user", async () => {

            // Create the user
            const { body: createResponse } = await request
                .post(`/api/users`) // post a certain route
                .send({
                    name: "test",
                    email: "test-user+1@panenco.com",
                    password: "real secret stuff",
                } as User) // Send a request body
                .set("x-auth", "api-key") // Set some header
                .expect(200); // Here you can already expect a certain status code.
            
            expect(createResponse.name === "test");
            expect(createResponse.email === "test-user+1@panenco.com");
            expect(createResponse.password).equal(undefined);
            expect(UserStore.users.some((x) => x.email === createResponse.email)).true;


            // Get the user
            const { body: getResponse } = await request
                .get(`/api/users/${createResponse.id}`) // post a certain route
                .send() // Send a request body
                .expect(200); // Here you can already expect a certain status code.

            expect(getResponse.name === "test");
            expect(getResponse.email === "test-user+1@panenco.com");
            expect(getResponse.password === "real secret stuff");


            // Update the user
            const { body: updateResponse } = await request
                .patch(`/api/users/${createResponse.id}`) // post a certain route
                .send({
                    id: createResponse.id,
                    email: "mynewmail@mail.com"
                }) // Send a request body
                .expect(200); // Here you can already expect a certain status code.

            expect(updateResponse.name === "test");
            expect(updateResponse.email === "mynewmail@mail.com");
            expect(updateResponse.password === undefined);

            // Get all users
            const { body: getAllResponse } = await request
                .get(`/api/users`)
                .expect(200);

            const newUser = getAllResponse.find(
                (x: User) => x.name === getResponse.name
            );
            expect(newUser).not.undefined;
            expect(newUser.email).equal("mynewmail@mail.com");


            // Delete the user
            await request.delete(`/api/users/${createResponse.id}`).expect(204);


            // Get all users again after deleted the only user
            const { body: getNewResponse } = await request
                .get(`/api/users`)
                .expect(200);
            expect(getNewResponse.length).equal(0);
        });
	});
}); */