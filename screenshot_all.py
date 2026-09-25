from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    for route in ['higher-lower', 'number-rush', 'memory', 'tic-tac-toe', 'typing']:
        page.goto(f'http://localhost:5173/{route}')
        page.screenshot(path=f'{route}.png', full_page=True)
    browser.close()
