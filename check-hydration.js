#!/usr/bin/env node

const axios = require('axios');

async function checkHydration() {
  console.log('🔍 Checking for hydration issues...\n');
  
  try {
    // 1. Get the login page
    const response = await axios.get('http://localhost:3000/login');
    const html = response.data;
    
    // 2. Check for React hydration markers
    const hasReactRoot = html.includes('__next');
    const hasLoadingState = html.includes('Loading') || html.includes('spinner');
    const hasStyles = html.includes('bg-gray-50') && html.includes('rounded-lg');
    
    console.log('Page Analysis:');
    console.log(`- React root found: ${hasReactRoot ? '✅' : '❌'}`);
    console.log(`- Loading state: ${hasLoadingState ? '✅' : '❌'}`);
    console.log(`- Tailwind styles: ${hasStyles ? '✅' : '❌'}`);
    
    // 3. Quick login test
    console.log('\nTesting authentication...');
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (loginRes.data.success) {
      console.log('✅ Login API working');
      console.log(`✅ Token generated: ${loginRes.data.data.tokens.accessToken.substring(0, 20)}...`);
    }
    
    console.log('\n✨ Hydration Fix Summary:');
    console.log('1. ClientOnly wrapper prevents server/client mismatch');
    console.log('2. Loading spinner shows during hydration');
    console.log('3. Auth state initializes after client mount');
    console.log('4. Cookies persist authentication across refreshes');
    
    console.log('\n🎯 To verify in browser:');
    console.log('1. Open http://localhost:3000/login');
    console.log('2. Open DevTools Console (F12)');
    console.log('3. Look for any hydration errors in red');
    console.log('4. Login and verify you stay logged in');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkHydration();