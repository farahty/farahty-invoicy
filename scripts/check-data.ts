import "dotenv/config";
import { db, clients, invoices } from "../db";
import { isNull, count } from "drizzle-orm";

async function checkData() {
  const clientsWithoutOrg = await db
    .select({ count: count() })
    .from(clients)
    .where(isNull(clients.organizationId));
  const invoicesWithoutOrg = await db
    .select({ count: count() })
    .from(invoices)
    .where(isNull(invoices.organizationId));

  console.log("Clients without organizationId:", clientsWithoutOrg[0].count);
  console.log("Invoices without organizationId:", invoicesWithoutOrg[0].count);

  process.exit(0);
}

checkData().catch((e) => {
  console.error(e);
  process.exit(1);
});
