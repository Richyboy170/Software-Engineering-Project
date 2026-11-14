import { prisma } from "../db.js";
import { InMemoryPersistenceAdapter } from "./in-memory.adapter.js";
import { PrismaPersistence } from "./prisma.adapter.js";
export function createRuntimePersistence() {
    if (process.env.NODE_ENV === "test") {
        return new InMemoryPersistenceAdapter();
    }
    return new PrismaPersistence(prisma);
}
