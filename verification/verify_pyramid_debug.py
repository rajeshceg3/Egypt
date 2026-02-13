from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console messages
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    page.goto("http://localhost:3000")

    # Wait for the "Begin Journey" button
    print("Waiting for Begin Journey button...")
    try:
        button = page.get_by_text("Begin Journey")
        button.wait_for(timeout=10000)

        # Click it
        print("Clicking Begin Journey...")
        button.click()

        # Wait for the overlay to disappear and canvas to appear
        print("Waiting for experience to load...")
        time.sleep(5)

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/pyramid_debug.png")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/pyramid_error.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
