import axios from 'axios';
import https from 'https';
// dotenv removed, running with --env-file=.env

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const host = `https://${process.env.VITE_FM_HOST}`;
console.log('Host:', host); // Debugging
const db = process.env.VITE_FM_DATABASE;
const user = process.env.VITE_FM_USER;
const password = process.env.VITE_FM_PASSWORD;

const LAYOUT_SLS = 'SLS_Web';
const LAYOUT_LIC = 'LIC_Web';

async function getAuthToken() {
    const auth = Buffer.from(`${user}:${password}`).toString('base64');
    const response = await axios.post(
        `${host}/fmi/data/vLatest/databases/${db}/sessions`,
        {},
        {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            httpsAgent
        }
    );
    return response.data.response.token;
}

async function getLayoutMetadata(token, layout) {
    try {
        const response = await axios.get(
            `${host}/fmi/data/vLatest/databases/${db}/layouts/${layout}`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                httpsAgent
            }
        );
        console.log(`Metadata for ${layout}:`, response.data.response.fieldMetaData.map(f => f.name));
    } catch (e) {
        console.error(`Error getting metadata for ${layout}:`, e.message);
    }
}

async function getFirstRecord(token, layout) {
    console.log(`--- Fetching 1 record from ${layout} ---`);
    try {
        const response = await axios.get(
            `${host}/fmi/data/vLatest/databases/${db}/layouts/${layout}/records?_limit=1`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                httpsAgent
            }
        );
        if (response.data.response.data.length > 0) {
            console.log(JSON.stringify(response.data.response.data[0].fieldData, null, 2));
        } else {
            console.log('No records found.');
        }
    } catch (e) {
        console.error('Error fetching record:', e.response?.data || e.message);
    }
}

async function run() {
    try {
        console.log('Authenticating...');
        const token = await getAuthToken();
        console.log('Token received.');

        console.log(`\n--- Inspecting Layout: ${LAYOUT_SLS} ---`);
        await getLayoutMetadata(token, LAYOUT_SLS);
        await getFirstRecord(token, LAYOUT_SLS);

        console.log(`\n--- Inspecting Layout: ${LAYOUT_LIC} ---`);
        await getLayoutMetadata(token, LAYOUT_LIC);
        await getFirstRecord(token, LAYOUT_LIC);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

run();
