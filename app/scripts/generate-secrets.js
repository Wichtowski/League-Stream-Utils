const crypto = require('crypto');

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateSecurePassword(length = 16) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

console.log('🔐 Secure Configuration Generator');
console.log('================================');
console.log('');
console.log('Add these to your .env.local file:');
console.log('');
console.log(`JWT_SECRET=${generateSecureSecret()}`);
console.log(`ADMIN_USERNAME=admin`);
console.log(`ADMIN_PASSWORD=${generateSecurePassword(16)}`);
console.log(`ADMIN_EMAIL=admin@yourdomain.com`);
console.log('');
console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('- Save these values securely - they cannot be recovered if lost');
console.log('- Use different secrets for development and production');
console.log('- Never commit these values to version control');
console.log('- Change the admin password after first login');
console.log('');
console.log('🚀 Next steps:');
console.log('1. Copy the values above to your .env.local file');
console.log('2. Set MONGODB_URI to your database connection string');
console.log('3. Run "node scripts/create-admin.js" to create the admin user');
console.log('4. Start the application with "npm run dev"'); 