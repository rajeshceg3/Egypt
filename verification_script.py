
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:3000")
        try:
            page.goto("http://localhost:3000", timeout=60000)
        except Exception as e:
            print(f"Error loading page: {e}")
            browser.close()
            return

        print("Waiting for page to load...")
        # Wait for the title or some text
        try:
            # Check for "ETERNAL SANDS" which appears after 5.5s
            # But let's just wait a fixed time first to be safe
            time.sleep(12)

            page.screenshot(path="verification_screenshot.png")
            print("Screenshot taken.")
        except Exception as e:
            print(f"Error during verification: {e}")
            # Take screenshot anyway if possible
            page.screenshot(path="verification_error.png")

        browser.close()

if __name__ == "__main__":
    run()
