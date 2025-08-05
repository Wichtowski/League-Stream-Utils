#!/usr/bin/env node

const crypto = require("crypto");

/**
 * Generate a cryptographically secure JWT secret
 * This secret will meet all the validation requirements:
 * - At least 32 characters long
 * - Contains uppercase, lowercase, numbers, and special characters
 * - High entropy (unique characters)
 * - No predictable patterns
 */
function generateSecureJWTSecret() {
  // Define character sets
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Ensure we have at least one character from each required set
  let secret = "";
  secret += uppercase[crypto.randomInt(uppercase.length)];
  secret += lowercase[crypto.randomInt(lowercase.length)];
  secret += numbers[crypto.randomInt(numbers.length)];
  secret += specialChars[crypto.randomInt(specialChars.length)];

  // Fill the rest with random characters from all sets
  const allChars = uppercase + lowercase + numbers + specialChars;
  const targetLength = 64; // Generate a 64-character secret for extra security

  for (let i = secret.length; i < targetLength; i++) {
    secret += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the secret to avoid predictable patterns at the beginning
  const secretArray = secret.split("");
  for (let i = secretArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [secretArray[i], secretArray[j]] = [secretArray[j], secretArray[i]];
  }

  return secretArray.join("");
}

// Generate and display the secret
const jwtSecret = generateSecureJWTSecret();

console.log("🔐 Generated Cryptographically Secure JWT Secret:");
console.log("");
console.log(jwtSecret);
console.log("");
console.log("📋 Add this to your .env file:");
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log("");
console.log("✅ This secret meets all security requirements:");
console.log("   - 64 characters long (exceeds 32 minimum)");
console.log(
  "   - Contains uppercase, lowercase, numbers, and special characters",
);
console.log("   - High entropy and no predictable patterns");
console.log("   - Cryptographically secure random generation");
