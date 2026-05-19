import { db, schema } from '@smt/db';
import { eq, desc } from 'drizzle-orm';

export async function getUserById(userId: string) {
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return user[0] || null;
}

export async function getUserByEmail(email: string) {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return user[0] || null;
}

export async function listUsers(limit: number = 50, offset: number = 0) {
  return await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.isDeleted, false))
    .orderBy(desc(schema.users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  role: string;
  firstName?: string;
  lastName?: string;
}) {
  const validRoles = ['admin', 'supervisor', 'qa', 'operator'];
  const role = validRoles.includes(data.role) ? (data.role as any) : 'operator';
  
  const result = await db.insert(schema.users).values({
    email: data.email,
    passwordHash: data.passwordHash,
    role,
    firstName: data.firstName,
    lastName: data.lastName,
  }).returning();
  return result[0];
}

export async function updateUser(userId: string, data: Partial<typeof schema.users.$inferInsert>) {
  const result = await db
    .update(schema.users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning();
  return result[0] || null;
}

export async function deleteUser(userId: string) {
  const result = await db
    .update(schema.users)
    .set({ isDeleted: true, deletedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning();
  return result[0] || null;
}
