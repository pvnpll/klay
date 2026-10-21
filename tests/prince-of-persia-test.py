import subprocess
import time
from playwright.sync_api import sync_playwright

preview_proc = subprocess.Popen(
    ["npm", "run", "preview", "--", "--port", "4174"],
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

        print("Visiting /prince-of-persia...")
        page.goto("http://127.0.0.1:4174/prince-of-persia")
        page.wait_for_timeout(500)

        assert len(errors) == 0, f"Page errors found: {errors}"

        # 1. Check Nokia 3510i handset image
        handset = page.locator("img[alt='Nokia 3510i Handset']")
        assert handset.count() > 0, "Nokia 3510i handset image not found"
        print("Nokia 3510i Handset verified.")

        # 2. Check LCD canvas
        canvas = page.locator("canvas")
        assert canvas.count() > 0, "Canvas not found"
        print("LCD Canvas verified.")

        # Capture Title screen
        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/pop-title.png")
        print("Captured pop-title.png")

        # 3. Start game with Key 5 or tap
        print("Starting game by pressing key 5...")
        key_5 = page.locator("button[aria-label*='Key 5']").first
        key_5.click()
        page.wait_for_timeout(500)

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/pop-playing.png")
        print("Captured pop-playing.png")

        # 4. Move Prince Right: key 6
        print("Testing movement: pressing Key 6 (Run Right)...")
        key_6 = page.locator("button[aria-label*='Key 6']").first
        for _ in range(4):
            key_6.click()
            page.wait_for_timeout(100)

        # 5. Jump / Vault: key 2
        print("Testing Jump: pressing Key 2...")
        key_2 = page.locator("button[aria-label*='Key 2']").first
        key_2.click()
        page.wait_for_timeout(250)

        # 6. Sword Attack Combo: key 5
        print("Testing Sword Combat combo...")
        key_5.click()
        page.wait_for_timeout(120)
        key_5.click()
        page.wait_for_timeout(200)

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/pop-combat.png")
        print("Captured pop-combat.png")

        # 7. Water Freeze Power: key 7
        print("Testing Water Freeze Power: pressing Key 7...")
        key_7 = page.locator("button[aria-label*='Key 7']").first
        key_7.click()
        page.wait_for_timeout(300)

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/pop-water-freeze.png")
        print("Captured pop-water-freeze.png")

        # 8. Sands of Time Rewind: press and hold key 0
        print("Testing Sands of Time Rewind: key 0...")
        page.keyboard.down("0")
        page.wait_for_timeout(300)
        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/pop-rewind.png")
        print("Captured pop-rewind.png")
        page.keyboard.up("0")
        page.wait_for_timeout(200)

        # 9. Keypad cheat code 787898 for God Mode
        print("Testing God Mode cheat: 787898...")
        for k in ["7", "8", "7", "8", "9", "8"]:
            btn = page.locator(f"button[aria-label*='Key {k}']").first
            btn.click()
            page.wait_for_timeout(50)
        page.wait_for_timeout(300)

        # 10. Check Home page for Prince of Persia listing
        print("Visiting Home page to verify Prince of Persia is listed...")
        page.goto("http://127.0.0.1:4174/")
        page.wait_for_timeout(600)
        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/pop-homepage.png")
        print("Captured pop-homepage.png")

        # Check for link or text with Prince of Persia
        pop_link = page.locator("a[href='/prince-of-persia']")
        assert pop_link.count() > 0, "Prince of Persia link not found on Home page"
        print("Prince of Persia confirmed on Home page!")

        print("All Prince of Persia tests passed successfully!")
        browser.close()
finally:
    preview_proc.terminate()
