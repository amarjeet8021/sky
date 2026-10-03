const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-render";

const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "codecloner.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS saved (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/api/health", (req, res) => res.json({ ok: true, service: "Code Cloner" }));

app.post("/api/auth/signup", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || password.length < 6)
    return res.status(400).json({ error: "Valid email and password (6+ characters) required." });

  try {
    const hash = await bcrypt.hash(password, 12);
    const info = db.prepare("INSERT INTO users (email,password_hash) VALUES (?,?)").run(email, hash);
    const user = { id: info.lastInsertRowid, email };
    res.json({ user, token: makeToken(user) });
  } catch (e) {
    if (String(e.message).includes("UNIQUE"))
      return res.status(409).json({ error: "Email already registered." });
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: "Invalid email or password." });

  const safe = { id: user.id, email: user.email };
  res.json({ user: safe, token: makeToken(safe) });
});

app.get("/api/me", auth, (req, res) => {
  const user = db.prepare("SELECT id,email,created_at FROM users WHERE id=?").get(req.user.id);
  res.json({ user });
});

app.get("/api/saved", auth, (req, res) => {
  const rows = db.prepare("SELECT id,title,type,created_at FROM saved WHERE user_id=? ORDER BY id DESC").all(req.user.id);
  res.json(rows);
});

app.post("/api/saved", auth, (req, res) => {
  const title = String(req.body.title || "").trim();
  const type = String(req.body.type || "article").trim();
  if (!title) return res.status(400).json({ error: "Title required." });
  const info = db.prepare("INSERT INTO saved (user_id,title,type) VALUES (?,?,?)").run(req.user.id, title, type);
  res.json({ id: info.lastInsertRowid, title, type });
});

app.delete("/api/saved/:id", auth, (req, res) => {
  db.prepare("DELETE FROM saved WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Code Cloner running on port ${PORT}`);
});
