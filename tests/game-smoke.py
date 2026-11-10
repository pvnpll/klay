import json
import os
import re
from playwright.sync_api import sync_playwright

BASE = os.getenv('GAME_BASE_URL', 'http://127.0.0.1:5173').rstrip('/')

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    paths = re.findall(r'path:\s*["\']([^"\']+)["\']', open('src/data/games.ts').read())
    for path in paths:
        if path == '/hanuman':
            continue
        page.goto(BASE + path)
        page.locator('h1').wait_for()
        assert page.locator('h1').count(), path
        assert page.get_by_role('button', name='How to play', exact=True).count(), path
        overflow = page.evaluate('document.documentElement.scrollWidth > innerWidth')
        print(path, 'overflow' if overflow else 'OK')
    print('ERRORS', json.dumps(errors))
    assert not errors, f"Smoke test page errors found: {errors}"
    b.close()
    print("ALL SMOKE TESTS PASSED.")
