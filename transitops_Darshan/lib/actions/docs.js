"use server";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";
import { db, uid } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function uploadDocument(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER");
    const vehicleId = fd.get("vehicleId").toString();
    const docType = fd.get("docType").toString();
    const expiryDate = fd.get("expiryDate")?.toString() || null;
    const file = fd.get("file");
    if (!file || typeof file === "string" || file.size === 0) return { ok: false, error: "Choose a file to upload" };
    if (file.size > 8 * 1024 * 1024) return { ok: false, error: "File too large (max 8 MB)" };

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const id = uid();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(UPLOAD_DIR, `${id}-${safeName}`);
    fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

    db.prepare(`INSERT INTO vehicle_documents (id, vehicleId, docType, fileName, filePath, expiryDate)
                VALUES (?,?,?,?,?,?)`)
      .run(id, vehicleId, docType, file.name, filePath, expiryDate ? new Date(expiryDate).toISOString() : null);
    revalidatePath(`/vehicles/${vehicleId}`);
    return { ok: true, message: `${docType} uploaded` };
  } catch (e) { return { ok: false, error: e.message || "Upload failed" }; }
}

export async function deleteDocument(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER");
    const doc = db.prepare(`SELECT * FROM vehicle_documents WHERE id=?`).get(fd.get("id").toString());
    if (!doc) return { ok: false, error: "Not found" };
    try { fs.unlinkSync(doc.filePath); } catch {}
    db.prepare(`DELETE FROM vehicle_documents WHERE id=?`).run(doc.id);
    revalidatePath(`/vehicles/${doc.vehicleId}`);
    return { ok: true, message: "Document removed" };
  } catch (e) { return { ok: false, error: e.message }; }
}
