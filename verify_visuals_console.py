import time
from playwright.sync_api import sync_playwright

def verify_visuals():
    with sync_playwright() as p:
        # Try to use swiftshader for software rendering if possible, but headless is the main constraint
        browser = p.chromium.launch(headless=True, args=["--use-gl=swiftshader"])
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"Console ({msg.type}): {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000", timeout=60000)

            # Wait for "Begin Journey" button
            button = page.get_by_text("Begin Journey")
            button.wait_for()
            button.click()

            # Wait for canvas
            page.wait_for_selector("canvas", timeout=30000)

            # Wait for render
            time.sleep(5)

            # Screenshot
            page.screenshot(path="verification_console_check.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_visuals()
