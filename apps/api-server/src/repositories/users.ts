import { db, schema } from '@smt/db';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('invalid-password-for-timing', 10);

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
  password: string;  // CHANGED: accept plaintext password, not hash
  role: string;
  firstName?: string;
  lastName?: string;
}) {
  const validRoles = ['admin', 'supervisor', 'qa', 'operator'];
  const role = validRoles.includes(data.role) ? (data.role as any) : 'operator';
  
  // Hash password with 10 rounds
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  const result = await db.insert(schema.users).values({
    email: data.email,
    passwordHash,
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

/**
 * Verify a plaintext password against a bcrypt hash
 * @param hash - The bcrypt password hash from database
 * @param plainPassword - The plaintext password to verify
 * @returns true if password matches, false otherwise
 */
export async function verifyUserPassword(hash: string, plainPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hash);
}

/**
 * Authenticate a user by email and password
 * @param email - User email
 * @param password - Plaintext password
 * @returns User object if credentials are valid, null otherwise
 */
export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    // Run a bcrypt comparison even when the user does not exist to reduce timing differences.
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return null;
  }

  const isPasswordValid = await verifyUserPassword(user.passwordHash, password);
  if (!isPasswordValid) {
    return null;
  }

  return user;
}
