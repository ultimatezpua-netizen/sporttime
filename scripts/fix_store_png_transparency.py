import os
from PIL import Image, ImageDraw

def fix_badge(filepath):
    img = Image.open(filepath).convert("RGBA")
    w, h = img.size
    
    # We will flood-fill or convert pure white/light outer background to transparent
    # Create mask: any bright background near borders -> transparent
    pixels = img.load()
    
    # Floodfill from top-left, top-right, bottom-left, bottom-right corners
    visited = set()
    queue = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
    
    for q in queue:
        visited.add(q)
        
    while queue:
        x, y = queue.pop(0)
        r, g, b, a = pixels[x, y]
        # If it's bright background (outer white canvas)
        if r > 150 and g > 150 and b > 150:
            pixels[x, y] = (0, 0, 0, 0) # Make fully transparent
            
            # Check neighbors
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    nr, ng, nb, na = pixels[nx, ny]
                    if nr > 140 and ng > 140 and nb > 140:
                        queue.append((nx, ny))
                        
    img.save(filepath, "PNG")
    print(f"Fixed transparency for {filepath}")

if __name__ == "__main__":
    fix_badge("assets/images/stores/app-store.png")
    fix_badge("assets/images/stores/google-play.png")
