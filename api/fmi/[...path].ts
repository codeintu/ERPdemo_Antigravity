import axios from 'axios';

export default async function handler(req: any, res: any) {
    const { path } = req.query;
    const fmHost = process.env.VITE_FM_HOST;

    // Construct the actual FileMaker path from the spread route
    const fmPath = Array.isArray(path) ? path.join('/') : path;
    const targetUrl = `https://${fmHost}/fmi/${fmPath}`;

    console.log(`Proxying ${req.method} to: ${targetUrl}`);

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: {
                'Authorization': req.headers.authorization || '',
                'Content-Type': 'application/json',
                // We don't forward all headers to avoid host/origin conflicts
            }
        });

        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('Proxy Error:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const data = error.response?.data || { error: 'Internal Proxy Error', details: error.message };
        res.status(status).json(data);
    }
}
