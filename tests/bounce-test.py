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
        # Test mobile viewport & desktop
        page = browser.new_page(viewport={"width": 420, "height": 860}, has_touch=True)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        
        print("Visiting /bounce...")
        page.goto("http://127.0.0.1:4173/bounce")
        page.wait_for_timeout(500)

        assert len(errors) == 0, f"Page errors found: {errors}"

        # Check Nokia branding & elements
        nokia_text = page.locator("text=NOKIA").count()
        assert nokia_text > 0, "NOKIA logo not found"
        print(f"NOKIA logo verified ({nokia_text} instances).")

        # Check canvas exists
        canvas = page.locator("canvas")
        assert canvas.count() > 0, "Canvas not found"
        print("LCD Canvas verified.")

        # Take initial screenshot of title screen inside Nokia phone
        page.screenshot(path="bounce-title-screenshot.png")
        print("Captured bounce-title-screenshot.png")

        # Test touch screen interaction: tap the canvas directly!
        print("Tapping touch screen canvas to start game...")
        canvas.tap()
        page.wait_for_timeout(300)

        # Take screenshot of in-game playing screen
        page.screenshot(path="bounce-playing-screenshot.png")
        print("Captured bounce-playing-screenshot.png")

        # Test keypad interaction: press key 6 (Move Right)
        print("Testing Nokia keypad: pressing '6'...")
        key_6 = page.locator("button:has-text('6')").first
        key_6.click()
        page.wait_for_timeout(200)

        # Test jump: press key 2
        print("Testing Nokia keypad: pressing '2'...")
        key_2 = page.locator("button:has-text('2')").first
        key_2.click()
        page.wait_for_timeout(300)

        # Test touch screen steering on canvas: tap right side of LCD
        print("Testing touch screen steering: tapping right half...")
        box = canvas.bounding_box()
        assert box is not None
        page.mouse.click(box["x"] + box["width"] * 0.75, box["y"] + box["height"] * 0.75)
        page.wait_for_timeout(200)

        # Test cheat code 787898
        print("Testing cheat code 787898...")
        for key in ["7", "8", "7", "8", "9", "8"]:
            btn = page.locator(f"button:has-text('{key}')").first
            btn.click()
            page.wait_for_timeout(50)

        page.wait_for_timeout(300)
        # Check if GOD mode indicator appears
        god_indicator = page.locator("text=GOD").count()
        print(f"God mode indicator count: {god_indicator}")
        assert god_indicator > 0, "God mode indicator did not appear after entering 787898"

        page.screenshot(path="bounce-godmode-screenshot.png")
        print("Captured bounce-godmode-screenshot.png")

        print("All assertions passed successfully!")
        browser.close()
finally:
    preview_proc.terminate()
