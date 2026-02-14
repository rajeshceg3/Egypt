from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to localhost:3000...")
            page.goto("http://localhost:3000")

            # Wait for the "Giza" text
            print("Waiting for Giza title...")
            page.wait_for_selector("text=Giza")

            # Take screenshot of landing
            print("Taking landing screenshot...")
            page.screenshot(path="verification/landing.png")

            # Click "Begin Journey"
            print("Clicking Begin Journey...")
            page.click("text=Begin Journey")

            # Wait for overlay to fade (transition duration is 2s)
            print("Waiting for transition...")
            time.sleep(3)

            # Take screenshot of experience
            print("Taking experience screenshot...")
            page.screenshot(path="verification/experience.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
