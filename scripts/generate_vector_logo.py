import os
from PIL import Image, ImageDraw, ImageFont

def create_orange_garmin_logo(output_path):
    # High resolution canvas for maximum sharpness
    width, height = 1920, 600
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    orange = (255, 100, 0, 255) # #FF6400 vibrant Garmin orange

    # 1. Draw geometric multi-peak mountain range at top
    # Center X = 960
    center_x = width // 2
    top_y = 40
    
    # Define sharp mountain peaks
    # Left peak, Main high peak, Right peak, Far right peak
    mountains = [
        # Main center-left high peak
        [(center_x - 320, 240), (center_x - 120, 50), (center_x + 80, 240)],
        # Far left peak
        [(center_x - 460, 240), (center_x - 300, 100), (center_x - 140, 240)],
        # Main center-right peak
        [(center_x - 80, 240), (center_x + 140, 65), (center_x + 360, 240)],
        # Far right peak
        [(center_x + 160, 240), (center_x + 320, 110), (center_x + 480, 240)],
    ]

    # Draw mountain lines / filled sharp polygons with cutout facets for 3D vector look
    for coords in mountains:
        p1, p2, p3 = coords
        # Outer mountain silhouette fill
        draw.polygon([p1, p2, p3], fill=orange)
        # Inner cut out shadow facet to make it look like a clean geometric ridge
        mid_base_x = (p1[0] + p3[0]) // 2 + 10
        draw.polygon([(mid_base_x, 240), p2, p3], fill=(230, 85, 0, 255))

    # Base ground line under mountains
    draw.rectangle([center_x - 520, 238, center_x + 520, 246], fill=orange)

    # 2. Try loading clean bold sans-serif fonts, or fallback to default with scaled custom rendering
    font_path_bold = None
    font_path_regular = None

    possible_fonts = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf",
        "/usr/share/fonts/opentype/font-awesome/FontAwesome.otf"
    ]
    possible_regular_fonts = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf",
    ]

    for f in possible_fonts:
        if os.path.exists(f):
            font_path_bold = f
            break

    for f in possible_regular_fonts:
        if os.path.exists(f):
            font_path_regular = f
            break

    garmin_font_size = 170
    sport_time_font_size = 95

    if font_path_bold:
        font_garmin = ImageFont.truetype(font_path_bold, garmin_font_size)
    else:
        font_garmin = ImageFont.load_default()

    if font_path_regular:
        font_sport_time = ImageFont.truetype(font_path_regular, sport_time_font_size)
    elif font_path_bold:
        font_sport_time = ImageFont.truetype(font_path_bold, sport_time_font_size)
    else:
        font_sport_time = ImageFont.load_default()

    # Draw "GARMIN" text centered
    text_garmin = "GARMIN"
    bbox_g = draw.textbbox((0, 0), text_garmin, font=font_garmin)
    w_g = bbox_g[2] - bbox_g[0]
    garmin_x = center_x - w_g // 2
    garmin_y = 265
    draw.text((garmin_x, garmin_y), text_garmin, font=font_garmin, fill=orange)

    # Draw "Sport Time" text centered underneath
    text_st = "Sport Time"
    bbox_st = draw.textbbox((0, 0), text_st, font=font_sport_time)
    w_st = bbox_st[2] - bbox_st[0]
    st_x = center_x - w_st // 2
    st_y = garmin_y + (bbox_g[3] - bbox_g[1]) + 15
    draw.text((st_x, st_y), text_st, font=font_sport_time, fill=orange)

    # Crop tight around the drawn logo content with padding
    bbox = img.getbbox()
    if bbox:
        # Add 20px padding
        pad = 20
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(width, bbox[2] + pad),
            min(height, bbox[3] + pad)
        )
        img = img.crop(crop_box)

    img.save(output_path, "PNG")
    print(f"Generated clean orange logo at {output_path} (size: {img.size})")

if __name__ == "__main__":
    create_orange_garmin_logo("assets/images/logo-mountain.png")
