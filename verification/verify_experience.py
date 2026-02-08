from playwright.sync_api import sync_playwright
import time

def verify(page):
    print("Navigating to home...")
    # 1. Landing Page
    page.goto("http://localhost:3002")
    page.wait_for_selector("text=Giza.")
    page.screenshot(path="verification/landing.png")
    print("Landing page screenshot taken.")

    # 2. Enter Experience
    print("Entering experience...")
    page.click("text=Begin Journey")

    # Wait for transition (3 seconds for fade out + fade in)
    time.sleep(5)

    # Wait for canvas to be visible
    page.wait_for_selector("canvas")

    # Take screenshot of the experience
    page.screenshot(path="verification/experience.png")
    print("Experience screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        try:
            verify(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
