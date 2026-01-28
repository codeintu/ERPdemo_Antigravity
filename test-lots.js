import fs from 'fs';
import path from 'path';
import https from 'https';

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
const LAYOUT_PRD = 'PRD_Web';
const LAYOUT_LOT = 'ITY_Web';

if (!FM_HOST) { console.error("Missing credentials"); process.exit(1); }

const auth = Buffer.from(`${FM_USER}:${FM_PWD}`).toString('base64');
const agent = new https.Agent({ rejectUnauthorized: false });

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: FM_HOST,
            port: 443,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' },
            agent: agent
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        else options.headers['Authorization'] = `Basic ${auth}`;

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
                else reject({ status: res.statusCode, body: data });
            });
        });
        req.on('error', reject);
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

        // 1. Get a product
        console.log(`Fetching one product from ${LAYOUT_PRD}...`);
        const prdRes = await request('GET', `/fmi/data/vLatest/databases/${FM_DB}/layouts/${LAYOUT_PRD}/records?_limit=1`, null, token);
        const product = prdRes.response.data[0];
        const itemNo = product.fieldData.ItemNo;
        console.log(`Found Product: ${product.fieldData.ProductName} (ItemNo: ${itemNo})`);

        // 2. Search for lots with that ItemNo
        console.log(`Searching for Lots with ItemNo = ${itemNo}...`);
        try {
            const findRes = await request('POST', `/fmi/data/vLatest/databases/${FM_DB}/layouts/${LAYOUT_LOT}/_find`, {
                query: [{ ItemNo: `=${itemNo}` }]
            }, token);

            console.log(`Found ${findRes.response.data.length} lots.`);
            console.log("First Lot:", JSON.stringify(findRes.response.data[0].fieldData, null, 2));
        } catch (e) {
            console.log("No lots found (or error) for this item:", e.body || e);
        }

        await request('DELETE', `/fmi/data/vLatest/databases/${FM_DB}/sessions/${token}`);
    } catch (e) { console.error("Error:", e); }
}

run();
