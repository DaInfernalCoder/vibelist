#!/bin/bash

# Change to the test directory
cd "$(dirname "$0")"

# Check if we need to install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing test dependencies..."
  npm install
fi

# Check if TEST_USER_ID is set
if [ -z "$TEST_USER_ID" ]; then
  echo "ERROR: TEST_USER_ID environment variable not set"
  echo "Please set TEST_USER_ID to a valid user ID in your database"
  echo "Example: export TEST_USER_ID=your-user-id"
  exit 1
fi

# Run the database test first
echo "Running customization database test..."
node waitlist/customization.test.js

# Get the waitlist slug from the output
WAITLIST_SLUG=$(grep -o "test-customization-[0-9]*" waitlist/customization.test.js.log 2>/dev/null | tail -1)

if [ -z "$WAITLIST_SLUG" ]; then
  echo "Could not find a waitlist slug from previous test. Using default."
  # Default to a known slug if can't extract
  WAITLIST_SLUG="test-customization"
fi

echo "Using waitlist slug: $WAITLIST_SLUG"

# Run the visual test with the slug
echo "Running visual test..."
node waitlist/visual-test.js "$WAITLIST_SLUG"

echo "All tests completed" 