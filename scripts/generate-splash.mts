import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const splashDir = join(rootDir, "public", "splash");

// iOS splash screen sizes (width x height)
const splashSizes = [
  { name: "apple-splash-750x1334.png", width: 750, height: 1334 },
  { name: "apple-splash-1170x2532.png", width: 1170, height: 2532 },
  { name: "apple-splash-1284x2778.png", width: 1284, height: 2778 },
  { name: "apple-splash-1179x2556.png", width: 1179, height: 2556 },
  { name: "apple-splash-1290x2796.png", width: 1290, height: 2796 },
  { name: "apple-splash-1536x2048.png", width: 1536, height: 2048 },
  { name: "apple-splash-1668x2388.png", width: 1668, height: 2388 },
  { name: "apple-splash-2048x2732.png", width: 2048, height: 2732 },
];

// Theme colors (light mode)
const bgColor = { r: 250, g: 250, b: 247 }; // oklch(0.9818 0.0054 95.0986) ≈ #fafaf7
const primaryColor = { r: 234, g: 88, b: 12 }; // oklch(0.6171 0.1375 39.0427) ≈ #ea580c

function createSplashSvg(width: number, height: number): string {
  const logoSize = Math.min(width, height) * 0.2;
  const fontSize = logoSize * 0.6;
  const textY = height / 2 + height * 0.15;
  const subtitleY = textY + fontSize * 0.5;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="rgb(${bgColor.r}, ${
    bgColor.g
  }, ${bgColor.b})"/>
  
  <!-- Logo container -->
  <rect 
    x="${(width - logoSize) / 2}" 
    y="${(height - logoSize) / 2 - height * 0.08}" 
    width="${logoSize}" 
    height="${logoSize}" 
    rx="${logoSize * 0.25}" 
    fill="rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})"
    stroke="rgb(220, 220, 215)"
    stroke-width="2"
    filter="drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))"
  />
  
  <!-- Logo letter -->
  <text 
    x="${width / 2}" 
    y="${height / 2 - height * 0.08 + logoSize * 0.35}" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b})" 
    text-anchor="middle"
  >F</text>
  
  <!-- App name -->
  <text 
    x="${width / 2}" 
    y="${textY}" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize * 0.5}" 
    font-weight="bold" 
    fill="rgb(80, 80, 75)" 
    text-anchor="middle"
  >Farahty</text>
  
  <!-- Subtitle -->
  <text 
    x="${width / 2}" 
    y="${subtitleY}" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize * 0.25}" 
    fill="rgb(140, 140, 135)" 
    text-anchor="middle"
  >Invoice Management</text>
</svg>
`;
}

async function generateSplashScreens() {
  await mkdir(splashDir, { recursive: true });

  for (const splash of splashSizes) {
    const svg = createSplashSvg(splash.width, splash.height);
    const buffer = Buffer.from(svg);

    await sharp(buffer)
      .resize(splash.width, splash.height)
      .png()
      .toFile(join(splashDir, splash.name));

    console.log(`Generated ${splash.name}`);
  }

  console.log("\nAll iOS splash screens generated successfully!");
}

generateSplashScreens().catch(console.error);
