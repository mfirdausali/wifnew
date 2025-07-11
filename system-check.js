#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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

async function checkService(name, url, expectedStatus = 200) {
  try {
    const response = await axios.get(url, { 
      validateStatus: () => true,
      timeout: 5000 
    });
    
    if (response.status === expectedStatus) {
      log(`✓ ${name} is running at ${url}`, 'green');
      return true;
    } else {
      log(`✗ ${name} returned unexpected status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ ${name} is not accessible: ${error.message}`, 'red');
    return false;
  }
}

async function checkProcess(name, command) {
  try {
    const { stdout } = await execPromise(command);
    if (stdout.trim()) {
      log(`✓ ${name} process is running`, 'green');
      return true;
    } else {
      log(`✗ ${name} process is not running`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ ${name} process check failed`, 'red');
    return false;
  }
}

async function checkDatabase() {
  try {
    const response = await axios.get('http://localhost:5001/api/health');
    if (response.data.database) {
      log('✓ Database connection is healthy', 'green');
      return true;
    } else {
      log('✗ Database connection failed', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Cannot check database status', 'red');
    return false;
  }
}

async function checkUIComponents() {
  const pages = [
    { name: 'Login Page', url: 'http://localhost:3000/login' },
    { name: 'Register Page', url: 'http://localhost:3000/register' },
    { name: 'Admin Dashboard', url: 'http://localhost:3000/admin', needsAuth: true },
    { name: 'Sales Dashboard', url: 'http://localhost:3000/sales', needsAuth: true },
    { name: 'Finance Dashboard', url: 'http://localhost:3000/finance', needsAuth: true },
    { name: 'Operations Dashboard', url: 'http://localhost:3000/operations', needsAuth: true }
  ];

  log('\nChecking UI Components:', 'blue');
  
  for (const page of pages) {
    try {
      const response = await axios.get(page.url, { 
        validateStatus: () => true,
        maxRedirects: 0 
      });
      
      if (page.needsAuth && response.status === 307) {
        log(`✓ ${page.name} - Protected route (redirects to login)`, 'green');
      } else if (!page.needsAuth && response.status === 200) {
        log(`✓ ${page.name} - Accessible`, 'green');
      } else {
        log(`⚠ ${page.name} - Status: ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`✗ ${page.name} - Error: ${error.message}`, 'red');
    }
  }
}

async function testAuthFlow() {
  log('\nTesting Authentication Flow:', 'blue');
  
  try {
    // Test login
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      log('✓ Login endpoint working', 'green');
      
      const token = loginResponse.data.data.tokens.accessToken;
      
      // Test profile access
      const profileResponse = await axios.get('http://localhost:5001/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (profileResponse.data.success) {
        log('✓ Profile endpoint working', 'green');
        log(`✓ Authenticated as: ${profileResponse.data.data.user.email} (${profileResponse.data.data.user.role})`, 'green');
      }
      
      // Test protected endpoint
      const adminResponse = await axios.get('http://localhost:5001/api/admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (adminResponse.data.success) {
        log('✓ Protected endpoints working', 'green');
      }
      
    }
  } catch (error) {
    log(`✗ Auth flow test failed: ${error.message}`, 'red');
  }
}

async function runSystemCheck() {
  console.clear();
  log('🔍 Multi-Role Auth System - Comprehensive Check\n', 'blue');
  
  let checks = {
    backend: false,
    frontend: false,
    database: false,
    redis: false,
    docker: false,
    auth: false
  };

  // Check 1: Services
  log('Checking Services:', 'blue');
  checks.backend = await checkService('Backend API', 'http://localhost:5001/api/health');
  checks.frontend = await checkService('Frontend', 'http://localhost:3000');
  
  // Check 2: Processes
  log('\nChecking Processes:', 'blue');
  checks.docker = await checkProcess('Docker', 'docker ps | grep -E "(postgres|redis)"');
  
  // Check 3: Database
  log('\nChecking Database:', 'blue');
  checks.database = await checkDatabase();
  
  // Check 4: UI Components
  await checkUIComponents();
  
  // Check 5: Auth Flow
  await testAuthFlow();
  
  // Summary
  log('\n📊 System Check Summary:', 'blue');
  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(v => v).length;
  
  Object.entries(checks).forEach(([name, status]) => {
    log(`${name.toUpperCase()}: ${status ? '✅ PASS' : '❌ FAIL'}`, status ? 'green' : 'red');
  });
  
  log(`\nOverall: ${passedChecks}/${totalChecks} checks passed`, 
    passedChecks === totalChecks ? 'green' : 'yellow');
  
  if (passedChecks === totalChecks) {
    log('\n🎉 System is fully operational and ready for use!', 'green');
    log('\nAccess the system at:', 'blue');
    log('Frontend: http://localhost:3000', 'blue');
    log('Backend API: http://localhost:5001/api', 'blue');
    log('\nTest credentials:', 'blue');
    log('Admin: admin@example.com / password123', 'yellow');
    log('Sales: sales@example.com / password123', 'yellow');
    log('Finance: finance@example.com / password123', 'yellow');
    log('Operations: operations@example.com / password123', 'yellow');
  } else {
    log('\n⚠️  Some checks failed. Please review the output above.', 'red');
  }
}

runSystemCheck();