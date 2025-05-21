/**
 * Test script for verifying the waitlist publishing functionality
 *
 * This script demonstrates the correct data structure for publishing a waitlist
 * It can be run with Node.js to test the API directly or used as a reference
 *
 * Usage:
 * 1. Update the AUTH_TOKEN with a valid authentication token
 * 2. Run: node scripts/test-publish-waitlist.js
 */

// Imports
const fetch = require("node-fetch");

// Configuration
const API_URL = "http://localhost:3000/api/waitlists/publish";
const AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"; // Replace with a valid token

// Example template data (simulating what would come from the frontend)
const templateData = {
  id: "550e8400-e29b-41d4-a716-446655440000", // Example UUID
  name: "Product Launch Template",
  description: "A template for product launches",
  // Other template properties
  theme_color: "#4f46e5",
  secondary_color: "#9333ea",
  background_color: "#ffffff",
  text_color: "#111827",
  logo_url: "",
  show_social_proof: true,
  show_referral: false,
};

// Correct data structure for the API
const correctPayload = {
  name: "Test Waitlist",
  description: "A test waitlist created by the test script",
  templateId: templateData.id,
  customizationData: {
    theme_color: templateData.theme_color,
    secondary_color: templateData.secondary_color,
    background_color: templateData.background_color,
    text_color: templateData.text_color,
    logo_url: templateData.logo_url,
    show_social_proof: templateData.show_social_proof,
    show_referral: templateData.show_referral,
  },
};

// Incorrect data structure (for comparison)
const incorrectPayload = {
  name: "Test Waitlist",
  description: "A test waitlist created by the test script",
  customizationData: templateData, // Sending the entire template object as customizationData
};

/**
 * Test the publish waitlist API with the correct data structure
 */
async function testPublishWaitlist() {
  try {
    console.log(
      "Testing waitlist publishing with correct payload structure..."
    );
    console.log("Payload:", JSON.stringify(correctPayload, null, 2));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(correctPayload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("SUCCESS! Waitlist published successfully");
      console.log("Response:", JSON.stringify(data, null, 2));
    } else {
      console.error("ERROR! Failed to publish waitlist");
      console.error("Status:", response.status);
      console.error("Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Exception during test:", error);
  }
}

// Run the test
if (require.main === module) {
  testPublishWaitlist();
}

module.exports = {
  testPublishWaitlist,
  correctPayload,
  incorrectPayload,
};
