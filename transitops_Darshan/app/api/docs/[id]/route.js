import fs from "fs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const doc = db.prepare(`SELECT * FROM vehicle_documents WHERE id=?`).get(params.id);
  if (!doc || !fs.existsSync(doc.filePath)) return new Response("Not found", { status: 404 });
  const buf = fs.readFileSync(doc.filePath);
  return new Response(buf, {
    headers: { "Content-Disposition": `inline; filename="${doc.fileName}"` },
  });
}
