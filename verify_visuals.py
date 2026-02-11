import time
from playwright.sync_api import sync_playwright

def verify_visuals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000", timeout=60000)

            # Wait for "Begin Journey" button
            print("Waiting for button...")
            # Use a robust selector for the button text
            button = page.get_by_text("Begin Journey")
            button.wait_for()

            # Click it
            print("Clicking 'Begin Journey'...")
            button.click()

            # Now wait for canvas (it renders after state change)
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=30000)

            # Wait for WebGL init
            print("Waiting for render (10s)...")
            time.sleep(10)

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification_screenshot.png")
            print("Screenshot saved to verification_screenshot.png")

        except Exception as e:
            print(f"Error: {e}")
            # Take error screenshot
            page.screenshot(path="error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_visuals()
