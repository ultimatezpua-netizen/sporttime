import os
from PIL import Image

def sanitize_png(filepath):
    try:
        img = Image.open(filepath)
        img.load()
        # Convert to RGBA or RGB
        if img.mode != "RGBA" and img.mode != "RGB":
            img = img.convert("RGBA")
        
        # Create clean new image and save cleanly
        clean_img = Image.new(img.mode, img.size)
        clean_img.paste(img)
        clean_img.save(filepath, "PNG", optimize=True)
        print(f"Sanitized PNG: {filepath} ({img.size}, {img.mode})")
    except Exception as e:
        print(f"Error sanitizing {filepath}: {e}")

def walk_and_sanitize(dirpath):
    for root, dirs, files in os.walk(dirpath):
        for f in files:
            if f.lower().endswith(".png"):
                full_path = os.path.join(root, f)
                sanitize_png(full_path)

if __name__ == "__main__":
    walk_and_sanitize("assets")
