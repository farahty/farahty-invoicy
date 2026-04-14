import fs from "node:fs";
import type { Browser } from "puppeteer-core";

// Lazily-initialized shared browser instance. Launching Chromium takes
// hundreds of ms, so we keep the same browser around for the lifetime of
// the Node process and spin up a fresh page per request.
let browserPromise: Promise<Browser> | null = null;

const defaultChromiumPaths = [
  "/usr/bin/chromium-browser", // alpine
  "/usr/bin/chromium", // debian/ubuntu
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

const resolveExecutablePath = (): string => {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  for (const candidate of defaultChromiumPaths) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Chromium executable not found. Install Chromium/Chrome or set PUPPETEER_EXECUTABLE_PATH."
  );
};

const launchBrowser = async (): Promise<Browser> => {
  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.default.launch({
    executablePath: resolveExecutablePath(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });
  browser.on("disconnected", () => {
    browserPromise = null;
  });
  return browser;
};

export const getBrowser = (): Promise<Browser> => {
  if (!browserPromise) {
    browserPromise = launchBrowser().catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  return browserPromise;
};

export const renderHtmlToPdf = async (html: string): Promise<Buffer> => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.emulateMediaType("print");
    // Ensure @font-face data URIs are fully decoded before paint.
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
};
