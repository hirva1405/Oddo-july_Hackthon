import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { setUserRole } from "@/lib/actions/fleet";
import ActionForm from "@/components/ActionForm";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  if (session.role !== "ADMIN") redirect("/");
  const users = db.prepare(`SELECT id, name, email, role, createdAt FROM users ORDER BY createdAt`).all();

  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <h2 className="font-display text-xl font-semibold">Users & roles</h2>
        <p className="text-[12.5px] mt-1" style={{ color: "var(--mid)" }}>
          New signups start as Driver. Promote roles here — this is the only place roles change.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <div className="glass overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Change role</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td style={{ color: "var(--mid)" }}>{u.email}</td>
                  <td><span className="badge badge-gold"><span className="dot" />{ROLE_LABELS[u.role]}</span></td>
                  <td>
                    {u.id !== session.id ? (
                      <ActionForm action={setUserRole} submitLabel="Update" small className="flex gap-2 items-center">
                        <input type="hidden" name="id" value={u.id} />
                        <select className="input !w-[170px] !py-1.5 !text-xs" name="role" defaultValue={u.role}>
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      </ActionForm>
                    ) : (
                      <span className="text-[12px]" style={{ color: "var(--low)" }}>you</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
