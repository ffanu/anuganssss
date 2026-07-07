/**
 * Utility to dynamically generate a highly detailed and stylized digital receipt voucher
 * using the HTML Canvas API. This acts as a high-fidelity visual proof-of-payment.
 */
export function generateVoucherBase64(
  amount: number,
  description: string,
  category: string,
  type: "incoming" | "outgoing",
  date: string,
  paymentMethod: string,
  id: string = ""
): string {
  // Create an offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 560;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const cleanId = id || "TXN-" + Math.random().toString(36).substring(2, 11).toUpperCase();

  // 1. Sleek Background (slate-100 fallback with high contrast frame)
  ctx.fillStyle = "#F1F5F9"; 
  ctx.fillRect(0, 0, 400, 560);

  // 2. Receipt White Sheet Base
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillRect(20, 20, 360, 520);
  ctx.shadowColor = "transparent"; // Reset shadow

  // 3. Colored Header Strip based on Type
  const accentColor = type === "incoming" ? "#10B981" : "#EF4444"; // emerald vs rose
  ctx.fillStyle = accentColor;
  ctx.fillRect(20, 20, 360, 12);

  // Decorative header circles (simulating punched paper roll holes)
  ctx.fillStyle = "#F1F5F9";
  for (let x = 35; x < 380; x += 30) {
    ctx.beginPath();
    ctx.arc(x, 20, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Receipt Title & Brand
  ctx.fillStyle = "#0F172A"; // slate-900
  ctx.font = "bold 15px 'Courier New', Courier, monospace";
  ctx.textAlign = "center";
  ctx.fillText("*** CASHIER DESK TERMINAL ***", 200, 60);

  ctx.fillStyle = "#64748B"; // slate-500
  ctx.font = "bold 10px sans-serif";
  ctx.fillText("OFFICIAL proof of transaction".toUpperCase(), 200, 78);

  // Decorative dividing dotted line
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(35, 95);
  ctx.lineTo(365, 95);
  ctx.stroke();
  ctx.setLineDash([]); // reset dash

  // 5. Large Amount Callout Block
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(35, 110, 330, 75);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.strokeRect(35, 110, 330, 75);

  ctx.fillStyle = "#64748B";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText("TOTAL REGISTER VALUE", 200, 128);

  ctx.fillStyle = type === "incoming" ? "#047857" : "#B91C1C"; // deep emerald or deep rose
  ctx.font = "bold 22px 'Courier New', Courier, monospace";
  const formattedAmt = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  ctx.fillText(formattedAmt, 200, 154);

  ctx.fillStyle = type === "incoming" ? "#065F46" : "#991B1B";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText(type === "incoming" ? "▲ REGISTER INFLOW RECEIVED" : "▼ REGISTER OUTFLOW DISBURSED", 200, 174);

  // 6. Meta Fields Rows
  ctx.textAlign = "left";
  const startY = 215;
  const rowHeight = 28;

  const drawFieldRow = (label: string, val: string, index: number) => {
    const y = startY + index * rowHeight;
    // Row background highlight
    if (index % 2 === 0) {
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(35, y - 14, 330, 22);
    }
    // Label
    ctx.fillStyle = "#64748B";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(label.toUpperCase(), 42, y);

    // Value
    ctx.fillStyle = "#334155";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(val, 358, y);
    ctx.textAlign = "left";
  };

  drawFieldRow("Receipt Reference", cleanId, 0);
  drawFieldRow("Transaction Date", date, 1);
  drawFieldRow("Category Node", category, 2);
  drawFieldRow("Payment Channel", paymentMethod, 3);
  drawFieldRow("Verification", "APPROVED SECURE", 4);

  // Memo/Description block
  const memoY = startY + 5 * rowHeight;
  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText("DESCRIPTION MEMO:", 42, memoY);

  ctx.fillStyle = "#475569";
  ctx.font = "italic 11px sans-serif";
  const truncatedDesc = description.length > 42 ? description.substring(0, 39) + "..." : description;
  ctx.fillText(truncatedDesc || "N/A - Cash register transaction entry", 42, memoY + 16);

  // Dotted Line
  ctx.strokeStyle = "#CBD5E1";
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(35, 410);
  ctx.lineTo(365, 410);
  ctx.stroke();
  ctx.setLineDash([]); // Reset

  // 7. Visual Barcode
  ctx.fillStyle = "#0F172A";
  const barcodeX = 85;
  const barcodeY = 425;
  const barcodeHeight = 35;
  // Specific pattern for realistic barcode blocks
  const bars = [3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 4, 3, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 2, 1, 3, 3, 2];
  let curX = barcodeX;
  for (let i = 0; i < bars.length; i++) {
    const w = bars[i];
    if (i % 2 === 0) {
      ctx.fillRect(curX, barcodeY, w, barcodeHeight);
    }
    curX += w + 2;
  }

  // Barcode subtext
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 9px 'Courier New', Courier, monospace";
  ctx.fillText(`*${cleanId}*`, 200, 475);

  // Diagonal Watermark/Stamp
  ctx.save();
  ctx.translate(315, 340);
  ctx.rotate(-0.25); // slant stamp
  ctx.strokeStyle = type === "incoming" ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-50, -15, 100, 30);
  ctx.fillStyle = type === "incoming" ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)";
  ctx.font = "black 11px sans-serif";
  ctx.fillText(type === "incoming" ? "PAID" : "DISBURSED", 0, 4);
  ctx.restore();

  // Footer Branding info
  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText("THANK YOU FOR YOUR TRUST", 200, 505);
  ctx.font = "500 8px sans-serif";
  ctx.fillText("Securely logged in system memory • Cache-safe local record", 200, 520);

  return canvas.toDataURL("image/png");
}
