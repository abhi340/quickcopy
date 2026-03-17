#!/bin/sh

# This script creates the firebase-config.js from environment variables in Cloudflare
cat <<EOF > firebase-config.js
export const firebaseConfig = {
  apiKey: "${FIREBASE_API_KEY}",
  authDomain: "${FIREBASE_AUTH_DOMAIN}",
  projectId: "${FIREBASE_PROJECT_ID}",
  storageBucket: "${FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${FIREBASE_APP_ID}"
};
EOF

echo "✅ firebase-config.js successfully created for Cloudflare deployment!"
