async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Akshat Test',
        email: 'aki_test@gmail.com',
        password: 'Password@123',
        phone: '123412341212'
      })
    });
    const data = await res.json();
    console.log('Status code:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.log('Error:', err);
  }
}
test();
