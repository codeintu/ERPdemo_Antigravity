import fs from 'fs';
import path from 'path';
import https from 'https';

// Simple .env parser
const env = {};
try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
} catch (e) {
    console.error("Could not read .env file");
    process.exit(1);
}

const FM_HOST = env['VITE_FM_HOST'];
const FM_DB = env['VITE_FM_DATABASE'];
const FM_USER = env['VITE_FM_USER'];
const FM_PWD = env['VITE_FM_PASSWORD'];

console.log(`Testing connection to: ${FM_HOST}`);
console.log(`Database: ${FM_DB}`);
console.log(`User: ${FM_USER}`);

if (!FM_HOST) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const auth = Buffer.from(`${FM_USER}:${FM_PWD}`).toString('base64');
const options = {
    hostname: FM_HOST,
    port: 443,
    path: `/fmi/data/vLatest/databases/${FM_DB}/sessions`,
    method: 'POST',
    headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    },
    rejectUnauthorized: false // Allow self-signed certs for testing
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:');
        console.log(data);
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});

req.end('{}');
