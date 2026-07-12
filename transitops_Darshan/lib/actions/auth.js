"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db, uid } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function registerAction(prevState, formData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const confirm = formData.get("confirm")?.toString();

  if (!name || !email || !password) return { error: "All fields are required" };
  if (password.length < 6) return { error: "Password must be at least 6 characters" };
  if (password !== confirm) return { error: "Passwords do not match" };
  if (db.prepare(`SELECT id FROM users WHERE email=?`).get(email))
    return { error: "An account with this email already exists" };

  const id = uid();
  const passwordHash = await bcrypt.hash(password, 10);
  // Realistic signup: everyone starts as DRIVER; Admin promotes from the Users page
  db.prepare(`INSERT INTO users (id,name,email,passwordHash,role) VALUES (?,?,?,?, 'DRIVER')`)
    .run(id, name, email, passwordHash);
  await createSession({ id, name, email, role: "DRIVER" });
  redirect("/");
}

export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString() || "";
  const user = email ? db.prepare(`SELECT * FROM users WHERE email=?`).get(email) : null;
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return { error: "Invalid email or password" };
  await createSession(user);
  redirect("/");
}

export async function logoutAction() {
  destroySession();
  redirect("/login");
}
