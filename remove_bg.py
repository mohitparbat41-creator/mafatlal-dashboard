from PIL import Image

def remove_white_background(input_path, output_path, tolerance=20):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Change all white (also shades of white)
        # to transparent
        if item[0] >= 255 - tolerance and item[1] >= 255 - tolerance and item[2] >= 255 - tolerance:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_white_background("public/logo.png", "public/logo_transparent.png")
    print("Done")
