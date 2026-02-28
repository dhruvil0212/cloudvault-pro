import { NextResponse } from "next/server"
import {
  Client,
  Storage,
  Databases,
  ID,
  Permission,
  Role
} from "node-appwrite"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!) // Server key

    const storage = new Storage(client)
    const databases = new Databases(client)

    // Upload file to storage
    const uploaded = await storage.createFile(
      process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
      ID.unique(),
      file
    )

    // IMPORTANT: Replace with real user ID later
    const userId = "user-1"

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        fileId: uploaded.$id,
        filename: file.name,
        size: file.size,
        createdAt: new Date().toISOString()
      },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    )

    return NextResponse.json({ message: "Upload successful" })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}