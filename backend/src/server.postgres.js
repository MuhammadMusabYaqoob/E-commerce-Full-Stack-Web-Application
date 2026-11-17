import "dotenv/config";
import { connectPostgres } from "./db/postgres.js";
import { app } from "./app.postgres.js";

const PORT = process.env.PORT || 8080;

try {
  await connectPostgres();
  app.listen(PORT, () => {
    console.log(`PostgreSQL API server is running on port ${PORT}`);
  });
} catch (error) {
  console.error("PostgreSQL connection failed:", error.message);
  process.exit(1);
}