import type { RequestHandler } from "express";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph } from "docx";

export const exportPdf: RequestHandler = async (req, res) => {
  try {
    const { content = "", title = "Document" } = (req.body || {}) as { content?: string; title?: string };
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(Buffer.from(c)));
    doc.on("end", () => {
      const buf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${slugify(title)}.pdf"`);
      res.send(buf);
    });
    doc.fontSize(20).text(title, { underline: false });
    doc.moveDown();
    doc.fontSize(12).text(String(content), { align: "left" });
    doc.end();
  } catch (e: any) {
    res.status(500).json({ error: "export_pdf_failed", message: String(e?.message ?? e) });
  }
};

export const exportDocx: RequestHandler = async (req, res) => {
  try {
    const { content = "", title = "Document" } = (req.body || {}) as { content?: string; title?: string };
    const paragraphs: Paragraph[] = String(content)
      .split(/\n\n+/)
      .map((block) => new Paragraph(block.replace(/\n/g, "\n")));
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const buffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${slugify(title)}.docx"`);
    res.send(buffer);
  } catch (e: any) {
    res.status(500).json({ error: "export_docx_failed", message: String(e?.message ?? e) });
  }
};

export const exportCourse: RequestHandler = async (req, res) => {
  try {
    const { course, title = 'Cours' } = (req.body || {}) as any;
    if (!course) return res.status(400).json({ error: 'missing_course' });
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(Buffer.from(c)));
    const endPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
    });
    doc.fontSize(22).text(title, { underline: false });
    doc.moveDown();
    if (course.steps && Array.isArray(course.steps)) {
      for (let i = 0; i < course.steps.length; i++) {
        const s = course.steps[i];
        doc.fontSize(16).text(`${i+1}. ${s.title || 'Étape'}`);
        doc.moveDown(0.2);
        if (s.summary) doc.fontSize(12).text(String(s.summary));
        if (s.codeExample) {
          doc.moveDown(0.2);
          doc.fontSize(10).text(String(s.codeExample));
        }
        doc.moveDown();
      }
    }
    doc.end();
    const buf = await endPromise;
    const b64 = buf.toString('base64');
    res.json({ filename: `${slugify(title)}.pdf`, pdfB64: b64, course });
  } catch (e:any){
    res.status(500).json({ error: 'export_course_failed', message: String(e?.message ?? e) });
  }
};

function slugify(s: string) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
