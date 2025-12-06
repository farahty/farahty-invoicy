import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// HTTP client for simple queries (faster for single operations)
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzleHttp(sql, { schema });

// Pool client for transactions (supports multi-statement transactions)
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const dbPool = drizzleServerless(pool, { schema });

export * from "./schema";
