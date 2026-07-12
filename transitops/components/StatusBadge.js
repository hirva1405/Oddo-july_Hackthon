const MAP = {
  "Available": "badge-ok", "On Trip": "badge-info", "In Shop": "badge-warn",
  "Retired": "badge-muted", "Off Duty": "badge-muted", "Suspended": "badge-bad",
  "Draft": "badge-gold", "Dispatched": "badge-info", "Completed": "badge-ok",
  "Cancelled": "badge-muted", "Open": "badge-warn", "Closed": "badge-ok",
};
export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${MAP[status] || "badge-muted"}`}>
      <span className="dot" />{status.toUpperCase()}
    </span>
  );
}
