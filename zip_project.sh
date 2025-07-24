#!/bin/bash

# Set your desired output zip filename
ZIP_NAME="gain-english.zip"

# Run from the root of your project
echo "Zipping project into $ZIP_NAME..."

zip -r $ZIP_NAME . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".gitignore" \
  -x "*.log" \
  -x ".env" \
  -x ".env.*" \
  -x "dist/*" \
  -x "build/*" \
  -x "coverage/*" \
  -x "docs/*" \
  -x "*.DS_Store" \
  -x "*.lock" \
  -x "*.zip"

echo "✅ Done. Created: $ZIP_NAME"
