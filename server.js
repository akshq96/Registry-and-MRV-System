const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const validation = require('./middleware/validation');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));
app.use('/public', express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow images and documents
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});

// Routes
try {
    app.use('/api', apiRoutes);
} catch (error) {
    console.error('Error setting up API routes:', error);
}

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const fileInfos = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            uploadDate: new Date().toISOString()
        }));

        res.json({
            success: true,
            message: 'Files uploaded successfully',
            files: fileInfos
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
});

// Mobile data collection endpoint
app.post('/api/mobile/submit-data', validation.validateMobileData, (req, res) => {
    try {
        const {
            projectId,
            location,
            coordinates,
            measurements,
            observations,
            photos,
            collectorId,
            timestamp
        } = req.body;

        // Store data (in a real app, this would go to a database)
        const dataEntry = {
            id: Date.now().toString(),
            projectId,
            location,
            coordinates,
            measurements,
            observations,
            photos,
            collectorId,
            timestamp: timestamp || new Date().toISOString(),
            status: 'pending_verification'
        };

        // Save to file (temporary storage)
        const dataDir = './data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const dataFile = path.join(dataDir, 'mobile_data.json');
        let existingData = [];
        
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            existingData = JSON.parse(fileContent);
        }

        existingData.push(dataEntry);
        fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));

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

// Get mobile data entries
app.get('/api/mobile/data', (req, res) => {
    try {
        const dataFile = './data/mobile_data.json';
        
        if (!fs.existsSync(dataFile)) {
            return res.json({ data: [] });
        }

        const fileContent = fs.readFileSync(dataFile, 'utf8');
        const data = JSON.parse(fileContent);

        res.json({ data });
    } catch (error) {
        console.error('Error retrieving mobile data:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

// Admin endpoints
app.get('/api/admin/statistics', (req, res) => {
    try {
        // Calculate statistics from stored data
        const dataFile = './data/mobile_data.json';
        let mobileDataCount = 0;
        
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            const data = JSON.parse(fileContent);
            mobileDataCount = data.length;
        }

        const stats = {
            totalMobileSubmissions: mobileDataCount,
            pendingVerifications: mobileDataCount, // Simplified
            activeProjects: Math.ceil(mobileDataCount / 5), // Estimated
            registeredStakeholders: Math.ceil(mobileDataCount / 3) // Estimated
        };

        res.json(stats);
    } catch (error) {
        console.error('Error calculating statistics:', error);
        res.status(500).json({ error: 'Failed to calculate statistics' });
    }
});

// Stakeholder registration endpoint
app.post('/api/stakeholder/register', validation.validateStakeholderRegistration, (req, res) => {
    try {
        const stakeholder = {
            id: Date.now().toString(),
            ...req.body,
            registrationDate: new Date().toISOString(),
            status: 'pending_approval'
        };

        // Store stakeholder data
        const dataDir = './data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const stakeholderFile = path.join(dataDir, 'stakeholders.json');
        let existingStakeholders = [];
        
        if (fs.existsSync(stakeholderFile)) {
            const fileContent = fs.readFileSync(stakeholderFile, 'utf8');
            existingStakeholders = JSON.parse(fileContent);
        }

        existingStakeholders.push(stakeholder);
        fs.writeFileSync(stakeholderFile, JSON.stringify(existingStakeholders, null, 2));

        res.json({
            success: true,
            message: 'Stakeholder registered successfully',
            stakeholderId: stakeholder.id
        });

    } catch (error) {
        console.error('Stakeholder registration error:', error);
        res.status(500).json({ error: 'Registration failed: ' + error.message });
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
