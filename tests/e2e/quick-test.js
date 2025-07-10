#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function quickTest() {
  try {
    // Login as sales user
    console.log('🔐 Logging in as Sales user...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'sales@example.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data.tokens;
    console.log('✅ Login successful');
    
    // Try to access admin endpoint (should fail)
    console.log('\n🚫 Testing unauthorized access to admin endpoint...');
    try {
      await axios.get(`${API_URL}/admin/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      console.log('❌ ERROR: Sales user could access admin endpoint!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly denied access (403 Forbidden)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    // Try to access sales endpoint (should succeed)
    console.log('\n✅ Testing authorized access to sales endpoint...');
    try {
      const response = await axios.get(`${API_URL}/sales/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      console.log('✅ Successfully accessed sales dashboard:', response.status);
    } catch (error) {
      console.log('❌ ERROR: Could not access sales endpoint:', error.response?.status);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

quickTest();