import os
from PIL import Image, ImageDraw, ImageFont

def create_logo_header(filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    w, h = 420, 135
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 46)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_sub = font_large

    # Orange Accent Triangle / Chevron logo mark on the left
    pts = [(20, 30), (55, 30), (37, 95)]
    draw.polygon(pts, fill=(255, 85, 0, 255))
    pts2 = [(42, 30), (77, 30), (59, 95)]
    draw.polygon(pts2, fill=(255, 140, 0, 255))

    # Text: "SPORTTIME"
    draw.text((95, 20), "SPORTTIME", font=font_large, fill=(255, 255, 255, 255))
    # Subtext: "GARMIN PREMIUM NAVIGATOR"
    draw.text((98, 78), "GARMIN OFFICIAL STORE", font=font_sub, fill=(255, 85, 0, 255))

    img.save(filepath, "PNG")
    print(f"Generated header logo: {filepath}")

if __name__ == "__main__":
    create_logo_header("assets/images/logo-header.png")
