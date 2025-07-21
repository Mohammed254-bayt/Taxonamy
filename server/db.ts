import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { logQuery } from "./logger";
import dotenv from "dotenv";

// Load .env file from the project root
dotenv.config();

console.log("DATABASE_URL", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const db = drizzle({ 
  connection: process.env.DATABASE_URL,
  schema,
  logger: {
    logQuery: (query: string, params?: unknown[]) => {
      logQuery(query, params as any[]);
    }
  }
});