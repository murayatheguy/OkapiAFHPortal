import type { Express, Request, Response } from "express";
import puppeteer from "puppeteer";

interface NCPPdfRequest {
  html: string;
  filename?: string;
}

export function registerPdfRoutes(app: Express) {
  /**
   * Generate PDF from HTML using Puppeteer
   * POST /api/generate-pdf/ncp
   * Body: { html: string, filename?: string }
   * Returns: PDF binary with proper headers
   */
  app.post("/api/generate-pdf/ncp", async (req: Request, res: Response) => {
    try {
      const { html, filename = "ncp-form.pdf" }: NCPPdfRequest = req.body;

      if (!html) {
        return res.status(400).json({ error: "HTML content is required" });
      }

      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      });

      try {
        const page = await browser.newPage();

        // Set content with wait until network is idle
        await page.setContent(html, {
          waitUntil: ["networkidle0", "domcontentloaded"],
        });

        // Generate PDF with landscape orientation matching DSHS format
        const pdfBuffer = await page.pdf({
          format: "Letter",
          landscape: true,
          printBackground: true,
          margin: {
            top: "0.25in",
            right: "0.25in",
            bottom: "0.25in",
            left: "0.25in",
          },
          preferCSSPageSize: false,
        });

        // Set response headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        // Send the PDF
        res.send(pdfBuffer);
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Health check for PDF service
   */
  app.get("/api/generate-pdf/health", async (_req: Request, res: Response) => {
    try {
      // Quick test to ensure Puppeteer can launch
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      await browser.close();

      res.json({ status: "ok", service: "pdf-generator" });
    } catch (error) {
      res.status(500).json({
        status: "error",
        service: "pdf-generator",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
