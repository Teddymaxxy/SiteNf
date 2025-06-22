import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  senha: text("senha").notNull(), // Hash da senha
  online: boolean("online").default(false),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const messages = pgTable("mensagens", {
  id: serial("id").primaryKey(),
  conteudo: text("conteudo").notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  usuarioId: integer("usuario_id").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  mensagens: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  usuario: one(users, {
    fields: [messages.usuarioId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  online: true,
  criadoEm: true,
});

export const selectUserSchema = createSelectSchema(users);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  criadoEm: true,
});

export const selectMessageSchema = createSelectSchema(messages);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = z.infer<typeof selectMessageSchema>;

// Additional types for API responses
export type MessageWithUser = Message & {
  usuario: Pick<User, 'id' | 'nome'>;
};

export type AuthResponse = {
  user: Omit<User, 'senha'>;
  token: string;
};

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Register schema
export const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type RegisterData = z.infer<typeof registerSchema>;
