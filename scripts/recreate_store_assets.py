import os
from PIL import Image, ImageDraw, ImageFont

def create_garmin_connect_icon():
    # 256x256 RGBA clean icon
    img = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Dark rounded square background
    draw.rounded_rectangle([8, 8, 248, 248], radius=50, fill=(26, 26, 28, 255))
    
    # Vibrant blue Garmin 'C' arc / circle
    draw.arc([40, 40, 216, 216], start=45, end=315, fill=(0, 132, 255, 255), width=28)
    
    # Inner blue accent dot
    draw.ellipse([108, 108, 148, 148], fill=(0, 132, 255, 255))
    
    filepath = "assets/images/stores/garmin-connect.png"
    img.save(filepath, "PNG")
    print(f"Created clean {filepath}")

def create_connect_iq_icon():
    # 256x256 RGBA clean icon
    img = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Dark rounded square background
    draw.rounded_rectangle([8, 8, 248, 248], radius=50, fill=(22, 22, 24, 255))
    
    # Cyan / Teal IQ text badge
    # Draw cyan outer ring
    draw.ellipse([36, 36, 220, 220], outline=(0, 210, 255, 255), width=18)
    
    filepath = "assets/images/stores/connect-iq.png"
    img.save(filepath, "PNG")
    print(f"Created clean {filepath}")

if __name__ == "__main__":
    os.makedirs("assets/images/stores", exist_ok=True)
    create_garmin_connect_icon()
    create_connect_iq_icon()
