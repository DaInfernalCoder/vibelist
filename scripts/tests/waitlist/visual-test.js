// Visual test for waitlist customization using Puppeteer
const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables from .env
dotenv.config();

// Also load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Waitlist slug to test (you can pass this as an argument or hardcode for testing)
// This should be a waitlist that exists and has customization settings
const waitlistSlug = process.argv[2] || "test-customization"; // Replace with your test waitlist slug

// Base URL
const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
const waitlistUrl = `${baseUrl}/waitlist/${waitlistSlug}`;

async function runVisualTest() {
  console.log(`Running visual test for: ${waitlistUrl}`);

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: "new", // Use new headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // Create a new page
    const page = await browser.newPage();

    // Navigate to the waitlist page
    console.log(`Navigating to ${waitlistUrl}`);
    await page.goto(waitlistUrl, { waitUntil: "networkidle2" });

    // Wait for the page to fully render
    await page.waitForSelector(".waitlist-card", { timeout: 10000 });
    console.log("✅ Page loaded successfully");

    // Check if custom styles are applied (CSS variables)
    console.log("Checking if CSS custom properties are applied...");

    // Take a screenshot for visual verification
    const screenshotPath = path.join(__dirname, "waitlist-screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Screenshot saved to: ${screenshotPath}`);

    // Extract CSS variables from the page
    const cssVariables = await page.evaluate(() => {
      const computedStyle = getComputedStyle(document.documentElement);
      return {
        themeColor: computedStyle
          .getPropertyValue("--waitlist-theme-color")
          .trim(),
        backgroundColor: computedStyle
          .getPropertyValue("--waitlist-background-color")
          .trim(),
        textColor: computedStyle
          .getPropertyValue("--waitlist-text-color")
          .trim(),
        buttonBorderRadius: computedStyle
          .getPropertyValue("--waitlist-button-border-radius")
          .trim(),
        cardBackgroundColor: computedStyle
          .getPropertyValue("--waitlist-card-background-color")
          .trim(),
      };
    });

    console.log("CSS variables found:", cssVariables);

    // Check button styling
    const buttonStyle = await page.evaluate(() => {
      const button = document.querySelector(".waitlist-button");
      if (!button) return null;

      const computedStyle = getComputedStyle(button);
      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        borderRadius: computedStyle.borderRadius,
      };
    });

    if (buttonStyle) {
      console.log("Button styles:", buttonStyle);
    } else {
      console.log("⚠️ Button not found or not styled");
    }

    // Check input styling
    const inputStyle = await page.evaluate(() => {
      const input = document.querySelector(".waitlist-input");
      if (!input) return null;

      const computedStyle = getComputedStyle(input);
      return {
        backgroundColor: computedStyle.backgroundColor,
        borderColor: computedStyle.borderColor,
        borderRadius: computedStyle.borderRadius,
      };
    });

    if (inputStyle) {
      console.log("Input styles:", inputStyle);
    } else {
      console.log("⚠️ Input not found or not styled");
    }

    // Check if custom text content is applied
    const textContent = await page.evaluate(() => {
      const title = document.querySelector(".waitlist-card .card-title");
      const description = document.querySelector(
        ".waitlist-card .card-description"
      );
      const button = document.querySelector(".waitlist-button");

      return {
        title: title ? title.textContent.trim() : null,
        description: description ? description.textContent.trim() : null,
        buttonText: button ? button.textContent.trim() : null,
      };
    });

    console.log("Text content:", textContent);

    console.log("\n✅ Visual test completed successfully");
    console.log(
      `Check the screenshot at ${screenshotPath} to visually confirm styling`
    );
  } catch (error) {
    console.error("Error running visual test:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runVisualTest();
