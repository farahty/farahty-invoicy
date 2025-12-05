import "dotenv/config";
import { db, clients, invoices, users } from "../db";
import { members, organizations } from "../db/schema";
import { isNull, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Migration script to assign existing clients and invoices to organizations.
 *
 * Strategy:
 * 1. Find all unique users who have clients/invoices without organizationId
 * 2. For each user:
 *    a. If they already have an organization, use that
 *    b. If not, create a default organization for them
 * 3. Update all their clients and invoices with the organizationId
 */

async function migrate() {
  console.log("Starting migration...\n");

  // Get clients without org
  const clientsWithoutOrg = await db
    .select()
    .from(clients)
    .where(isNull(clients.organizationId));

  // Get invoices without org
  const invoicesWithoutOrg = await db
    .select()
    .from(invoices)
    .where(isNull(invoices.organizationId));

  console.log(`Found ${clientsWithoutOrg.length} clients without organization`);
  console.log(
    `Found ${invoicesWithoutOrg.length} invoices without organization\n`
  );

  if (clientsWithoutOrg.length === 0 && invoicesWithoutOrg.length === 0) {
    console.log("No data to migrate!");
    process.exit(0);
  }

  // Get unique user IDs from clients and invoices
  const userIds = new Set<string>();
  clientsWithoutOrg.forEach((c) => {
    if (c.userId) userIds.add(c.userId);
  });
  invoicesWithoutOrg.forEach((i) => {
    if (i.userId) userIds.add(i.userId);
  });

  console.log(`Found ${userIds.size} unique users with unassigned data\n`);

  for (const userId of userIds) {
    console.log(`Processing user: ${userId}`);

    // Check if user has existing organization membership
    const existingMembership = await db.query.members.findFirst({
      where: eq(members.userId, userId),
      with: {
        organization: true,
      },
    });

    let orgId: string;

    if (existingMembership) {
      orgId = existingMembership.organizationId;
      console.log(
        `  Using existing organization: ${existingMembership.organization.name} (${orgId})`
      );
    } else {
      // Get user info to create org
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        console.log(`  User not found, skipping...`);
        continue;
      }

      // Create default organization for user
      const slug = `${user.name
        .toLowerCase()
        .replace(/\s+/g, "-")}-org-${nanoid(6)}`;
      orgId = nanoid();

      await db.insert(organizations).values({
        id: orgId,
        name: `${user.name}'s Organization`,
        slug,
        createdAt: new Date(),
      });

      // Make user the owner
      await db.insert(members).values({
        id: nanoid(),
        userId,
        organizationId: orgId,
        role: "owner",
        createdAt: new Date(),
      });

      console.log(
        `  Created new organization: ${user.name}'s Organization (${orgId})`
      );
    }

    // Update clients
    await db
      .update(clients)
      .set({ organizationId: orgId })
      .where(eq(clients.userId, userId));

    // Update invoices
    await db
      .update(invoices)
      .set({ organizationId: orgId })
      .where(eq(invoices.userId, userId));

    console.log(`  Updated clients and invoices for user\n`);
  }

  // Verify
  const remainingClients = await db
    .select()
    .from(clients)
    .where(isNull(clients.organizationId));
  const remainingInvoices = await db
    .select()
    .from(invoices)
    .where(isNull(invoices.organizationId));

  console.log("\n=== Migration Complete ===");
  console.log(`Remaining clients without org: ${remainingClients.length}`);
  console.log(`Remaining invoices without org: ${remainingInvoices.length}`);

  process.exit(0);
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
