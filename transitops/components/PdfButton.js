"use client";
// Generates a styled PDF of the fleet report client-side (jsPDF + autotable).
export default function PdfButton({ rows }) {
  const download = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFillColor(6, 6, 7);
    doc.rect(0, 0, 297, 26, "F");
    doc.setTextColor(232, 180, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("TransitOps — Fleet Report", 14, 12);
    doc.setTextColor(228, 214, 189);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated ${new Date().toLocaleString("en-IN")} · ROI = (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost`, 14, 19);

    autoTable(doc, {
      startY: 32,
      head: [["Vehicle", "Registration", "Type", "Status", "Trips", "Distance (km)", "Fuel (L)", "Op. Cost (Rs)", "Revenue (Rs)", "Efficiency (km/L)", "ROI (%)"]],
      body: rows.map((r) => [r.name, r.registrationNumber, r.type, r.status, r.tripsCompleted,
        r.distanceKm, r.fuelLiters, r.operationalCost.toLocaleString("en-IN"),
        r.revenue.toLocaleString("en-IN"), r.fuelEfficiency || "—", `${r.roi}%`]),
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [13, 27, 51], textColor: [232, 180, 74], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 242, 235] },
    });
    doc.save("transitops-fleet-report.pdf");
  };
  return <button onClick={download} className="btn">📄 Export PDF</button>;
}
