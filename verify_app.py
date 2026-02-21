import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--use-gl=swiftshader'])
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000", timeout=60000)
            print("Page loaded.")

            # Click Begin Journey
            print("Clicking 'BEGIN JOURNEY'...")
            page.get_by_text("BEGIN JOURNEY").click()

            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=30000)

            # Wait a bit for rendering
            time.sleep(5)

            print("Taking screenshot...")
            page.screenshot(path="verification.png")
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="error.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    run()
