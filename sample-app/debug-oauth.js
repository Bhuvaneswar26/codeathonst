// Debug script to help diagnose OAuth issues
const { UnifiedOAuth } = require('studenttribe-oauth-lib');
require('dotenv').config();

console.log('🔍 OAuth Debug Tool\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
];

let missingVars = [];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('your-')) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: Not set or using placeholder`);
  } else {
    console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
  }
});

if (missingVars.length > 0) {
  console.log('\n⚠️  Missing or invalid environment variables!');
  console.log('Please check your .env file and ensure all OAuth credentials are properly set.');
  console.log('\nExample .env file:');
  console.log('GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com');
  console.log('GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz');
  console.log('GITHUB_CLIENT_ID=abcdef1234567890');
  console.log('GITHUB_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12');
  process.exit(1);
}

// Test OAuth configuration
console.log('\n🧪 Testing OAuth Configuration:');

try {
  const oauth = new UnifiedOAuth({
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      scopes: ['openid', 'profile', 'email']
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3001/auth/github/callback',
      scopes: ['read:user', 'user:email']
    }
  });

  console.log('✅ OAuth instance created successfully');

  // Test auth URL generation
  const providers = ['google', 'github'];
  providers.forEach(provider => {
    try {
      if (oauth.isProviderConfigured(provider)) {
        const providerAuth = oauth.getProvider(provider);
        const authUrl = providerAuth.getAuthUrl('test-state-123');
        console.log(`✅ ${provider} auth URL generated successfully`);
        console.log(`   URL: ${authUrl.substring(0, 80)}...`);

        // Validate URL format
        const url = new URL(authUrl);
        const requiredParams = ['client_id', 'response_type', 'redirect_uri', 'state'];
        const missingParams = requiredParams.filter(param => !url.searchParams.has(param));

        if (missingParams.length > 0) {
          console.log(`❌ ${provider} auth URL missing parameters: ${missingParams.join(', ')}`);
        } else {
          console.log(`✅ ${provider} auth URL has all required parameters`);
        }
      } else {
        console.log(`❌ ${provider} provider not configured`);
      }
    } catch (error) {
      console.log(`❌ ${provider} error: ${error.message}`);
    }
  });

} catch (error) {
  console.log(`❌ OAuth configuration error: ${error.message}`);
}

console.log('\n🔧 Common 400 Error Solutions:');
console.log('1. Check that your OAuth app is properly configured with the provider');
console.log('2. Ensure redirect URI matches exactly (including http vs https)');
console.log('3. Verify client ID and secret are correct');
console.log('4. Make sure the OAuth app is not in development mode (if applicable)');
console.log('5. Check that required scopes are enabled in your OAuth app');

console.log('\n📝 Next Steps:');
console.log('1. Fix any issues above');
console.log('2. Restart the server: npm start');
console.log('3. Try the OAuth flow again');
