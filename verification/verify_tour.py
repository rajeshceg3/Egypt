from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3002")

    # Wait for the "Begin Journey" button and click it
    page.wait_for_selector("text=Begin Journey")
    page.click("text=Begin Journey")

    # Wait for the progressive disclosure animations
    # The longest delay is 2s, plus 1s duration, plus 3s fade in of the parent.
    # Parent fade in starts immediately. Text starts 1s, 1.5s, 2s after parent.
    # Total time needed: ~3-4 seconds.
    page.wait_for_timeout(5000)

    # Check if elements are visible
    location = page.is_visible("text=Location")
    vibe = page.is_visible("text=Vibe")
    title = page.is_visible("text=The Great Pyramid")

    print(f"Location visible: {location}")
    print(f"Vibe visible: {vibe}")
    print(f"Title visible: {title}")

    page.screenshot(path="verification/tour_complete.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
