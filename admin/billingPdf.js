import PDFDocument from "pdfkit";

// Renders a client's billing summary as a one-page (or more) PDF: client/range
// header, totals, then purchase and usage line items. Returns a Buffer so the
// route handler can set headers and send it in one shot rather than streaming.
//
// Positioning is fully manual (an explicit `y` cursor, `lineBreak: false` on
// every text() call) rather than relying on PDFKit's own auto-advancing
// cursor — mixing explicit x/y with the auto cursor caused overlapping,
// jumbled table rows in an earlier version of this file.
export function renderBillingSummaryPdf(summary) {
  const { client, range, purchases, usage, totals } = summary;
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const money = (n) => `$${Number(n ?? 0).toFixed(2)}`;
  const rangeLabel = range.from || range.to ? `${range.from || "start"} - ${range.to || "now"}` : "All-time";
  const left = doc.page.margins.left;
  const pageBottom = doc.page.height - doc.page.margins.bottom;

  let y = doc.page.margins.top;

  function text(str, x, opts = {}) {
    doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(opts.size || 10)
      .fillColor(opts.color || "#000")
      .text(str, x, y, { width: opts.width, lineBreak: false });
  }
  function newLine(h = 16) {
    y += h;
    if (y > pageBottom - 30) {
      doc.addPage();
      y = doc.page.margins.top;
    }
  }

  text("Billing summary", left, { size: 18, bold: true });
  newLine(26);
  text(`${client.name}  -  ${client.website}`, left, { size: 11, color: "#555" });
  newLine(16);
  text(`Period: ${rangeLabel}`, left, { size: 11, color: "#555" });
  newLine(26);

  text("Totals", left, { size: 12, bold: true });
  newLine(18);
  text(`Purchased: ${totals.purchased} credits`, left);
  newLine(14);
  text(`Used: ${totals.used} credits (${money(totals.used)}, 1 credit = $1)`, left);
  newLine(14);
  text(`Net: ${totals.net} credits`, left);
  newLine(28);

  const colX = [left, left + 75, left + 295, left + 365, left + 435];
  const colW = [75, 215, 65, 65, doc.page.width - doc.page.margins.right - (left + 435)];

  function tableHeader(cols) {
    cols.forEach((c, i) => text(c, colX[i], { width: colW[i], size: 9, bold: true, color: "#666" }));
    newLine(16);
  }
  function tableRow(cols) {
    cols.forEach((c, i) => text(String(c ?? ""), colX[i], { width: colW[i], size: 9 }));
    newLine(15);
  }
  function section(title, rows, headers, mapRow) {
    text(title, left, { size: 12, bold: true });
    newLine(18);
    tableHeader(headers);
    if (rows.length === 0) {
      text("None in this period.", left, { size: 9, color: "#888" });
      newLine(18);
      return;
    }
    for (const row of rows) tableRow(mapRow(row));
    newLine(10);
  }

  section(
    "Credit purchases",
    purchases,
    ["Date", "Description", "Credits", "Amount", "Reference"],
    (p) => [String(p.date).slice(0, 10), "Credit purchase", `+${p.credits}`, p.amount != null ? `${p.amount} ${p.currency || ""}` : "", p.ref || ""]
  );

  section(
    "Usage",
    usage,
    ["Date", "Description", "Credits", "Cost", "Note"],
    (u) => [String(u.date).slice(0, 10), u.action || u.note || "Agent usage", `-${Math.abs(Number(u.credits) || 0)}`, money(u.credits), u.note || ""]
  );

  text(`Generated ${new Date().toISOString().slice(0, 10)} by Opskeep admin`, left, { size: 8, color: "#999" });

  doc.end();
  return done;
}
