from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting Playwright verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:3000 (timeout 60s)...")
            page.goto("http://localhost:3000", timeout=60000)

            # 1. Wait for "Begin Journey"
            print("Waiting for 'Begin Journey' button...")
            page.wait_for_selector("text=Begin Journey", timeout=20000)

            # Take screenshot of landing page
            print("Taking screenshot of Landing Page...")
            page.screenshot(path="verification/landing_page.png")

            # 2. Click "Begin Journey"
            print("Clicking 'Begin Journey'...")
            page.click("text=Begin Journey")

            # 3. Wait for Progressive Disclosure (UI elements fade in with delays: 1s, 2s, 3s)
            print("Waiting 6 seconds for progressive disclosure animations...")
            time.sleep(6)

            # Take screenshot of experience UI
            print("Taking screenshot of Experience UI...")
            page.screenshot(path="verification/experience_ui.png")

            # 4. Verify text presence (even if visually rendered via WebGL, the overlay is HTML)
            content = page.content()

            if "Location" in content:
                print("SUCCESS: 'Location' found.")
            else:
                print("FAILURE: 'Location' NOT found.")

            if "The Great Pyramid" in content:
                print("SUCCESS: 'The Great Pyramid' found.")
            else:
                print("FAILURE: 'The Great Pyramid' NOT found.")

        except Exception as e:
            print(f"ERROR: {e}")
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()
            print("Browser closed.")

if __name__ == "__main__":
    run()
