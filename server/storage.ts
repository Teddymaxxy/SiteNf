import { users, messages, type User, type InsertUser, type Message, type InsertMessage, type MessageWithUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: number, online: boolean): Promise<void>;
  getOnlineUsers(): Promise<Omit<User, 'senha'>[]>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(limit?: number): Promise<MessageWithUser[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserOnlineStatus(id: number, online: boolean): Promise<void> {
    await db
      .update(users)
      .set({ online })
      .where(eq(users.id, id));
  }

  async getOnlineUsers(): Promise<Omit<User, 'senha'>[]> {
    const onlineUsers = await db
      .select({
        id: users.id,
        email: users.email,
        nome: users.nome,
        online: users.online,
        criadoEm: users.criadoEm,
      })
      .from(users)
      .where(eq(users.online, true));
    return onlineUsers;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getRecentMessages(limit: number = 50): Promise<MessageWithUser[]> {
    const recentMessages = await db
      .select({
        id: messages.id,
        conteudo: messages.conteudo,
        criadoEm: messages.criadoEm,
        usuarioId: messages.usuarioId,
        usuario: {
          id: users.id,
          nome: users.nome,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.usuarioId, users.id))
      .orderBy(desc(messages.criadoEm))
      .limit(limit);

    return recentMessages.reverse(); // Return in chronological order
  }
}

export const storage = new DatabaseStorage();
