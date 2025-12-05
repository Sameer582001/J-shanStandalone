import fetch from 'node-fetch';

async function verify() {
    try {
        // 1. Register
        console.log('Testing Registration...');
        const registerRes = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile: '1234567890',
                password: 'password123',
                sponsorCode: 'JSE-ROOT'
            })
        });
        const registerData = await registerRes.json();
        console.log('Register Response:', registerRes.status, registerData);

        if (registerRes.status !== 201) {
            console.error('Registration failed');
            return;
        }

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile: '1234567890',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Response:', loginRes.status, loginData);

    } catch (err) {
        console.error('Verification failed:', err);
    }
}

verify();
