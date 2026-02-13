from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Wait for the "Begin Journey" button
    print("Waiting for Begin Journey button...")
    button = page.get_by_text("Begin Journey")
    button.wait_for()

    # Click it
    print("Clicking Begin Journey...")
    button.click()

    # Wait for the overlay to disappear and canvas to appear
    # The canvas is inside Experience component which is inside a motion.div
    print("Waiting for experience to load...")
    time.sleep(5) # Allow transition (3s) + render time

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/pyramid_view.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
