import time
from playwright.sync_api import sync_playwright

def verify_visuals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000", timeout=60000)

            # Listen for console errors
            page.on("console", lambda msg: print(f"Console: {msg.text}"))
            page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

            time.sleep(5)

            # Take a screenshot to see what's happening
            page.screenshot(path="debug_screenshot.png")

            # Check for canvas
            if page.locator("canvas").count() > 0:
                print("Canvas found!")
            else:
                print("Canvas NOT found!")
                print(page.content()) # Print HTML to see if there's an error overlay

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_visuals()
