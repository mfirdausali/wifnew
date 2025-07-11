#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testHydrationFix() {
  console.log('🧪 Testing Hydration Fix...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Test 1: Load login page
    console.log('1. Loading login page...');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle0' 
    });
    
    // Check for hydration errors
    const hydrationErrors = errors.filter(e => 
      e.includes('hydration') || 
      e.includes('Hydration') ||
      e.includes('did not match')
    );
    
    if (hydrationErrors.length === 0) {
      console.log('✅ No hydration errors on login page');
    } else {
      console.log('❌ Hydration errors found:', hydrationErrors);
    }
    
    // Test 2: Check styling
    const hasStyles = await page.evaluate(() => {
      const body = document.body;
      const loginForm = document.querySelector('form');
      return body && loginForm && 
             getComputedStyle(body).backgroundColor !== 'rgba(0, 0, 0, 0)';
    });
    
    if (hasStyles) {
      console.log('✅ Styles are applied correctly');
    } else {
      console.log('❌ Styling issues detected');
    }
    
    // Test 3: Perform login
    console.log('\n2. Testing login flow...');
    await page.type('input[name="email"]', 'admin@example.com');
    await page.type('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Check if we're on the dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/admin')) {
      console.log('✅ Successfully redirected to admin dashboard');
      
      // Wait a bit to see if we get redirected back
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      
      if (finalUrl.includes('/admin')) {
        console.log('✅ Session persisted - no redirect back to login');
      } else {
        console.log('❌ Redirected back to login - session not persisting');
      }
    } else {
      console.log('❌ Login redirect failed');
    }
    
    // Final check for any new errors
    const finalErrors = errors.filter(e => 
      !e.includes('Failed to load resource') &&
      !e.includes('favicon')
    );
    
    console.log('\n📊 Summary:');
    console.log(`- Total console errors: ${finalErrors.length}`);
    console.log(`- Hydration errors: ${hydrationErrors.length}`);
    console.log(`- Login flow: ${currentUrl.includes('/admin') ? 'Working' : 'Failed'}`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run test
testHydrationFix().catch(console.error);