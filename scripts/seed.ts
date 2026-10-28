import "dotenv/config";
import { db, pg } from "../src/db/client";
import { resetAndSeed } from "../src/db/seed";

resetAndSeed(db)
  .then((r) => {
    console.log("Database reset and seeded:", r);
    return pg.end();
  })
  .catch(async (e) => {
    console.error(e);
    await pg.end();
    process.exit(1);
  });
