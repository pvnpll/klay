import subprocess
import time
from playwright.sync_api import sync_playwright

preview_proc = subprocess.Popen(
    ["npm", "run", "preview", "--", "--port", "4178"],
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

        # -------------------------------------------------------------
        # 1. RAPID ROLL
        # -------------------------------------------------------------
        print("Visiting /rapid-roll...")
        page.goto("http://127.0.0.1:4178/rapid-roll")
        page.wait_for_timeout(500)
        assert len(errors) == 0, f"Page errors: {errors}"

        assert page.locator("img[alt='Nokia 3510i Handset']").count() > 0
        assert page.locator("canvas").count() > 0
        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/rapid-roll-title.png")
        print("Captured rapid-roll-title.png")

        # Start game
        key_5 = page.locator("button[aria-label*='Key 5']").first
        key_5.click()
        page.wait_for_timeout(400)

        # Roll left / right
        key_4 = page.locator("button[aria-label*='Key 4']").first
        key_6 = page.locator("button[aria-label*='Key 6']").first
        key_4.click()
        page.wait_for_timeout(200)
        key_6.click()
        page.wait_for_timeout(200)

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/rapid-roll-playing.png")
        print("Captured rapid-roll-playing.png")

        # -------------------------------------------------------------
        # 2. ASPHALT: URBAN GT
        # -------------------------------------------------------------
        print("Visiting /asphalt...")
        page.goto("http://127.0.0.1:4178/asphalt")
        page.wait_for_timeout(500)
        assert len(errors) == 0, f"Page errors: {errors}"

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/asphalt-title.png")
        print("Captured asphalt-title.png")

        # Start race
        key_5 = page.locator("button[aria-label*='Key 5']").first
        key_5.click()
        page.wait_for_timeout(500)

        # Steer and Nitro
        key_4 = page.locator("button[aria-label*='Key 4']").first
        key_6 = page.locator("button[aria-label*='Key 6']").first
        key_6.click()
        page.wait_for_timeout(150)
        key_5.click() # Nitro
        page.wait_for_timeout(300)

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/asphalt-racing.png")
        print("Captured asphalt-racing.png")

        # -------------------------------------------------------------
        # 3. DIAMOND RUSH
        # -------------------------------------------------------------
        print("Visiting /diamond-rush...")
        page.goto("http://127.0.0.1:4178/diamond-rush")
        page.wait_for_timeout(500)
        assert len(errors) == 0, f"Page errors: {errors}"

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/diamond-rush-title.png")
        print("Captured diamond-rush-title.png")

        # Start game
        key_5 = page.locator("button[aria-label*='Key 5']").first
        key_5.click()
        page.wait_for_timeout(400)

        # Move explorer down and right to dig dirt
        key_8 = page.locator("button[aria-label*='Key 8']").first
        key_6 = page.locator("button[aria-label*='Key 6']").first
        key_8.click()
        page.wait_for_timeout(150)
        key_6.click()
        page.wait_for_timeout(200)

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/diamond-rush-playing.png")
        print("Captured diamond-rush-playing.png")

        # -------------------------------------------------------------
        # 4. HOME PAGE VERIFICATION
        # -------------------------------------------------------------
        print("Visiting Home page...")
        page.goto("http://127.0.0.1:4178/")
        page.wait_for_timeout(500)

        # Click Classic Nokia filter
        btn = page.locator("button:has-text('Classic Nokia')")
        if btn.count() > 0:
            btn.click()
            page.wait_for_timeout(300)

        # Verify links exist
        for path in ['/rapid-roll', '/asphalt', '/diamond-rush', '/bounce', '/space-impact', '/prince-of-persia']:
            assert page.locator(f"a[href='{path}']").count() > 0, f"Link {path} missing"

        page.screenshot(path="/Users/pavan/.gemini/antigravity/brain/794a8309-e631-4a56-8737-d4fd57375392/classics-homepage.png")
        print("Captured classics-homepage.png")

        print("All classic games tested successfully!")
        browser.close()
finally:
    preview_proc.terminate()
