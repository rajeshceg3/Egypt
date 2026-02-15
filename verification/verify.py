from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--use-gl=swiftshader"])
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        try:
            print("Navigating...")
            page.goto("http://localhost:3000", timeout=60000)

            print("Clicking Start...")
            page.get_by_role("button", name="Begin Journey").click()

            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=30000)

            print("Waiting for scene...")
            time.sleep(10)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
