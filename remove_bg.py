from PIL import Image

def remove_white_bg(input_path, output_path, tolerance=20):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is white-ish (considering tolerance)
        if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
            # Change all white-ish pixels to transparent
            # Also fade pixels based on how white they are to blend smoke smoothly
            avg = sum(item[:3]) / 3
            if avg > 255 - tolerance:
                # Fully transparent
                new_data.append((item[0], item[1], item[2], 0))
            else:
                alpha = int(255 - ((avg - (255 - tolerance)) / tolerance) * 255)
                new_data.append((item[0], item[1], item[2], alpha))
        else:
            # For non-white pixels, if they are light gray (smoke), we can calculate alpha based on lightness
            # Since the background is dark, we can convert white to transparent and keep colors.
            # A better approach for smoke on white:
            # The darker the pixel, the more opaque it should be.
            # Since the original is on a white background, the RGB values are mostly 255 for bg.
            # Actually, standard "multiply" effect: alpha = 255 - grayscale(pixel) doesn't work well if colors are involved.
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_white_bg("assets/img/logo-smoke-2.png", "assets/img/logo-smoke-transparent.png", 30)
