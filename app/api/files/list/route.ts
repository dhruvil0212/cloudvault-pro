import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { getDB } from "@/lib/db"

export async function GET() {
  try {
    const cookieStore = await cookies()   // ✅ FIX
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = getDB()

    const files = db
      .prepare("SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC")
      .all(decoded.userId)

    return NextResponse.json(files)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}