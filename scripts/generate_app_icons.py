import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
assets_dir = os.path.join(project_root, 'assets')
images_dir = os.path.join(assets_dir, 'images')

os.makedirs(assets_dir, exist_ok=True)
os.makedirs(images_dir, exist_ok=True)

svg_path = os.path.join(assets_dir, 'icon.svg')

svg_content = """<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" fill="#0B0B0C"/>
  
  <!-- Boomerang / Chevron Logo Element (Top Center) -->
  <g transform="translate(0, 20)">
    <!-- Primary Boomerang -->
    <path d="M 512 240 L 760 395 L 690 440 L 512 335 L 334 440 L 264 395 Z" fill="#FFFFFF"/>
    <!-- Subtle Accent Wing -->
    <path d="M 512 200 L 790 375 L 755 398 L 512 245 L 269 398 L 234 375 Z" fill="#FFFFFF" opacity="0.4"/>
  </g>
  
  <!-- GARMIN Text (Center) -->
  <text x="512" y="605" text-anchor="middle" fill="#FFFFFF" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-weight="bold" font-size="140" letter-spacing="12">GARMIN</text>
  
  <!-- SPORTTIME Text (Bottom Orange) -->
  <text x="512" y="685" text-anchor="middle" fill="#FF5500" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-weight="bold" font-size="52" letter-spacing="22">SPORTTIME</text>
</svg>
"""

with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(svg_content)

print(f"Saved SVG to {svg_path}")

icon_png = os.path.join(assets_dir, 'icon.png')
adaptive_png = os.path.join(assets_dir, 'adaptive-icon.png')
favicon_png = os.path.join(assets_dir, 'favicon.png')

icon_png_legacy = os.path.join(images_dir, 'icon.png')
adaptive_png_legacy = os.path.join(images_dir, 'adaptive-icon.png')

# Convert SVG to 1024x1024 PNG using convert
subprocess.run(['convert', '-background', 'none', '-density', '300', svg_path, '-resize', '1024x1024', icon_png], check=True)
subprocess.run(['convert', '-background', 'none', '-density', '300', svg_path, '-resize', '1024x1024', adaptive_png], check=True)
subprocess.run(['convert', '-background', 'none', '-density', '300', svg_path, '-resize', '192x192', favicon_png], check=True)

# Copy to images_dir as legacy fallback
subprocess.run(['cp', icon_png, icon_png_legacy], check=True)
subprocess.run(['cp', adaptive_png, adaptive_png_legacy], check=True)

print("Icons generated successfully!")
