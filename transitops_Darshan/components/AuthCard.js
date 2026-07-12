"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

function Btn({ children }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="btn btn-gold w-full justify-center mt-2 py-3">{pending ? "…" : children}</button>;
}

export default function AuthCard({ action, mode }) {
  const [state, formAction] = useFormState(action, null);
  const login = mode === "login";
  return (
    <div className="min-h-screen grid place-items-center px-4 relative z-10">
      <div className="w-full max-w-[430px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center text-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#E8B44A,#C99530)", boxShadow: "0 0 34px rgba(232,180,74,.45)" }}>🚛</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">TransitOps</h1>
          <p className="font-script italic text-lg mt-1" style={{ color: "var(--gold)" }}>every mile, accounted for</p>
        </div>
        <div className="glass sheen p-7">
          <h2 className="font-display text-lg font-semibold mb-5">{login ? "Welcome back" : "Create your account"}</h2>
          <form action={formAction} className="flex flex-col gap-4">
            {!login && (
              <div className="field"><label>Full name</label>
                <input className="input" name="name" placeholder="Hirva Patel" required /></div>
            )}
            <div className="field"><label>Email</label>
              <input className="input" name="email" type="email" placeholder="you@transitops.com" required /></div>
            <div className="field"><label>Password</label>
              <input className="input" name="password" type="password" placeholder="••••••••" required /></div>
            {!login && (
              <div className="field"><label>Confirm password</label>
                <input className="input" name="confirm" type="password" placeholder="••••••••" required /></div>
            )}
            {state?.error && (
              <p className="text-[13px] px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(206,123,110,.08)", border: "1px solid rgba(206,123,110,.35)", color: "#E4A99E" }}>
                ⚠ {state.error}
              </p>
            )}
            <Btn>{login ? "Enter command center" : "Register"}</Btn>
          </form>
          {!login && (
            <p className="text-[11.5px] mt-4 leading-relaxed" style={{ color: "var(--low)" }}>
              New accounts start as <b style={{ color: "var(--mid)" }}>Driver</b>. An Admin can promote roles from the Users page.
            </p>
          )}
          <div className="divider-orna my-5">✦</div>
          <p className="text-center text-[13px]" style={{ color: "var(--mid)" }}>
            {login ? "No account? " : "Already registered? "}
            <Link href={login ? "/register" : "/login"} style={{ color: "var(--gold)" }} className="font-semibold">
              {login ? "Register" : "Log in"}
            </Link>
          </p>
        </div>
        {login && (
          <div className="glass mt-4 p-4 text-[12px] leading-relaxed" style={{ color: "var(--mid)" }}>
            <b style={{ color: "var(--beige)" }}>Demo logins</b> (password <code style={{ color: "var(--gold)" }}>demo1234</code>): admin@ · manager@ · driver@ · safety@ · finance@ transitops.com
          </div>
        )}
      </div>
    </div>
  );
}
