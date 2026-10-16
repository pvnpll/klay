"""Run against the local Vite preview: venv/bin/python tests/game-regressions.py."""
from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 844}, has_touch=True)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    def visit(path):
        page.goto('http://127.0.0.1:5173/' + path)
        page.wait_for_timeout(100)
    visit('stack')
    page.get_by_role('button', name='Build Tower').click()
    page.wait_for_timeout(100)
    page.keyboard.press('Space')
    assert page.get_by_text('Tower height: 0', exact=False).count(), 'Space must drop, not restart'
    visit('perfect-timing')
    page.keyboard.press('Space')
    page.keyboard.press('Space')
    assert not page.get_by_text('Tap to Start!', exact=True).count()
    visit('target-click')
    page.get_by_role('button', name='Start Training').click()
    for i in range(20):
        page.locator('button.absolute').tap()
    assert page.get_by_text('20 targets smashed!', exact=False).count()
    stats = page.evaluate("JSON.parse(localStorage.getItem('klay_user_stats'))")
    assert stats['playCounts']['target-click'] == 1
    visit('one-second')
    area = page.locator('[tabindex="0"]')
    area.focus()
    page.keyboard.down('Space')
    page.wait_for_timeout(2100)
    page.keyboard.up('Space')
    assert page.get_by_text('0%', exact=True).count()
    visit('sequence')
    page.get_by_role('button', name='Play Sequences').click()
    page.wait_for_timeout(2200)
    assert '58s' in page.inner_text('body')
    visit('pong')
    page.get_by_role('button', name='Start Rally').click()
    board = page.locator('.aspect-\\[3\\/4\\]')
    board.scroll_into_view_if_needed()
    rect = board.bounding_box()
    page.mouse.move(rect['x'] + rect['width'] * .8, min(800, rect['y'] + rect['height'] * .5))
    paddle = board.locator('div.absolute').last
    page.wait_for_timeout(100)
    assert 'left: 40%' not in paddle.get_attribute('style'), paddle.get_attribute('style')
    # Rally must keep moving after a point, even without paddle input.
    page.wait_for_timeout(12000)
    ball = board.locator('div.rounded-full').first
    first = ball.get_attribute('style')
    page.wait_for_timeout(150)
    assert first != ball.get_attribute('style') or page.get_by_text('The AI beat you!', exact=False).count(), 'Pong loop stalled'
    visit('2048')
    page.keyboard.press('ArrowLeft')
    assert page.evaluate('scrollY') == 0
    assert not errors, json.dumps(errors)
    print('PASS: keyboard drops, touch target completion, single score save, accuracy floor, countdown, Pong controls/rallies, 2048 keyboard')
    browser.close()
