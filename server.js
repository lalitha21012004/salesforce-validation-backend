const express = require('express');
const jsforce = require('jsforce');
const cors = require('cors');
const session = require('cookie-session');
require('dotenv').config();

const app = express();

// Basic middleware setup
app.use(cors({ origin: 'https://salesforce-validation-manager-rho.vercel.app', credentials: true }));
app.use(express.json());
app.use(session({
    name: 'sf-session',
    keys: ['secret-key-123'], 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,                // Required for cross-site cookies over HTTPS
    sameSite: 'none'             // Allows cookie to be sent from Render to Vercel
}));

// OAuth2 Configuration using .env variables
const oauth2 = new jsforce.OAuth2({
    clientId: process.env.SF_CONSUMER_KEY,
    clientSecret: process.env.SF_CONSUMER_SECRET,
    redirectUri: process.env.SF_CALLBACK_URL
});

// --- Auth Routes ---

// Entry point for login
app.get('/auth/login', (req, res) => {
    console.log('Redirecting to Salesforce for Auth...');
    const authUrl = oauth2.getAuthorizationUrl({ scope: 'api refresh_token offline_access' });
    res.redirect(authUrl);
});

// Callback URL after SF login
app.get('/oauth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('No code provided from Salesforce');
    }

    const conn = new jsforce.Connection({ oauth2: oauth2 });
    
    try {
        await conn.authorize(code);
        
        console.log('User authorized successfully');
        
        // Pass tokens transparently via URL query parameters directly to the frontend
        const targetUrl = `https://salesforce-validation-manager-rho.vercel.app/?auth=success` +
                          `&token=${encodeURIComponent(conn.accessToken)}` +
                          `&instance=${encodeURIComponent(conn.instanceUrl)}`;
        
        res.redirect(targetUrl);
    } catch (err) {
        console.error('Auth Error:', err);
        res.status(500).send('Authentication failed');
    }
});

// --- API Routes ---

// Fetch Validation Rules (Account Object only)
// Fetch Validation Rules (Account Object only)
app.get('/api/rules', async (req, res) => {
    const accessToken = req.headers['x-access-token'];
    const instanceUrl = req.headers['x-instance-url'];

    if (!accessToken || !instanceUrl) {
        return res.status(401).json({ message: 'Session missing credentials, login again' });
    }

    const conn = new jsforce.Connection({
        instanceUrl: instanceUrl,
        accessToken: accessToken
    });

    try {
        const query = "SELECT Id, ValidationName, Active, Description FROM ValidationRule WHERE EntityDefinition.DeveloperName = 'Account'";
        const result = await conn.tooling.query(query);
        res.json(result.records);
    } catch (err) {
        console.error('Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

// Toggle Rule Status (Enable/Disable)
app.post('/api/rules/toggle', async (req, res) => {
    const { ruleId, status } = req.body;
    const accessToken = req.headers['x-access-token'];
    const instanceUrl = req.headers['x-instance-url'];

    if (!accessToken || !instanceUrl) {
        return res.status(401).send('Unauthorized');
    }

    const conn = new jsforce.Connection({
        instanceUrl: instanceUrl,
        accessToken: accessToken
    });

    try {
        const rule = await conn.tooling.sobject('ValidationRule').retrieve(ruleId);
        await conn.tooling.sobject('ValidationRule').update({
            Id: ruleId,
            Metadata: {
                ...rule.Metadata,
                active: status
            }
        });
        res.json({ success: true, newStatus: status });
    } catch (err) {
        console.error('Update Error:', err);
        res.status(500).json({ error: 'Failed to update rule', details: err.message });
    }
});

// Toggle Rule Status (Enable/Disable)
app.post('/api/rules/toggle', async (req, res) => {
    const { ruleId, status } = req.body;

    if (!req.session.accessToken) {
        return res.status(401).send('Unauthorized');
    }

    const conn = new jsforce.Connection({
        instanceUrl: req.session.instanceUrl,
        accessToken: req.session.accessToken
    });

    try {
        // 1. Fetch the full metadata of the rule first
        // The Tooling API requires existing metadata fields to perform an update
        const rule = await conn.tooling.sobject('ValidationRule').retrieve(ruleId);

        // 2. Perform the update including the Metadata object
        await conn.tooling.sobject('ValidationRule').update({
            Id: ruleId,
            Metadata: {
                ...rule.Metadata, // Keep existing formula, description, etc.
                active: status    // Update just the status (true/false)
            }
        });

        console.log(`Rule ${ruleId} updated successfully to ${status}`);
        res.json({ success: true, newStatus: status });
    } catch (err) {
        console.error('Update Error:', err);
        // Provide more detail to the frontend if possible
        res.status(500).json({ 
            error: 'Failed to update rule', 
            details: err.message 
        });
    }
});

// Logout logic
app.get('/auth/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});