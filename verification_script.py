import time
from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # WebGL scenes need special args sometimes in headless mode, but we'll try default first
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            # 1. Go to localhost
            print("Navigating to localhost:3000...")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # 2. Wait for initial title
            print("Waiting for initial screen...")
            page.wait_for_selector("text=Giza.", timeout=10000)

            # 3. Take screenshot of entry screen
            print("Taking screenshot of entry screen...")
            page.screenshot(path="verification_entry.png")

            # 4. Click "Begin Journey"
            print("Clicking Begin Journey...")
            page.get_by_text("Begin Journey").click()

            # 5. Wait for the 5-second cinematic transition
            print("Waiting for cinematic transition (6 seconds)...")
            time.sleep(6)

            # 6. Take screenshot of main experience
            print("Taking screenshot of main experience...")
            page.screenshot(path="verification_main.png")

            print("Verification script completed successfully.")
        except Exception as e:
            print(f"Error during verification: {e}")
            # Take error screenshot just in case
            page.screenshot(path="verification_error.png")
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    # Give the dev server a moment to start
    time.sleep(5)
    verify_frontend()
