import fs from 'fs';
import path from 'path';
import https from 'https';

// Simple .env parser (reused)
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
const LAYOUT_NAME = 'Web_CMT';

console.log("Config:", { FM_HOST, FM_DB, FM_USER, hasPwd: !!FM_PWD });

if (!FM_HOST) {
    console.error("Missing credentials");
    process.exit(1);
}

const auth = Buffer.from(`${FM_USER}:${FM_PWD}`).toString('base64');
const agent = new https.Agent({ rejectUnauthorized: false });

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: FM_HOST,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            agent: agent
        };

        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        else options.headers['Authorization'] = `Basic ${auth}`;

        console.log(`REQ: ${method} ${path}`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                console.log(`RES: ${res.statusCode}`);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        console.error("Failed to parse JSON", data);
                        reject(e);
                    }
                } else {
                    reject({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => {
            console.error("Network Error:", e);
            reject(e);
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        console.log("Getting token...");
        const sessionRes = await request('POST', `/fmi/data/vLatest/databases/${FM_DB}/sessions`, {});
        const token = sessionRes.response.token;
        console.log("Token received.");

        console.log(`Fetching records from layout: ${LAYOUT_NAME}...`);
        const recordsRes = await request('GET', `/fmi/data/vLatest/databases/${FM_DB}/layouts/${LAYOUT_NAME}/records`, null, token);

        console.log("Response received.");
        if (!recordsRes.response || !recordsRes.response.data) {
            console.log("No records found or unexpected format:", JSON.stringify(recordsRes, null, 2));
        } else {
            console.log(`Successfully fetched ${recordsRes.response.data.length} records.`);
            console.log("First record sample:", JSON.stringify(recordsRes.response.data[0], null, 2));
        }

        // Logout
        await request('DELETE', `/fmi/data/vLatest/databases/${FM_DB}/sessions/${token}`);
        console.log("Logged out.");

    } catch (e) {
        console.error("Error occurred:", e);
        if (typeof e === 'object' && e.body) {
            console.error("Response Body:", e.body);
        }
    }
}

run();
