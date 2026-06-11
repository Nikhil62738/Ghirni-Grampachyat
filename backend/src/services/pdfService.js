const PDFDocument = require("pdfkit");
const { toDataUrl } = require("./qrService");

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

/**
 * Generates an official-style receipt PDF and resolves with a Buffer.
 * @param {Object} opts
 * @param {Object} opts.receipt   - Receipt document
 * @param {Object} opts.taxpayer  - Taxpayer document
 * @param {Object} opts.settings  - Settings document (GP info)
 * @param {string} opts.verifyUrl - QR verification URL
 */
async function generateReceiptPdf({ receipt, taxpayer, settings, verifyUrl }) {
  const qrDataUrl = await toDataUrl(verifyUrl);
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrBase64, "base64");

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const gpName = settings.gramPanchayatName || "Gram Panchayat Ghirni";
      const blue = "#1e3a8a";

      // Header band
      doc.rect(0, 0, doc.page.width, 90).fill(blue);
      doc.fillColor("#ffffff").fontSize(10).text("GOVERNMENT OF MAHARASHTRA", 50, 22);
      doc.fontSize(18).text(gpName, 50, 38);
      doc
        .fontSize(9)
        .text(
          `Tq. ${settings.taluka || "Malkapur"}, Dist. ${settings.district || "Buldhana"} - ${settings.pincode || "443102"}`,
          50,
          62
        );

      doc.fillColor("#000000");
      doc.moveDown(4);
      doc.fontSize(15).fillColor(blue).text("TAX PAYMENT RECEIPT", 50, 110, { align: "center" });
      doc.fillColor("#000000");

      // QR code top-right
      doc.image(qrBuffer, doc.page.width - 130, 105, { width: 80 });
      doc.fontSize(7).fillColor("#555").text("Scan to verify", doc.page.width - 130, 188, { width: 80, align: "center" });
      doc.fillColor("#000");

      let y = 150;
      const line = (label, value) => {
        doc.fontSize(10).fillColor("#374151").text(label, 50, y);
        doc.fontSize(10).fillColor("#111827").text(String(value == null ? "-" : value), 220, y);
        y += 20;
      };

      // Fall back to the receipt snapshot if the taxpayer record was deleted.
      const tp = taxpayer || {};
      const snap = receipt.snapshot || {};

      line("Receipt Number", receipt.receiptNumber);
      line("Payment Date", new Date(receipt.paymentDate).toLocaleString("en-IN"));
      line("Taxpayer ID", tp.taxpayerId || snap.taxpayerId);
      line("Name", tp.fullName || snap.fullName);
      line("Father's Name", tp.fatherName || snap.fatherName);
      line("House Number", tp.houseNumber || snap.houseNumber);
      line("Property Number", tp.propertyNumber || snap.propertyNumber);
      line("Ward Number", tp.wardNumber || snap.wardNumber);
      line("Village", tp.village || snap.village);

      y += 6;
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor("#cbd5e1").stroke();
      y += 14;

      line("Amount Paid", inr(receipt.amount));
      line("Payment Mode", String(receipt.mode).toUpperCase());
      line("Remaining Balance", inr(receipt.remainingBalance));

      y += 20;
      // Verification stamp
      doc
        .rect(50, y, 200, 50)
        .lineWidth(1.5)
        .strokeColor("#16a34a")
        .stroke();
      doc.fillColor("#16a34a").fontSize(11).text("DIGITALLY VERIFIED", 60, y + 12);
      doc.fontSize(7).fillColor("#16a34a").text(`Token: ${receipt.verificationToken}`, 60, y + 30, { width: 180 });

      // Authorized signature
      doc.fillColor("#000").fontSize(10).text("Authorized Signatory", doc.page.width - 220, y + 30, { width: 170, align: "center" });
      doc.moveTo(doc.page.width - 220, y + 26).lineTo(doc.page.width - 50, y + 26).strokeColor("#111").stroke();

      y += 80;
      doc
        .fontSize(8)
        .fillColor("#6b7280")
        .text(
          "This is a computer-generated receipt. Verify authenticity by scanning the QR code above.",
          50,
          y,
          { align: "center", width: doc.page.width - 100 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReceiptPdf };
