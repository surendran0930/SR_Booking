import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DEFAULT_LOGO_PATH } from "@/lib/constants";

type PdfInvoice = {
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceType: string;
  paymentStatus: string;
  subtotal: number | string;
  discount: number | string;
  cgst: number | string;
  sgst: number | string;
  igst: number | string;
  gstTotal: number | string;
  grandTotal: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  notes?: string | null;
  printerBrand?: string | null;
  printerModel?: string | null;
  printerSerial?: string | null;
  customerComplaint?: string | null;
  customer: {
    name: string;
    companyName?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    gstin?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number | string;
    unitPrice: number | string;
    gstPercentage: number | string;
    totalAmount: number | string;
  }>;
};

type PdfSettings = {
  businessName: string;
  tagline?: string | null;
  businessAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  termsAndConditions?: string | null;
  bankDetails?: string | null;
  upiId?: string | null;
  logoUrl?: string | null;
};

function num(v: number | string) {
  return typeof v === "string" ? Number(v) : v;
}

function rs(v: number | string) {
  return formatCurrency(num(v)).replace("₹", "Rs ");
}

export async function buildInvoicePdf(
  invoice: PdfInvoice,
  settings: PdfSettings,
) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const right = 555;
  let y = 790;
  const primary = rgb(0.263, 0.176, 0.843); // #432DD7
  const text = rgb(0.063, 0.094, 0.157);
  const muted = rgb(0.45, 0.49, 0.55);
  const white = rgb(1, 1, 1);

  const draw = (
    content: string,
    x: number,
    yy: number,
    size = 10,
    useBold = false,
    color = text,
  ) => {
    page.drawText(content, {
      x,
      y: yy,
      size,
      font: useBold ? bold : font,
      color,
    });
  };

  const drawRight = (
    content: string,
    rightEdge: number,
    yy: number,
    size = 10,
    useBold = false,
    color = text,
  ) => {
    const f = useBold ? bold : font;
    const width = f.widthOfTextAtSize(content, size);
    draw(content, rightEdge - width, yy, size, useBold, color);
  };

  // Logo (top-left)
  try {
    const logoPath = settings.logoUrl || DEFAULT_LOGO_PATH;
    if (logoPath.startsWith("/")) {
      const absolute = path.join(
        process.cwd(),
        "public",
        logoPath.replace(/^\//, ""),
      );
      const bytes = await readFile(absolute);
      const png = await doc.embedPng(bytes);
      const logoSize = 52;
      page.drawImage(png, {
        x: margin,
        y: y - 36,
        width: logoSize,
        height: logoSize,
      });
    }
  } catch {
    // optional
  }

  // INVOICE title (top-right)
  drawRight("INVOICE", right, y, 22, true, primary);
  y -= 18;
  drawRight(formatDate(invoice.invoiceDate), right, y, 10, false, muted);
  y -= 12;
  drawRight(invoice.invoiceNumber, right, y, 9, true, text);
  y -= 12;
  drawRight(
    `${invoice.invoiceType} · ${invoice.paymentStatus}`,
    right,
    y,
    8,
    false,
    muted,
  );

  // Business name under logo
  y = 730;
  draw(settings.businessName, margin, y, 14, true, primary);
  y -= 12;
  if (settings.tagline) {
    draw(settings.tagline.slice(0, 55), margin, y, 8, false, muted);
    y -= 14;
  } else {
    y -= 6;
  }

  // Office Address | To
  const colY = y;
  draw("Office Address", margin, colY, 10, true);
  let leftY = colY - 14;
  const officeLines = [
    settings.businessAddress,
    [settings.phone ? `Ph: ${settings.phone}` : null, settings.email]
      .filter(Boolean)
      .join(" · "),
    settings.gstin ? `GSTIN: ${settings.gstin}` : null,
  ].filter(Boolean) as string[];

  officeLines.forEach((line) => {
    draw(line.slice(0, 55), margin, leftY, 8, false, muted);
    leftY -= 11;
  });

  draw("To :", 320, colY, 10, true);
  let rightY = colY - 14;
  draw(invoice.customer.name, 320, rightY, 10, true);
  rightY -= 12;
  const toLines = [
    invoice.customer.companyName,
    invoice.customer.address,
    [invoice.customer.city, invoice.customer.state, invoice.customer.pincode]
      .filter(Boolean)
      .join(", "),
    `Phone: ${invoice.customer.phone}`,
    invoice.customer.gstin ? `GSTIN: ${invoice.customer.gstin}` : null,
  ].filter(Boolean) as string[];

  toLines.forEach((line) => {
    draw(line.slice(0, 42), 320, rightY, 8, false, muted);
    rightY -= 11;
  });

  y = Math.min(leftY, rightY) - 16;

  // Table header bar
  const headerH = 22;
  page.drawRectangle({
    x: margin,
    y: y - 6,
    width: right - margin,
    height: headerH,
    color: primary,
  });
  draw("ITEMS DESCRIPTION", margin + 8, y, 8, true, white);
  draw("UNIT PRICE", 310, y, 8, true, white);
  draw("QTY", 410, y, 8, true, white);
  draw("TOTAL", 470, y, 8, true, white);
  y -= 28;

  invoice.items.forEach((item) => {
    if (y < 200) return;
    draw(item.description.slice(0, 40), margin + 8, y, 9, true);
    y -= 11;
    draw(`GST ${num(item.gstPercentage)}%`, margin + 8, y, 7, false, muted);
    const rowY = y + 11;
    drawRight(rs(item.unitPrice), 390, rowY, 8);
    draw(String(num(item.quantity)), 420, rowY, 8);
    drawRight(rs(item.totalAmount), right - 4, rowY, 8, true);
    y -= 10;
    page.drawLine({
      start: { x: margin, y },
      end: { x: right, y },
      thickness: 0.4,
      color: rgb(0.88, 0.9, 0.92),
    });
    y -= 14;
  });

  y -= 6;

  // Note (left) + totals (right)
  const noteY = y;
  draw("Note :", margin, noteY, 9, true);
  let nY = noteY - 12;
  const noteParts = [
    invoice.printerBrand
      ? `Device: ${invoice.printerBrand} ${invoice.printerModel ?? ""} ${invoice.printerSerial ? `| S/N ${invoice.printerSerial}` : ""}`
      : null,
    invoice.customerComplaint
      ? `Complaint: ${invoice.customerComplaint}`
      : null,
    invoice.notes,
  ].filter(Boolean) as string[];

  if (noteParts.length === 0) {
    noteParts.push("Thank you for choosing SR Tech Solutions.");
  }
  noteParts.join(" ").match(/.{1,48}(\s|$)/g)?.slice(0, 5).forEach((chunk) => {
    draw(chunk.trim(), margin, nY, 7, false, muted);
    nY -= 10;
  });

  let tY = noteY;
  const totalsX = 340;
  const totalsRight = right - 4;

  const totalRow = (label: string, value: string) => {
    draw(label, totalsX, tY, 8, false, muted);
    drawRight(value, totalsRight, tY, 8);
    tY -= 13;
  };

  totalRow("SUBTOTAL :", rs(invoice.subtotal));
  if (num(invoice.gstTotal) > 0) {
    totalRow("TAX :", rs(invoice.gstTotal));
  }
  if (num(invoice.discount) > 0) {
    totalRow("DISCOUNT :", rs(invoice.discount));
  }

  const due =
    num(invoice.balanceDue) > 0
      ? num(invoice.balanceDue)
      : num(invoice.grandTotal);

  page.drawRectangle({
    x: totalsX - 4,
    y: tY - 6,
    width: totalsRight - totalsX + 8,
    height: 22,
    color: primary,
  });
  draw("TOTAL DUE :", totalsX, tY, 9, true, white);
  drawRight(rs(due), totalsRight, tY, 9, true, white);
  tY -= 20;

  if (num(invoice.amountPaid) > 0) {
    totalRow("AMOUNT PAID :", rs(invoice.amountPaid));
  }

  y = Math.min(nY, tY) - 24;

  draw("Thank you for your Business", 180, y, 11, true, primary);
  y -= 18;

  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 0.6,
    color: rgb(0.85, 0.87, 0.9),
  });
  y -= 18;

  // Footer columns
  const footerY = y;
  drawFooterCol(
    page,
    font,
    bold,
    "Questions?",
    [settings.email, settings.phone].filter(Boolean) as string[],
    margin,
    footerY,
    muted,
    text,
  );
  drawFooterCol(
    page,
    font,
    bold,
    "Payment Info",
    [
      ...(settings.bankDetails?.split("\n").slice(0, 3) ?? []),
      settings.upiId ? `UPI: ${settings.upiId}` : null,
    ].filter(Boolean) as string[],
    220,
    footerY,
    muted,
    text,
  );
  drawFooterCol(
    page,
    font,
    bold,
    "Terms & Conditions",
    (
      settings.termsAndConditions ||
      "Goods once sold will not be taken back."
    )
      .split("\n")
      .slice(0, 4),
    390,
    footerY,
    muted,
    text,
  );

  return doc.save();
}

function drawFooterCol(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  title: string,
  lines: string[],
  x: number,
  y: number,
  muted: ReturnType<typeof rgb>,
  text: ReturnType<typeof rgb>,
) {
  page.drawText(title, {
    x,
    y,
    size: 9,
    font: bold,
    color: text,
  });
  let yy = y - 12;
  const content =
    lines.length > 0 ? lines : ["—"];
  content.forEach((line) => {
    page.drawText(line.slice(0, 28), {
      x,
      y: yy,
      size: 7,
      font,
      color: muted,
    });
    yy -= 10;
  });
}
