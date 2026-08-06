import os
from PIL import Image, ImageDraw, ImageFont

def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

# 1. App Store Badge (400 x 120)
def create_app_store_badge(filepath):
    ensure_dir(filepath)
    w, h = 400, 120
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Black rounded rectangle background
    draw.rounded_rectangle([2, 2, w-3, h-3], radius=16, fill=(10, 10, 10, 255), outline=(60, 60, 60, 255), width=2)

    # Draw Apple Logo shape
    # Simple crisp Apple silhouette representation
    apple_x, apple_y = 45, 60
    # Left curve & Right curve
    draw.ellipse([apple_x-22, apple_y-20, apple_x+10, apple_y+20], fill=(255, 255, 255, 255))
    draw.ellipse([apple_x-10, apple_y-20, apple_x+22, apple_y+20], fill=(255, 255, 255, 255))
    # Bottom cutout
    draw.ellipse([apple_x-8, apple_y+14, apple_x+8, apple_y+26], fill=(10, 10, 10, 255))
    # Top leaf
    draw.ellipse([apple_x-2, apple_y-30, apple_x+12, apple_y-18], fill=(255, 255, 255, 255))
    # Right bite
    draw.ellipse([apple_x+10, apple_y-14, apple_x+26, apple_y+2], fill=(10, 10, 10, 255))

    # Text: "Download on the" & "App Store"
    try:
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        font_main = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    except:
        font_sub = ImageFont.load_default()
        font_main = font_sub

    draw.text((95, 22), "Download on the", font=font_sub, fill=(200, 200, 200, 255))
    draw.text((95, 48), "App Store", font=font_main, fill=(255, 255, 255, 255))

    img.save(filepath, "PNG")
    print(f"Saved: {filepath}")

# 2. Google Play Badge (400 x 120)
def create_google_play_badge(filepath):
    ensure_dir(filepath)
    w, h = 400, 120
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Black rounded rectangle background
    draw.rounded_rectangle([2, 2, w-3, h-3], radius=16, fill=(10, 10, 10, 255), outline=(60, 60, 60, 255), width=2)

    # Draw Google Play Triangle Logo
    pts = [(28, 30), (28, 90), (75, 60)]
    draw.polygon(pts, fill=(0, 229, 255, 255)) # Play blue/cyan
    draw.polygon([(28, 30), (55, 60), (28, 90)], fill=(34, 197, 94, 255)) # Green part
    draw.polygon([(28, 90), (55, 60), (75, 60)], fill=(255, 85, 0, 255)) # Orange part

    # Text: "GET IT ON" & "Google Play"
    try:
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        font_main = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
    except:
        font_sub = ImageFont.load_default()
        font_main = font_sub

    draw.text((95, 24), "GET IT ON", font=font_sub, fill=(200, 200, 200, 255))
    draw.text((95, 48), "Google Play", font=font_main, fill=(255, 255, 255, 255))

    img.save(filepath, "PNG")
    print(f"Saved: {filepath}")

# 3. Garmin Connect App Icon (192 x 192)
def create_garmin_connect_icon(filepath):
    ensure_dir(filepath)
    w, h = 192, 192
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark blue background with rounded corners
    draw.rounded_rectangle([0, 0, w-1, h-1], radius=40, fill=(13, 22, 38, 255), outline=(30, 45, 74, 255), width=3)

    # Cyan / Blue Outer Ring Arc
    draw.arc([32, 32, 160, 160], start=270, end=140, fill=(0, 229, 255, 255), width=14)

    # Orange Secondary Arc
    draw.arc([52, 52, 140, 140], start=270, end=40, fill=(255, 85, 0, 255), width=10)

    # White Center Circle Motif
    draw.ellipse([76, 76, 116, 116], fill=(255, 255, 255, 255))
    draw.rectangle([84, 92, 108, 100], fill=(13, 22, 38, 255))

    img.save(filepath, "PNG")
    print(f"Saved: {filepath}")

# 4. Connect IQ Store App Icon (192 x 192)
def create_connect_iq_icon(filepath):
    ensure_dir(filepath)
    w, h = 192, 192
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark Purple background with rounded corners
    draw.rounded_rectangle([0, 0, w-1, h-1], radius=40, fill=(20, 15, 33, 255), outline=(45, 34, 69, 255), width=3)

    # Letter 'I' bar in cyan
    draw.rounded_rectangle([48, 55, 66, 137], radius=8, fill=(0, 229, 255, 255))

    # Letter 'Q' circle in orange
    draw.ellipse([92, 60, 152, 120], outline=(255, 85, 0, 255), width=14)
    # Q tail
    draw.line([132, 104, 160, 134], fill=(255, 85, 0, 255), width=14)

    img.save(filepath, "PNG")
    print(f"Saved: {filepath}")

if __name__ == "__main__":
    base_dir = "assets/images/stores"
    create_app_store_badge(os.path.join(base_dir, "app-store-badge.png"))
    create_google_play_badge(os.path.join(base_dir, "google-play-badge.png"))
    create_garmin_connect_icon(os.path.join(base_dir, "garmin-connect-icon.png"))
    create_connect_iq_icon(os.path.join(base_dir, "connect-iq-icon.png"))
