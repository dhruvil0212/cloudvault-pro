import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"

// =======================
// Password Utilities
// =======================

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash)
}

// =======================
// JWT Utilities
// =======================

export function generateToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number }
  } catch {
    return null
  }
}

// =======================
// Auth Helper (Server Only)
// =======================

export async function getCurrentUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  return decoded.userId
}