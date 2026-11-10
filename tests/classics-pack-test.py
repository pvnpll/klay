import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_utils import ensure_server, get_output_dir

BASE_URL, preview_proc = ensure_server(default_port=4178)
output_dir = get_output_dir()

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 420, "height": 860}, has_touch=True)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        # -------------------------------------------------------------
        # 1. RAPID ROLL
        # -------------------------------------------------------------
        print(f"Visiting {BASE_URL}/rapid-roll...")
        page.goto(f"{BASE_URL}/rapid-roll")
        page.wait_for_timeout(500)
        assert len(errors) == 0, f"Page errors: {errors}"

        assert page.locator("img[alt='Nokia 3510i Handset']").count() > 0
        assert page.locator("canvas").count() > 0
        page.screenshot(path=os.path.join(output_dir, "rapid-roll-title.png"))
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

        page.screenshot(path=os.path.join(output_dir, "rapid-roll-playing.png"))
        print("Captured rapid-roll-playing.png")

        # -------------------------------------------------------------
        # 2. ASPHALT: URBAN GT
        # -------------------------------------------------------------
        print(f"Visiting {BASE_URL}/asphalt...")
        page.goto(f"{BASE_URL}/asphalt")
        page.wait_for_timeout(500)
        assert len(errors) == 0, f"Page errors: {errors}"

        page.screenshot(path=os.path.join(output_dir, "asphalt-title.png"))
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

        page.screenshot(path=os.path.join(output_dir, "asphalt-racing.png"))
        print("Captured asphalt-racing.png")

        # -------------------------------------------------------------
        # 3. DIAMOND RUSH
        # -------------------------------------------------------------
        print(f"Visiting {BASE_URL}/diamond-rush...")
        page.goto(f"{BASE_URL}/diamond-rush")
        page.wait_for_timeout(500)
        assert len(errors) == 0, f"Page errors: {errors}"

        page.screenshot(path=os.path.join(output_dir, "diamond-rush-title.png"))
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

        page.screenshot(path=os.path.join(output_dir, "diamond-rush-playing.png"))
        print("Captured diamond-rush-playing.png")

        # -------------------------------------------------------------
        # 4. HOME PAGE VERIFICATION
        # -------------------------------------------------------------
        print(f"Visiting Home page at {BASE_URL}...")
        page.goto(f"{BASE_URL}/")
        page.wait_for_timeout(500)

        # Click Classic Nokia filter
        btn = page.locator("button:has-text('Classic Nokia')")
        if btn.count() > 0:
            btn.click()
            page.wait_for_timeout(300)

        # Verify links exist
        for path in ['/rapid-roll', '/asphalt', '/diamond-rush', '/bounce', '/space-impact', '/prince-of-persia']:
            assert page.locator(f"a[href='{path}']").count() > 0, f"Link {path} missing"

        page.screenshot(path=os.path.join(output_dir, "classics-homepage.png"))
        print("Captured classics-homepage.png")

        print("All classic games tested successfully!")
        browser.close()
finally:
    if preview_proc:
        preview_proc.terminate()
