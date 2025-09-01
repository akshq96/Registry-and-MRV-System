const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));
app.use('/public', express.static('public'));

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Admin statistics endpoint
app.get('/api/admin/statistics', (req, res) => {
    try {
        const stats = {
            totalMobileSubmissions: 3,
            pendingVerifications: 2,
            activeProjects: 1,
            registeredStakeholders: 2
        };
        res.json(stats);
    } catch (error) {
        console.error('Error calculating statistics:', error);
        res.status(500).json({ error: 'Failed to calculate statistics' });
    }
});

// Mobile projects endpoint
app.get('/api/mobile/projects', (req, res) => {
    try {
        const projects = [
            {
                id: '1',
                name: 'Sundarbans Mangrove Restoration',
                location: 'West Bengal, India',
                ecosystemType: 'mangrove',
                status: 'active'
            },
            {
                id: '2',
                name: 'Kerala Backwater Conservation',
                location: 'Kerala, India',
                ecosystemType: 'seagrass',
                status: 'verified'
            }
        ];
        
        res.json({ projects });
    } catch (error) {
        console.error('Error fetching mobile projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects for mobile' });
    }
});

// Mobile data submission endpoint
app.post('/api/mobile/submit-data', (req, res) => {
    try {
        const dataEntry = {
            id: Date.now().toString(),
            ...req.body,
            timestamp: new Date().toISOString(),
            status: 'pending_verification'
        };

        res.json({
            success: true,
            message: 'Data submitted successfully',
            dataId: dataEntry.id
        });

    } catch (error) {
        console.error('Mobile data submission error:', error);
        res.status(500).json({ error: 'Data submission failed: ' + error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌊 Blue Carbon Registry Server running on port ${PORT}`);
    console.log(`📱 Mobile interface: http://localhost:${PORT}/public/mobile.html`);
    console.log(`🔧 Admin dashboard: http://localhost:${PORT}/public/admin.html`);
    console.log(`🏠 Main application: http://localhost:${PORT}`);
});

module.exports = app;