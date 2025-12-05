import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// Better Auth Tables
// ============================================

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Custom fields for invoice app
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  taxId: text("tax_id"),
  logoUrl: text("logo_url"),
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).default("INV"),
  invoiceNextNumber: integer("invoice_next_number").default(1),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// Application Tables
// ============================================

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    taxId: text("tax_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("clients_user_id_idx").on(table.userId),
    index("clients_name_idx").on(table.name),
  ]
);

export const invoiceStatusEnum = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type InvoiceStatus = (typeof invoiceStatusEnum)[number];

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    date: timestamp("date").notNull().defaultNow(),
    dueDate: timestamp("due_date").notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0"),
    status: text("status").$type<InvoiceStatus>().notNull().default("draft"),
    notes: text("notes"),
    terms: text("terms"),
    sentAt: timestamp("sent_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("invoices_user_id_idx").on(table.userId),
    index("invoices_client_id_idx").on(table.clientId),
    index("invoices_status_idx").on(table.status),
    index("invoices_date_idx").on(table.date),
    index("invoices_invoice_number_idx").on(table.invoiceNumber),
  ]
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 })
      .notNull()
      .default("1"),
    rate: decimal("rate", { precision: 12, scale: 2 }).notNull().default("0"),
    amount: decimal("amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("invoice_items_invoice_id_idx").on(table.invoiceId)]
);

// ============================================
// Relations
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  clients: many(clients),
  invoices: many(invoices),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

// ============================================
// Types
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type InvoiceWithRelations = Invoice & {
  client: Client;
  items: InvoiceItem[];
};
