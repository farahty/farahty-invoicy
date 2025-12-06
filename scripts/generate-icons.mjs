import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const iconsDir = join(rootDir, "public", "icons");

// SVG template for the icon
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(
  size * 0.125
)}" fill="url(#bg)"/>
  <text x="${size / 2}" y="${
  size * 0.625
}" font-family="Arial, sans-serif" font-size="${Math.round(
  size * 0.47
)}" font-weight="bold" fill="#f97316" text-anchor="middle">F</text>
</svg>
`;

// Maskable icon (with safe zone padding)
const createMaskableSvg = (size) => {
  const padding = size * 0.1; // 10% safe zone
  const innerSize = size - padding * 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <text x="${size / 2}" y="${
    size * 0.625
  }" font-family="Arial, sans-serif" font-size="${Math.round(
    innerSize * 0.47
  )}" font-weight="bold" fill="#f97316" text-anchor="middle">F</text>
</svg>
`;
};

const icons = [
  { name: "icon-72x72.png", size: 72, maskable: false },
  { name: "icon-96x96.png", size: 96, maskable: false },
  { name: "icon-128x128.png", size: 128, maskable: false },
  { name: "icon-144x144.png", size: 144, maskable: false },
  { name: "icon-152x152.png", size: 152, maskable: false },
  { name: "icon-192x192.png", size: 192, maskable: false },
  { name: "icon-384x384.png", size: 384, maskable: false },
  { name: "icon-512x512.png", size: 512, maskable: false },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
  { name: "maskable-icon-512x512.png", size: 512, maskable: true },
  { name: "favicon-16x16.png", size: 16, maskable: false },
  { name: "favicon-32x32.png", size: 32, maskable: false },
];

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  for (const icon of icons) {
    const svg = icon.maskable
      ? createMaskableSvg(icon.size)
      : createSvg(icon.size);
    const buffer = Buffer.from(svg);

    await sharp(buffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(iconsDir, icon.name));

    console.log(`Generated ${icon.name}`);
  }

  // Also generate favicon.ico from 32x32
  const favicon32Svg = createSvg(32);
  await sharp(Buffer.from(favicon32Svg))
    .resize(32, 32)
    .toFile(join(rootDir, "public", "favicon.ico"));

  console.log("Generated favicon.ico");
  console.log("\nAll icons generated successfully!");
}

generateIcons().catch(console.error);
