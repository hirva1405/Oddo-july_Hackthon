// Session auth: signed JWT in an httpOnly cookie (jose), bcrypt password hashing.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "transitops-hackathon-secret-change-me"
);
export const COOKIE = "transitops_session";

export { ROLES, ROLE_LABELS } from "./roles";

export async function createSession(user) {
  const token = await new SignJWT({ sub: user.id, name: user.name, role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { id: payload.sub, name: payload.name, role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}

export function destroySession() {
  cookies().delete(COOKIE);
}

// RBAC helper for server actions/pages. Throws if role not allowed.
export async function requireRole(...allowed) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  if (allowed.length && !allowed.includes(session.role)) {
    throw new Error("Not authorized for this action");
  }
  return session;
}
