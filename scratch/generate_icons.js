const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const svgContent = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Deep Dark Background -->
  <rect width="1024" height="1024" rx="200" fill="#0B0B0C"/>

  <!-- Outer Titanium Bezel Accent Ring -->
  <circle cx="512" cy="512" r="430" fill="none" stroke="#1C1C1E" stroke-width="16"/>
  <circle cx="512" cy="512" r="430" fill="none" stroke="#FF5500" stroke-width="4" stroke-dasharray="140 800" transform="rotate(-45 512 512)"/>

  <!-- Precision Bezel Ticks -->
  <circle cx="512" cy="94" r="6" fill="#333338"/>
  <circle cx="512" cy="930" r="6" fill="#333338"/>
  <circle cx="94" cy="512" r="6" fill="#333338"/>
  <circle cx="930" cy="512" r="6" fill="#333338"/>

  <!-- Centered Brand Logo Group (Boomerang -> GARMIN -> SPORTTIME) -->
  <g transform="translate(512, 512)" text-anchor="middle">
    <!-- 1. White Garmin Boomerang / Chevron Mark -->
    <polygon points="-75,-160 85,-230 30,-140 -75,-160" fill="#FFFFFF"/>

    <!-- 2. GARMIN Text -->
    <text x="-15" y="-10" font-family="'Roboto Condensed', 'Oswald', 'Arial Black', sans-serif" font-weight="900" font-size="140" fill="#FFFFFF" letter-spacing="16">GARMIN</text>

    <!-- 3. SPORTTIME Subtitle -->
    <text x="0" y="80" font-family="'Roboto Condensed', 'Oswald', 'Arial', sans-serif" font-weight="700" font-size="52" fill="#FF5500" letter-spacing="28">SPORTTIME</text>

    <!-- Sub-badge Line -->
    <rect x="-140" y="125" width="280" height="3" fill="#FF5500" opacity="0.8"/>
  </g>
</svg>`;

const assetsDir = path.join(__dirname, '..', 'assets', 'images');
const svgPath = path.join(__dirname, 'icon_temp.svg');
fs.writeFileSync(svgPath, svgContent);

console.log('Generating PNG assets via ImageMagick...');

const iconPath = path.join(assetsDir, 'icon.png');
const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');
const splashPath = path.join(assetsDir, 'splash-screen.png');

execSync(`convert -background none ${svgPath} -resize 1024x1024 ${iconPath}`);
execSync(`convert -background none ${svgPath} -resize 1024x1024 ${adaptiveIconPath}`);
execSync(`convert -background none ${svgPath} -resize 2048x2048 ${splashPath}`);

fs.unlinkSync(svgPath);
console.log('Successfully generated updated app icon, adaptive icon, and splash screen PNGs!');
