// Simple CORS Proxy Server for Zerodha API
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy endpoint for Zerodha API
app.all('/api/*', async (req, res) => {
    try {
        const zerodhaUrl = `https://api.kite.trade${req.path.replace('/api', '')}`;
        
        console.log(`Proxying ${req.method} request to: ${zerodhaUrl}`);
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        
        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': req.headers.authorization,
                'X-Kite-Version': '3'
            }
        };

        if (req.method === 'POST' && req.body) {
            const formData = new URLSearchParams();
            Object.keys(req.body).forEach(key => {
                formData.append(key, req.body[key]);
            });
            options.body = formData;
        }

        const response = await fetch(zerodhaUrl, options);
        const data = await response.json();
        
        console.log('Zerodha API Response:', {
            status: response.status,
            statusText: response.statusText,
            data: data
        });
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Proxy server error', 
            message: error.message 
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`CORS Proxy server running on port ${PORT}`);
    console.log(`Use this URL in your app: http://localhost:${PORT}/api`);
});
