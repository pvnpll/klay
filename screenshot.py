from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:5173/')
    page.screenshot(path='screenshot.png', full_page=True)
    
    # also screenshot one game
    page.goto('http://localhost:5173/reaction')
    page.screenshot(path='reaction.png', full_page=True)
    
    browser.close()
