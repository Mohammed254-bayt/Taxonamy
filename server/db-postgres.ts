// Alternative configuration for regular PostgreSQL
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { logQuery } from "./logger";
import dotenv from "dotenv";
dotenv.config();

// Use environment variable if available, otherwise fallback to hardcoded connection
console.log("DATABASE_URL", process.env.DATABASE_URL);
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  // Optional: configure connection pool settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
});

export const db = drizzle(pool, { 
  schema,
  logger: {
    logQuery: (query: string, params?: unknown[]) => {
      logQuery(query, params as any[]);
    }
  }
}); 