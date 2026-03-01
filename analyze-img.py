from PIL import Image

# test demo_page_idle_1772290916430.png
img = Image.open(r"C:\Users\Kris\.gemini\antigravity\brain\c67b6a65-55f3-4be6-8a66-41e96b2be4b5\demo_page_idle_1772290916430.png")

# Sample a pixel from the background (e.g. at x=300, y=900 where there is no card)
bg_pixel = img.getpixel((300, 900))
print("Background pixel (300, 900):", bg_pixel)

# Sample a pixel from the card (e.g. x=300, y=300)
card_pixel = img.getpixel((300, 300))
print("Card pixel (300, 300):", card_pixel)

# Sample a pixel from the sidebar (e.g. x=50, y=500)
sidebar_pixel = img.getpixel((50, 500))
print("Sidebar pixel (50, 500):", sidebar_pixel)
