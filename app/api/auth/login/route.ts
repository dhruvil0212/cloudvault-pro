import { NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { comparePassword, generateToken } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const db = await getDB()

    const user = await db.get("SELECT * FROM users WHERE email = ?", email)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password)

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken(user.id)

    const response = NextResponse.json({ message: "Login successful" })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}