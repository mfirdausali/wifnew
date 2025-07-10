#!/usr/bin/env node

const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:5001/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test users
const testUsers = [
  { email: 'admin@example.com', password: 'password123', role: 'ADMIN', expectedDashboard: '/admin' },
  { email: 'sales@example.com', password: 'password123', role: 'SALES', expectedDashboard: '/sales' },
  { email: 'finance@example.com', password: 'password123', role: 'FINANCE', expectedDashboard: '/finance' },
  { email: 'operations@example.com', password: 'password123', role: 'OPERATIONS', expectedDashboard: '/operations' }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testLogin(user) {
  try {
    log(`\nTesting login for ${user.role} user...`, 'yellow');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });

    assert(response.status === 200, 'Login should return 200');
    assert(response.data.success === true, 'Login should be successful');
    assert(response.data.data.user.email === user.email, 'User email should match');
    assert(response.data.data.user.role === user.role, 'User role should match');
    assert(response.data.data.tokens?.accessToken, 'Should receive access token');
    assert(response.data.data.tokens?.refreshToken, 'Should receive refresh token');
    
    log(`✓ Login successful for ${user.role}`, 'green');
    return {
      user: response.data.data.user,
      accessToken: response.data.data.tokens.accessToken,
      refreshToken: response.data.data.tokens.refreshToken
    };
  } catch (error) {
    log(`✗ Login failed for ${user.role}: ${error.message}`, 'red');
    throw error;
  }
}

async function testProfile(accessToken, expectedRole) {
  try {
    log(`Testing profile access...`, 'yellow');
    
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    assert(response.status === 200, 'Profile should return 200');
    assert(response.data.data.user.role === expectedRole, 'Profile role should match');
    
    log(`✓ Profile access successful`, 'green');
    return response.data.data.user;
  } catch (error) {
    log(`✗ Profile access failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testRoleBasedAccess(accessToken, userRole) {
  try {
    log(`Testing role-based access for ${userRole}...`, 'yellow');
    
    const endpoints = [
      { path: '/admin/dashboard/stats', allowedRoles: ['ADMIN'] },
      { path: '/sales/dashboard/stats', allowedRoles: ['SALES', 'ADMIN'] },
      { path: '/finance/dashboard/stats', allowedRoles: ['FINANCE', 'ADMIN'] },
      { path: '/operations/dashboard/stats', allowedRoles: ['OPERATIONS', 'ADMIN'] }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_URL}${endpoint.path}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (endpoint.allowedRoles.includes(userRole)) {
          assert(response.status === 200, `${userRole} should access ${endpoint.path}`);
          log(`  ✓ Can access ${endpoint.path}`, 'green');
        } else {
          assert.fail(`${userRole} should not access ${endpoint.path}`);
        }
      } catch (error) {
        if (endpoint.allowedRoles.includes(userRole)) {
          log(`  ✗ Cannot access ${endpoint.path} (should be allowed)`, 'red');
          throw error;
        } else {
          assert(error.response?.status === 401 || error.response?.status === 403, `Should get 401 or 403 for unauthorized access`);
          log(`  ✓ Correctly denied access to ${endpoint.path}`, 'green');
        }
      }
    }
  } catch (error) {
    log(`✗ Role-based access test failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testRefreshToken(refreshToken) {
  try {
    log(`Testing token refresh...`, 'yellow');
    
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });

    assert(response.status === 200, 'Refresh should return 200');
    assert(response.data.data.tokens?.accessToken, 'Should receive new access token');
    assert(response.data.data.tokens?.refreshToken, 'Should receive new refresh token');
    
    log(`✓ Token refresh successful`, 'green');
    return {
      accessToken: response.data.data.tokens.accessToken,
      refreshToken: response.data.data.tokens.refreshToken
    };
  } catch (error) {
    log(`✗ Token refresh failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testLogout(accessToken) {
  try {
    log(`Testing logout...`, 'yellow');
    
    const response = await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    assert(response.status === 200, 'Logout should return 200');
    
    log(`✓ Logout successful`, 'green');
  } catch (error) {
    log(`✗ Logout failed: ${error.message}`, 'red');
    throw error;
  }
}

async function runTests() {
  log('\n🧪 Starting E2E Authentication Tests\n', 'yellow');
  
  let totalTests = 0;
  let passedTests = 0;

  for (const user of testUsers) {
    try {
      // Test login
      totalTests++;
      const loginData = await testLogin(user);
      passedTests++;

      // Test profile access
      totalTests++;
      await testProfile(loginData.accessToken, user.role);
      passedTests++;

      // Test role-based access
      totalTests++;
      await testRoleBasedAccess(loginData.accessToken, user.role);
      passedTests++;

      // Test token refresh
      totalTests++;
      const refreshData = await testRefreshToken(loginData.refreshToken);
      passedTests++;

      // Test logout
      totalTests++;
      await testLogout(refreshData.accessToken);
      passedTests++;

    } catch (error) {
      log(`\nTest suite failed for ${user.role}: ${error.message}`, 'red');
    }
  }

  // Summary
  log(`\n📊 Test Summary`, 'yellow');
  log(`Total tests: ${totalTests}`, 'yellow');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  
  if (passedTests === totalTests) {
    log(`\n✅ All tests passed!`, 'green');
    process.exit(0);
  } else {
    log(`\n❌ Some tests failed!`, 'red');
    process.exit(1);
  }
}

// Check if services are running
async function checkServices() {
  log('Checking services...', 'yellow');
  
  try {
    await axios.get(`${API_URL}/health`);
    log('✓ Backend API is running', 'green');
  } catch (error) {
    log('✗ Backend API is not running on port 5001', 'red');
    process.exit(1);
  }

  try {
    await axios.get(FRONTEND_URL);
    log('✓ Frontend is running', 'green');
  } catch (error) {
    log('✗ Frontend is not running on port 3000', 'red');
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    await checkServices();
    await runTests();
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();