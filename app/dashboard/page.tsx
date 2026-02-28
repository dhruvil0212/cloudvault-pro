"use client"

import { useEffect, useState } from "react"
import { account, storage, databases } from "@/lib/appwrite"
import { ID, Permission, Role, Query } from "appwrite"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)

  const router = useRouter()

  // ================= FETCH ITEMS =================
  const fetchItems = async (userId: string, folderId: string | null) => {
    const queries = [Query.equal("userId", userId)]

    if (folderId) {
      queries.push(Query.equal("parentId", folderId))
    } else {
      queries.push(Query.isNull("parentId"))
    }

    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
      queries
    )

    setItems(response.documents)
  }
  

  // ================= INIT =================
  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await account.get()
        setUser(currentUser)
        await fetchItems(currentUser.$id, null)
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  // ================= CREATE FOLDER =================
  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name")
    if (!name || !user) return

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
      ID.unique(),
      {
        userId: user.$id,
        filename: name,
        type: "folder",
        parentId: currentFolder,
        size: 0,
        createdAt: new Date().toISOString()
      },
      [
        Permission.read(Role.user(user.$id)),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id))
      ]
    )

    await fetchItems(user.$id, currentFolder)
  }

  // ================= UPLOAD =================
  const handleUpload = async () => {
    if (!file || !user) return

    try {
      const uploaded = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
        ID.unique(),
        file
      )

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        ID.unique(),
        {
          userId: user.$id,
          fileId: uploaded.$id,
          filename: file.name,
          type: "file",
          parentId: currentFolder,
          size: file.size,
          createdAt: new Date().toISOString()
        },
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id))
        ]
      )

      setFile(null)
      await fetchItems(user.$id, currentFolder)

    } catch (error: any) {
      alert(error?.message || "Upload failed")
    }
  }

  // ================= NAVIGATION =================
  const openFolder = async (folderId: string) => {
    setCurrentFolder(folderId)
    await fetchItems(user.$id, folderId)
  }

  const goBack = async () => {
    setCurrentFolder(null)
    await fetchItems(user.$id, null)
  }

  // ================= DOWNLOAD =================
  const handleDownload = (fileId: string) => {
    const url = storage.getFileDownload(
      process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
      fileId
    )

    window.open(url.toString(), "_blank")
  }

  // ================= DELETE =================
  const handleDelete = async (doc: any) => {
    if (!confirm("Delete this item?")) return

    try {
      if (doc.type === "file") {
        await storage.deleteFile(
          process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
          doc.fileId
        )
      }

      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        doc.$id
      )

      await fetchItems(user.$id, currentFolder)

    } catch (error: any) {
      alert(error?.message || "Delete failed")
    }
  }

  const handleLogout = async () => {
    await account.deleteSession("current")
    router.push("/login")
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
  <div className="container">

    {/* HEADER */}
    <header className="header">
      <div className="logo">
        <img src="/cloud-logo.png" alt="logo" />
        <h1>CloudVault</h1>
      </div>

      <div className="userBox">
        <span><strong>User:</strong> {user?.email}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>

    {/* CONTROLS */}
    <div className="controls">
      <button onClick={handleCreateFolder} className="primaryBtn">
        📁 New Folder
      </button>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} className="primaryBtn">
        Upload
      </button>

      <input
        type="text"
        placeholder="Search..."
        className="search"
      />
    </div>

    {/* BACK BUTTON */}
    {currentFolder && (
      <button onClick={goBack} className="backBtn">
        ⬅ Back to Root
      </button>
    )}

    {/* GRID */}
    <div className="grid">
      {items.map((item) => {
        const isImage =
          item.type === "file" &&
          item.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)

        const previewUrl =
          item.type === "file"
            ? storage.getFilePreview(
                process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
                item.fileId
              )
            : null

        return (
          <div
            key={item.$id}
            className="card"
            onClick={() =>
              item.type === "folder" && openFolder(item.$id)
            }
          >
            <div className="icon">
              {item.type === "folder" ? "📁" : "📄"}
            </div>

            <div className="info">
              <h3>{item.filename}</h3>

              {item.type === "file" && (
                <>
                  <p>Size: {(item.size / 1024).toFixed(2)} KB</p>
                  <small>
                    Uploaded: {new Date(item.createdAt).toLocaleString()}
                  </small>

                  {isImage && (
                    <img
                      src={previewUrl!.toString()}
                      alt={item.filename}
                    />
                  )}

                  <div className="actions">
                    <button onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(item.fileId)
                    }}>
                      Download
                    </button>

                    <button
                      className="danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

              {item.type === "folder" && (
                <button
                  className="danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(item)
                  }}
                >
                  Delete Folder
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>

    <style jsx>{`
      .container {
  min-height: 100vh;
  padding: 30px;
  color: white;
  position: relative;
  background-image: url("/dashboard-bg.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.container::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  z-index: 0;
}

.header,
.controls,
.grid,
.backBtn {
  position: relative;
  z-index: 1;
}
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .logo img {
        width: 40px;
      }

      .userBox {
        background: rgba(255,255,255,0.1);
        padding: 10px 15px;
        border-radius: 10px;
        display: flex;
        gap: 15px;
        align-items: center;
      }

      .userBox button {
        background: transparent;
        border: none;
        color: #4da6ff;
        cursor: pointer;
      }

      .controls {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        align-items: center;
      }

      .primaryBtn {
        padding: 8px 16px;
        border-radius: 8px;
        border: none;
        background: linear-gradient(90deg,#1e90ff,#005eff);
        color: white;
        cursor: pointer;
      }

      .search {
        margin-left: auto;
        padding: 8px 12px;
        border-radius: 8px;
        border: none;
        width: 200px;
      }

      .backBtn {
        margin-bottom: 20px;
        background: transparent;
        border: none;
        color: #4da6ff;
        cursor: pointer;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill,minmax(260px,1fr));
        gap: 20px;
      }

      .card {
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(12px);
        padding: 20px;
        border-radius: 15px;
        transition: 0.3s;
        cursor: pointer;
      }

      .card:hover {
        transform: translateY(-5px);
        background: rgba(255,255,255,0.15);
      }

      .icon {
        font-size: 30px;
        margin-bottom: 10px;
      }

      .info img {
        width: 100%;
        margin-top: 10px;
        border-radius: 8px;
      }

      .actions {
        margin-top: 10px;
        display: flex;
        gap: 10px;
      }

      .danger {
        background: transparent;
        border: none;
        color: red;
        cursor: pointer;
      }
    `}</style>
  </div>
)
}