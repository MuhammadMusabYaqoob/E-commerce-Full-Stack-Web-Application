import pg from "pg";

const { Pool } = pg;

export const postgresPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function connectPostgres() {
  const result = await postgresPool.query(
    "SELECT current_database() AS database"
  );

  console.log("RESULT is:----", result);
  console.log("RESULT is:----", result.command);
  console.log("RESULT is:----", result.fields);
  console.log(`->->->->->->->->->->->->->->->-> Connected to PostgreSQL database: ${result.rows[0].database}`);
}