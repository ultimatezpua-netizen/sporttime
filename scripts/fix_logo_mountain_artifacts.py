import os
from PIL import Image

def clean_logo_artifacts(filepath):
    img = Image.open(filepath).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    cleaned_count = 0
    # Clean top portion of image (first 15% of height) for isolated white/bright pixels
    for y in range(int(h * 0.25)):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # If pixel is bright/white (r > 200, g > 200, b > 200) and isolated or near top border
            if r > 200 and g > 200 and b > 200 and a > 0:
                # Check if it's near top edge or has transparent neighbors
                is_isolated = False
                if y < 15:
                    is_isolated = True
                else:
                    # check if surrounded by low alpha or dark pixels
                    transparent_neighbors = 0
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (1,-1)]:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            nr, ng, nb, na = pixels[nx, ny]
                            if na < 50 or (nr < 50 and ng < 50 and nb < 50):
                                transparent_neighbors += 1
                    if transparent_neighbors >= 2:
                        is_isolated = True
                
                if is_isolated:
                    pixels[x, y] = (0, 0, 0, 0)
                    cleaned_count += 1

    img.save(filepath, "PNG")
    print(f"Cleaned {cleaned_count} artifact pixels in {filepath}")

if __name__ == "__main__":
    clean_logo_artifacts("assets/images/logo-mountain.png")
