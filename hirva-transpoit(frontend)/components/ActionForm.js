"use client";
// Generic wrapper for server actions: shows a gold-themed toast with the
// success message or the business-rule error (the demo's star moments).
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";

function SubmitBtn({ children, danger, small }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className={`btn ${danger ? "btn-danger" : "btn-gold"} ${small ? "btn-sm" : ""}`}>
      {pending ? "…" : children}
    </button>
  );
}

export default function ActionForm({ action, children, submitLabel = "Save", danger = false, small = false, confirmText, className = "", resetOnOk = true }) {
  const [state, formAction] = useFormState(action, null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!state) return;
    setToast(state);
    const t = setTimeout(() => setToast(null), 4200);
    if (state.ok && resetOnOk) document.querySelectorAll("form").forEach((f) => f.dataset.done === "1" && f.reset());
    return () => clearTimeout(t);
  }, [state, resetOnOk]);

  const onSubmit = (e) => {
    if (confirmText && !window.confirm(confirmText)) e.preventDefault();
    else e.currentTarget.dataset.done = "1";
  };

  return (
    <>
      <form action={formAction} onSubmit={onSubmit} className={className}>
        {children}
        <SubmitBtn danger={danger} small={small}>{submitLabel}</SubmitBtn>
      </form>
      {toast && (
        <div className="toastbox">
          <div className={`toast ${toast.ok ? "toast-ok" : "toast-err"}`}>
            {toast.ok ? "✓ " : "⚠ "}{toast.ok ? toast.message : toast.error}
          </div>
        </div>
      )}
    </>
  );
}
