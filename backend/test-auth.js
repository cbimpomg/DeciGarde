const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let adminToken = '';
let teacherToken = '';

async function testAuth() {
  console.log('🧪 Testing DeciGrade Authentication System\n');

  try {
    // 1. Test Admin Registration
    console.log('1️⃣ Testing Admin Registration...');
    const adminResponse = await axios.post(`${API_BASE}/users/register`, {
      email: 'admin@decigrade.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    console.log('✅ Admin registered:', adminResponse.data.user.email);
    adminToken = adminResponse.data.token;

    // 2. Test Teacher Registration
    console.log('\n2️⃣ Testing Teacher Registration...');
    const teacherResponse = await axios.post(`${API_BASE}/users/register`, {
      email: 'math.teacher@school.com',
      password: 'teacher123',
      firstName: 'John',
      lastName: 'Smith',
      role: 'teacher',
      subjects: ['mathematics', 'physics'],
      department: 'Science'
    });
    console.log('✅ Teacher registered:', teacherResponse.data.user.email);
    teacherToken = teacherResponse.data.token;

    // 3. Test Login
    console.log('\n3️⃣ Testing Login...');
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      email: 'math.teacher@school.com',
      password: 'teacher123'
    });
    console.log('✅ Login successful:', loginResponse.data.user.email);

    // 4. Test Protected Routes
    console.log('\n4️⃣ Testing Protected Routes...');
    
    // Test teacher profile access
    const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Profile access successful:', profileResponse.data.user.email);
    console.log('   Subjects:', profileResponse.data.user.subjects);
    console.log('   Stats:', profileResponse.data.stats);

    // 5. Test Role-Based Access
    console.log('\n5️⃣ Testing Role-Based Access...');
    
    // Teacher should be able to access their own profile
    try {
      await axios.get(`${API_BASE}/users/profile`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      console.log('✅ Teacher can access their profile');
    } catch (error) {
      console.log('❌ Teacher profile access failed:', error.response?.data?.error);
    }

    // 6. Test Invalid Token
    console.log('\n6️⃣ Testing Invalid Token...');
    try {
      await axios.get(`${API_BASE}/users/profile`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Invalid token should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token correctly rejected');
      } else {
        console.log('❌ Unexpected error with invalid token:', error.response?.data);
      }
    }

    console.log('\n🎉 Authentication system test completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Use these tokens in your frontend');
    console.log('2. Test with real user registration forms');
    console.log('3. Implement logout (just remove token from storage)');
    console.log('4. Add password reset functionality if needed');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log('\n💡 Users already exist. Try logging in instead:');
      console.log('curl -X POST http://localhost:5000/api/users/login \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"email": "admin@decigrade.com", "password": "admin123"}\'');
    }
  }
}

// Run the test
testAuth();
