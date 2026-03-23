/**
 * Generates simple SVG-based PWA icons for development.
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install -g sharp  OR  just use any 192×192 / 512×512 PNG.
 *
 * For production, replace frontend/public/icon-192.png and icon-512.png
 * with proper app icons.
 */

import { writeFileSync } from 'fs'

function svgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#7c3aed"/>
  <text x="50%" y="55%" font-size="${size * 0.55}" text-anchor="middle" dominant-baseline="middle">🏆</text>
</svg>`
}

writeFileSync('frontend/public/icon-192.svg', svgIcon(192))
writeFileSync('frontend/public/icon-512.svg', svgIcon(512))
console.log('SVG icons written to frontend/public/')
console.log('Convert to PNG with: npx sharp-cli --input icon-192.svg --output icon-192.png')
