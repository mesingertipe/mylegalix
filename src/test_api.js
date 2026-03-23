const http = require('http');

const data = JSON.stringify({
  email: 'admin@legalix.com',
  password: 'Legalix2024*'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const authData = JSON.parse(body);
    const token = authData.token;
    const tenantId = authData.companyId;

    if (!token) {
        console.error("Login failed", body);
        return;
    }

    // 1. Check current settings
    checkSettings(token, tenantId, (currentSettings) => {
        console.log("Current Settings:", currentSettings);
        
        // 2. Patch settings
        patchSettings(token, tenantId, () => {
             // 3. Check settings again
             checkSettings(token, tenantId, (newSettings) => {
                 console.log("New Settings after PATCH:", newSettings);
             });
        });
    });
  });
});

req.write(data);
req.end();

function checkSettings(token, tenantId, callback) {
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/companies/settings',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'X-Tenant-Id': tenantId
        }
    };
    http.get(options, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => callback(JSON.parse(body)));
    });
}

function patchSettings(token, tenantId, callback) {
    const patchData = JSON.stringify({
        language: 'en-US',
        currencyCode: 'USD',
        dailyExpenseLimit: 5000
    });
    
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/companies/settings',
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + token,
            'X-Tenant-Id': tenantId,
            'Content-Type': 'application/json',
            'Content-Length': patchData.length
        }
    };
    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log("Patch response:", body);
            callback();
        });
    });
    req.write(patchData);
    req.end();
}
