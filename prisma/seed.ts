import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function main() {
    // Add some fridges to the database
    await prisma.fridge.upsert({
        where: { id: "1" },
        update: {},
        create: {
            id: "1",
            location: 1,
            capacity: 100,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "2" },
        update: {},
        create: {
            id: "2",
            location: 1,
            capacity: 50,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "3" },
        update: {},
        create: {
            id: "3",
            location: 2,
            capacity: 80,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "4" },
        update: {},
        create: {
            id: "4",
            location: 3,
            capacity: 100,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "5" },
        update: {},
        create: {
            id: "5",
            location: 3,
            capacity: 50,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "6" },
        update: {},
        create: {
            id: "6",
            location: 4,
            capacity: 100,
        },
    });
    await prisma.fridge.upsert({
        where: { id: "7" },
        update: {},
        create: {
            id: "7",
            location: 4,
            capacity: 200,
        },
    });

    // Add 2 basic users to the database
    await prisma.user.delete({ where: { id: "1" } }).catch(() => {});
    await prisma.user.create({
        data: {
            id: "1",
            email: "a@a.com",
            password: await bcrypt.hash("password", 10),
            firstName: "John",
            lastName: "Doe",
        },
    });

    await prisma.user.delete({ where: { id: "2" } }).catch(() => {});
    await prisma.user.create({
        data: {
            id: "2",
            email: "b@b.com",
            password: await bcrypt.hash("password", 10),
            firstName: "Jane",
            lastName: "Doe",
        },
    });
};

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })