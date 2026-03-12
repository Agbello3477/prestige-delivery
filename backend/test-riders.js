const http = require('http');

const loginData = JSON.stringify({ email: 'admin@prestige.com', password: 'admin123' });

const loginReq = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (loginRes) => {
  let loginBody = '';
  loginRes.on('data', d => loginBody += d);
  loginRes.on('end', () => {
    const data = JSON.parse(loginBody);
    if (!data.token) {
      console.log('Login failed', data);
      return;
    }
    const token = data.token;
    const ridersReq = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/users/riders',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (ridersRes) => {
      let rBody = '';
      ridersRes.on('data', chunk => rBody += chunk);
      ridersRes.on('end', () => {
        console.log(rBody);
      });
    });
    ridersReq.end();
  });
});

loginReq.write(loginData);
loginReq.end();
