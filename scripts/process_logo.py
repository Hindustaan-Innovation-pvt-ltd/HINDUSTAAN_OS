import sys
import subprocess

try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def process_image(input_path):
    # Open image and convert to RGBA
    img = Image.open(input_path).convert('RGBA')
    datas = img.getdata()
    
    # Remove white background
    newData = []
    for item in datas:
        # Check if the pixel is near-white (with a tolerance for anti-aliasing artifacts)
        # Using > 230 to catch light grays around the edges
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    
    # Get bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    width, height = img.size
    
    # Estimate the circular H symbol to be roughly the top 60% of the image
    # We will refine this by finding the gap between the circle and the text
    # But a hardcoded percentage (65%) is safest for now
    icon_bbox = (0, 0, width, int(height * 0.62))
    icon = img.crop(icon_bbox)
    
    # Remove any extra transparent space around the cropped icon
    icon_bbox2 = icon.getbbox()
    if icon_bbox2:
        icon = icon.crop(icon_bbox2)
    
    # Crop the logo + text (top 85% of the image to remove slogan)
    logo_full_bbox = (0, 0, width, int(height * 0.88))
    logo_full = img.crop(logo_full_bbox)
    
    logo_full_bbox2 = logo_full.getbbox()
    if logo_full_bbox2:
        logo_full = logo_full.crop(logo_full_bbox2)
    
    icon.save('public/icon.png', 'PNG')
    logo_full.save('public/logo-full.png', 'PNG')
    print("Successfully processed images!")

process_image('public/logo.png')
