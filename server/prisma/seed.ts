import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding QuickOrder database...");

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync("Password123!", salt);

  // Seed Users
  const customer = await prisma.user.upsert({
    where: { email: "customer@quickorder.local" },
    update: {},
    create: {
      email: "customer@quickorder.local",
      fullName: "Patiharn Liangkobkit",
      passwordHash,
      role: "CUSTOMER",
    },
  });

  const secondCustomer = await prisma.user.upsert({
    where: { email: "customer2@quickorder.local" },
    update: {},
    create: {
      email: "customer2@quickorder.local",
      fullName: "Customer Two",
      passwordHash,
      role: "CUSTOMER",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@quickorder.local" },
    update: {},
    create: {
      email: "staff@quickorder.local",
      fullName: "Tanakrit Sunthonwetchapong",
      passwordHash,
      role: "STAFF",
    },
  });

  console.log(
    `Seeded users: ${customer.email} (CUSTOMER), ${secondCustomer.email} (CUSTOMER), ${staff.email} (STAFF)`
  );

  // Seed Menu Items
  const items = [
    {
      name: "Classic Cheeseburger",
      description: "Grilled beef patty with melted cheddar, crisp lettuce, and special sauce",
      category: "Mains",
      price: 149.0,
      stock: 20,
      isAvailable: true,
    },
    {
      name: "Crispy Chicken Burger",
      description: "Golden fried chicken breast with spicy garlic mayo and pickled cabbage",
      category: "Mains",
      price: 139.0,
      stock: 15,
      isAvailable: true,
    },
    {
      name: "Truffle Parmesan Fries",
      description: "Hand-cut potato fries drizzled with aromatic truffle oil and aged parmesan",
      category: "Sides",
      price: 89.0,
      stock: 2,
      isAvailable: true,
    },
    {
      name: "Iced Caramel Macchiato",
      description: "Freshly pulled espresso with velvety milk and rich salted caramel syrup",
      category: "Beverages",
      price: 75.0,
      stock: 30,
      isAvailable: true,
    },
    {
      name: "Ceremonial Matcha Latte",
      description: "Japanese Uji matcha whisked with fresh milk and mild cane syrup",
      category: "Beverages",
      price: 70.0,
      stock: 0,
      isAvailable: false,
    },
  ];

  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.menuItem.create({ data: item });
    }
  }

  console.log(`Seeded ${items.length} menu items.`);
  console.log("Database seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
