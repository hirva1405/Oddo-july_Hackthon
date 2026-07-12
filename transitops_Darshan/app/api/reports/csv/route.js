// CSV export of the vehicle report (Section 3.8: mandatory CSV export)
import { getVehicleReports } from "@/lib/analytics";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const rows = getVehicleReports();
  const headers = ["Vehicle","Registration","Type","Status","Trips Completed","Distance (km)",
    "Fuel (L)","Fuel Cost (₹)","Maintenance Cost (₹)","Operational Cost (₹)","Revenue (₹)",
    "Fuel Efficiency (km/L)","ROI (%)"];
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = [
    headers.map(esc).join(","),
    ...rows.map((r) => [r.name, r.registrationNumber, r.type, r.status, r.tripsCompleted,
      r.distanceKm, r.fuelLiters, r.fuelCost, r.maintenanceCost, r.operationalCost,
      r.revenue, r.fuelEfficiency, r.roi].map(esc).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transitops-fleet-report.csv"`,
    },
  });
}
