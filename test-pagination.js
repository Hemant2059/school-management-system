const BASE_URL = 'http://localhost:3000/api/v1';

async function test() {
  try {
    // 1. Register a new admin user (if not exists, or just try login first)
    const uniqueUser = `testadmin_${Date.now()}`;
    const email = `${uniqueUser}@example.com`;
    console.log(`Registering user ${uniqueUser}...`);
    
    const registerPayload = {
      username: uniqueUser,
      email: email,
      password: 'Password123!',
      fullName: 'Test Admin',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      userType: 'ADMIN'
    };

    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });

    if (registerRes.status === 400) {
      console.log('User might already exist or bad request, proceeding to login...');
    } else if (!registerRes.ok) {
        const text = await registerRes.text();
        console.error('Registration failed:', registerRes.status, text);
        return;
    }

    // 2. Login
    console.log('Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uniqueUser,
        password: 'Password123!',
      })
    });

    if (!loginRes.ok) {
        const text = await loginRes.text();
        console.error('Login failed:', loginRes.status, text);
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log('Got token:', token ? 'Yes' : 'No');
    console.log('User Role:', loginData.user?.userType);

    const headers = { 'Authorization': `Bearer ${token}` };

    // 3. Test Student Pagination
    console.log('\nTesting Student Pagination...');
    const studentsRes = await fetch(`${BASE_URL}/students?schoolId=1&page=1&take=2`, { headers });
    if (studentsRes.ok) {
        const data = await studentsRes.json();
        console.log('Student Page 1 (Take 2):', data.meta ? 'Success' : 'Failed structure');
        if (data.meta) console.log('Meta:', data.meta);
        if (data.data) console.log('Students count:', data.data.length);
    } else {
        console.error('Student pagination failed:', studentsRes.status, await studentsRes.text());
    }

    // 4. Test Teacher Pagination
    console.log('\nTesting Teacher Pagination...');
    const teachersRes = await fetch(`${BASE_URL}/teachers?page=1&take=2`, { headers });
    if (teachersRes.ok) {
        const data = await teachersRes.json();
        console.log('Teacher Page 1 (Take 2):', data.meta ? 'Success' : 'Failed structure');
        if (data.meta) console.log('Meta:', data.meta);
        if (data.data) console.log('Teachers count:', data.data.length);
    } else {
         console.error('Teacher pagination failed:', teachersRes.status, await teachersRes.text());
    }

    // 5. Test User Pagination
    if (loginData.user?.userType === 'ADMIN') {
        console.log('\nTesting User Pagination...');
        const usersRes = await fetch(`${BASE_URL}/users?page=1&take=2`, { headers });
        if (usersRes.ok) {
            const data = await usersRes.json();
            console.log('User Page 1 (Take 2):', data.meta ? 'Success' : 'Failed structure');
            if (data.meta) console.log('Meta:', data.meta);
            if (data.data) console.log('Users count:', data.data.length);
        } else {
             console.error('User pagination failed:', usersRes.status, await usersRes.text());
        }
    } else {
        console.log('\nSkipping User Pagination (Not ADMIN)');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
