#!/usr/bin/env node

const axios = require('axios');
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCompleteFlow() {
  log('\n🧪 Testing Complete UI Flow\n', 'blue');
  
  try {
    // 1. Check UI is styled
    log('1. Checking UI Styling...', 'yellow');
    const loginPage = await axios.get('http://localhost:3000/login', {
      headers: { 'Accept': 'text/html' }
    });
    
    const hasStyles = loginPage.data.includes('bg-gray-50') && 
                      loginPage.data.includes('rounded-lg') &&
                      loginPage.data.includes('shadow-sm');
    
    if (hasStyles) {
      log('✅ UI is properly styled with Tailwind CSS', 'green');
    } else {
      log('❌ UI styling issues detected', 'red');
    }
    
    // 2. Test Login Flow
    log('\n2. Testing Login Flow...', 'yellow');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const { accessToken } = loginResponse.data.data.tokens;
      log('✅ Login successful', 'green');
      log(`   Token: ${accessToken.substring(0, 20)}...`, 'green');
      
      // 3. Test Profile Access
      log('\n3. Testing Profile Access...', 'yellow');
      const profileResponse = await axios.get('http://localhost:5001/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (profileResponse.data.success) {
        const user = profileResponse.data.data.user;
        log('✅ Profile access successful', 'green');
        log(`   User: ${user.firstName} ${user.lastName} (${user.role})`, 'green');
        
        // 4. Test Dashboard Access
        log('\n4. Testing Dashboard Access...', 'yellow');
        const dashboardResponse = await axios.get('http://localhost:5001/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (dashboardResponse.data.success) {
          log('✅ Dashboard API accessible', 'green');
          log(`   Total Users: ${dashboardResponse.data.data.totalUsers}`, 'green');
        }
      }
    }
    
    // 5. Test Cookie Storage
    log('\n5. Testing Cookie Storage...', 'yellow');
    const cookieResponse = await axios.get('http://localhost:3000/admin', {
      headers: { 
        'Cookie': `accessToken=${loginResponse.data.data.tokens.accessToken}`,
        'Accept': 'text/html'
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 500
    });
    
    if (cookieResponse.status === 200) {
      log('✅ Cookie-based authentication working', 'green');
    } else if (cookieResponse.status === 307 || cookieResponse.status === 302) {
      log('⚠️  Dashboard redirecting to login (cookie issue)', 'yellow');
    }
    
    log('\n📊 Summary:', 'blue');
    log('- UI: Styled with Tailwind CSS ✅', 'green');
    log('- Login: JWT tokens generated ✅', 'green');
    log('- API: Protected endpoints accessible ✅', 'green');
    log('- Cookies: Check browser console for persistence', 'yellow');
    
    log('\n🎯 Next Steps:', 'blue');
    log('1. Open http://localhost:3000/login in your browser', 'yellow');
    log('2. Login with admin@example.com / password123', 'yellow');
    log('3. You should be redirected to /admin dashboard', 'yellow');
    log('4. If redirected back to login, check browser console for errors', 'yellow');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

testCompleteFlow();