"use client"

import { useState } from "react"
import { account } from "@/lib/appwrite"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password")
      return
    }

    try {
      setLoading(true)

      // Delete old session if exists
      try {
        await account.deleteSession("current")
      } catch {}

      await account.createEmailPasswordSession(email, password)

      router.push("/dashboard")

    } catch (error: any) {
      alert(error?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />

      <div style={styles.card}>
        <h1 style={styles.logo}>CloudVault</h1>
        <h2 style={styles.title}>Login to CloudVault</h2>

        <input
          type="email"
          placeholder="your-email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleLogin} style={styles.button}>
          {loading ? "Logging in..." : "Log in to Vault"}
        </button>

        <p style={styles.registerText}>
          Don’t have an account?{" "}
          <span
            style={styles.registerLink}
            onClick={() => router.push("/register")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    height: "100vh",
    backgroundImage:
      "url('https://thumbs.dreamstime.com/b/close-up-hand-turning-key-server-lock-surrounded-illuminated-server-racks-modern-data-center-vibrant-410123310.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.6)"
  },
  card: {
    position: "relative",
    backdropFilter: "blur(15px)",
    background: "rgba(255,255,255,0.1)",
    padding: "40px",
    borderRadius: "15px",
    width: "380px",
    textAlign: "center",
    color: "white",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
  },
  logo: {
    fontSize: "28px",
    marginBottom: "10px",
    fontWeight: "bold"
  },
  title: {
    marginBottom: "25px",
    fontWeight: "500"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
    fontSize: "14px"
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(90deg,#1e90ff,#005eff)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.3s"
  },
  registerText: {
    marginTop: "20px",
    fontSize: "14px"
  },
  registerLink: {
    color: "#4da6ff",
    cursor: "pointer",
    fontWeight: "bold"
  }
}