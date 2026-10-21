import subprocess
import time
from playwright.sync_api import sync_playwright

# Start vite preview server
preview_proc = subprocess.Popen(
    ["npm", "run", "preview", "--", "--port", "4173"],
    cwd=".",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

try:
    time.sleep(2)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 420, "height": 860}, has_touch=True)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        print("Visiting /space-impact...")
        page.goto("http://127.0.0.1:4173/space-impact")
        page.wait_for_timeout(500)

        assert len(errors) == 0, f"Page errors found: {errors}"

        # Check Nokia handset image exists
        handset = page.locator("img[alt='Nokia 3510i Handset']")
        assert handset.count() > 0, "Nokia 3510i handset image not found"
        print("Nokia 3510i Handset verified.")

        # Check canvas exists
        canvas = page.locator("canvas")
        assert canvas.count() > 0, "Canvas not found"
        print("LCD Canvas verified.")

        # Take initial screenshot of title screen inside Nokia phone
        page.screenshot(path="space-impact-title.png")
        print("Captured space-impact-title.png")

        # Test touch screen interaction: tap canvas to start game
        print("Tapping touch screen canvas to launch mission...")
        canvas.tap()
        page.wait_for_timeout(400)

        # Capture in-game playing screenshot
        page.screenshot(path="space-impact-playing.png")
        print("Captured space-impact-playing.png")

        # Test keypad interaction:
        # Fire Blaster: key 5
        print("Testing Nokia keypad: pressing '5' (Fire Blaster)...")
        key_5 = page.locator("button[aria-label*='Key 5']").first
        key_5.click()
        page.wait_for_timeout(100)
        key_5.click()
        page.wait_for_timeout(100)

        # Move Up: key 2
        print("Testing Nokia keypad: pressing '2' (Up)...")
        key_2 = page.locator("button[aria-label*='Key 2']").first
        key_2.click()
        page.wait_for_timeout(200)

        # Move Right: key 6
        print("Testing Nokia keypad: pressing '6' (Right)...")
        key_6 = page.locator("button[aria-label*='Key 6']").first
        key_6.click()
        page.wait_for_timeout(200)

        # Move Down: key 8
        print("Testing Nokia keypad: pressing '8' (Down)...")
        key_8 = page.locator("button[aria-label*='Key 8']").first
        key_8.click()
        page.wait_for_timeout(200)

        # Test Special Weapon: key 0 (Fire Missile)
        print("Testing Special Weapon: pressing '0' (Launch Rocket)...")
        page.keyboard.press("0")
        page.wait_for_timeout(250)

        # Test touch screen steering on canvas: drag finger to steer
        print("Testing touchscreen steering on LCD...")
        box = canvas.bounding_box()
        assert box is not None
        page.mouse.move(box["x"] + box["width"] * 0.3, box["y"] + box["height"] * 0.5)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.7)
        page.wait_for_timeout(300)
        page.mouse.up()

        # Capture screenshot while in combat
        page.screenshot(path="space-impact-combat.png")
        print("Captured space-impact-combat.png")

        # Test cheat code 787898 on keypad
        print("Testing Nokia cheat code 787898...")
        for key in ["7", "8", "7", "8", "9", "8"]:
            btn = page.locator(f"button[aria-label*='Key {key}']").first
            btn.click()
            page.wait_for_timeout(60)

        page.wait_for_timeout(400)
        page.screenshot(path="space-impact-godmode.png")
        print("Captured space-impact-godmode.png")

        # Test Theme Toggle with '#'
        print("Testing LCD Theme toggle with '#'...")
        page.keyboard.press("#")
        page.wait_for_timeout(300)
        page.screenshot(path="space-impact-color-theme.png")
        print("Captured space-impact-color-theme.png")

        print("All Space Impact tests completed successfully!")
        browser.close()
finally:
    preview_proc.terminate()
