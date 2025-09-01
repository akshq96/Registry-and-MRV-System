const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const validation = require('../middleware/validation');

// Utility function to read JSON data files
const readDataFile = (filename) => {
    const filePath = path.join('./data', filename);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
};

// Utility function to write JSON data files
const writeDataFile = (filename, data) => {
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
};

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Projects endpoints
router.get('/projects', validation.validatePaginationQuery, (req, res) => {
    try {
        const projects = readDataFile('projects.json');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedProjects = projects.slice(startIndex, endIndex);

        res.json({
            projects: paginatedProjects,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(projects.length / limit),
                totalItems: projects.length,
                hasNext: endIndex < projects.length,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

router.get('/projects/:id', (req, res) => {
    try {
        const projects = readDataFile('projects.json');
        const project = projects.find(p => p.id === req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ project });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project details' });
    }
});

router.post('/projects', validation.validateProjectRegistration, (req, res) => {
    try {
        const projects = readDataFile('projects.json');
        const newProject = {
            id: Date.now().toString(),
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString(),
            owner: req.body.ownerAddress || 'unknown',
            actualCredits: 0
        };

        projects.push(newProject);
        writeDataFile('projects.json', projects);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project: newProject
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

router.put('/projects/:id/status', validation.validateAdminAction, (req, res) => {
    try {
        const projects = readDataFile('projects.json');
        const projectIndex = projects.findIndex(p => p.id === req.params.id);

        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { action, reason } = req.body;
        const project = projects[projectIndex];

        switch (action) {
            case 'verify':
                project.status = 'verified';
                project.verifiedAt = new Date().toISOString();
                break;
            case 'approve':
                project.status = 'active';
                project.approvedAt = new Date().toISOString();
                break;
            case 'reject':
                project.status = 'rejected';
                project.rejectedAt = new Date().toISOString();
                project.rejectionReason = reason;
                break;
            case 'suspend':
                project.status = 'suspended';
                project.suspendedAt = new Date().toISOString();
                project.suspensionReason = reason;
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        project.lastModified = new Date().toISOString();
        projects[projectIndex] = project;
        writeDataFile('projects.json', projects);

        res.json({
            success: true,
            message: `Project ${action}ed successfully`,
            project
        });
    } catch (error) {
        console.error('Error updating project status:', error);
        res.status(500).json({ error: 'Failed to update project status' });
    }
});

// Stakeholders endpoints
router.get('/stakeholders', validation.validatePaginationQuery, (req, res) => {
    try {
        const stakeholders = readDataFile('stakeholders.json');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedStakeholders = stakeholders.slice(startIndex, endIndex);

        res.json({
            stakeholders: paginatedStakeholders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(stakeholders.length / limit),
                totalItems: stakeholders.length,
                hasNext: endIndex < stakeholders.length,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching stakeholders:', error);
        res.status(500).json({ error: 'Failed to fetch stakeholders' });
    }
});

router.get('/stakeholders/:address', (req, res) => {
    try {
        const stakeholders = readDataFile('stakeholders.json');
        const stakeholder = stakeholders.find(s => s.address === req.params.address);

        if (!stakeholder) {
            return res.status(404).json({ error: 'Stakeholder not found' });
        }

        res.json({ stakeholder });
    } catch (error) {
        console.error('Error fetching stakeholder:', error);
        res.status(500).json({ error: 'Failed to fetch stakeholder details' });
    }
});

router.put('/stakeholders/:id/approve', validation.validateAdminAction, (req, res) => {
    try {
        const stakeholders = readDataFile('stakeholders.json');
        const stakeholderIndex = stakeholders.findIndex(s => s.id === req.params.id);

        if (stakeholderIndex === -1) {
            return res.status(404).json({ error: 'Stakeholder not found' });
        }

        stakeholders[stakeholderIndex].status = 'approved';
        stakeholders[stakeholderIndex].approvedAt = new Date().toISOString();
        stakeholders[stakeholderIndex].approvedBy = req.body.adminAddress;

        writeDataFile('stakeholders.json', stakeholders);

        res.json({
            success: true,
            message: 'Stakeholder approved successfully',
            stakeholder: stakeholders[stakeholderIndex]
        });
    } catch (error) {
        console.error('Error approving stakeholder:', error);
        res.status(500).json({ error: 'Failed to approve stakeholder' });
    }
});

// Mobile data endpoints
router.get('/mobile/projects', (req, res) => {
    try {
        const projects = readDataFile('projects.json');
        const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'verified');

        res.json({
            projects: activeProjects.map(p => ({
                id: p.id,
                name: p.name,
                location: p.location,
                ecosystemType: p.ecosystemType,
                status: p.status
            }))
        });
    } catch (error) {
        console.error('Error fetching mobile projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects for mobile' });
    }
});

// MRV data endpoints
router.get('/mrv-data', validation.validatePaginationQuery, (req, res) => {
    try {
        const mrvData = readDataFile('mobile_data.json');
        const projectId = req.query.projectId;

        let filteredData = mrvData;
        if (projectId) {
            filteredData = mrvData.filter(d => d.projectId === projectId);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedData = filteredData.slice(startIndex, endIndex);

        res.json({
            data: paginatedData,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(filteredData.length / limit),
                totalItems: filteredData.length,
                hasNext: endIndex < filteredData.length,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching MRV data:', error);
        res.status(500).json({ error: 'Failed to fetch MRV data' });
    }
});

router.post('/mrv-data', validation.validateMRVData, (req, res) => {
    try {
        const mrvData = readDataFile('mrv_data.json');
        const newMRVEntry = {
            id: Date.now().toString(),
            ...req.body,
            timestamp: new Date().toISOString(),
            status: 'pending_verification',
            verified: false
        };

        mrvData.push(newMRVEntry);
        writeDataFile('mrv_data.json', mrvData);

        res.status(201).json({
            success: true,
            message: 'MRV data submitted successfully',
            dataId: newMRVEntry.id
        });
    } catch (error) {
        console.error('Error submitting MRV data:', error);
        res.status(500).json({ error: 'Failed to submit MRV data' });
    }
});

router.put('/mrv-data/:id/verify', validation.validateAdminAction, (req, res) => {
    try {
        const mrvData = readDataFile('mrv_data.json');
        const dataIndex = mrvData.findIndex(d => d.id === req.params.id);

        if (dataIndex === -1) {
            return res.status(404).json({ error: 'MRV data not found' });
        }

        mrvData[dataIndex].verified = true;
        mrvData[dataIndex].verifiedAt = new Date().toISOString();
        mrvData[dataIndex].verifiedBy = req.body.adminAddress;
        mrvData[dataIndex].status = 'verified';

        writeDataFile('mrv_data.json', mrvData);

        res.json({
            success: true,
            message: 'MRV data verified successfully',
            data: mrvData[dataIndex]
        });
    } catch (error) {
        console.error('Error verifying MRV data:', error);
        res.status(500).json({ error: 'Failed to verify MRV data' });
    }
});

// Carbon credits endpoints
router.get('/carbon-credits/balance/:address', (req, res) => {
    try {
        const credits = readDataFile('carbon_credits.json');
        const userCredits = credits.filter(c => c.owner === req.params.address && !c.retired);
        const balance = userCredits.reduce((sum, credit) => sum + parseFloat(credit.amount), 0);

        res.json({
            address: req.params.address,
            balance: balance.toFixed(2),
            credits: userCredits
        });
    } catch (error) {
        console.error('Error fetching carbon credit balance:', error);
        res.status(500).json({ error: 'Failed to fetch carbon credit balance' });
    }
});

router.post('/carbon-credits/mint', validation.validateCarbonCreditMinting, (req, res) => {
    try {
        const credits = readDataFile('carbon_credits.json');
        const newCredit = {
            id: Date.now().toString(),
            ...req.body,
            mintedAt: new Date().toISOString(),
            retired: false,
            status: 'active'
        };

        credits.push(newCredit);
        writeDataFile('carbon_credits.json', credits);

        res.status(201).json({
            success: true,
            message: 'Carbon credits minted successfully',
            credit: newCredit
        });
    } catch (error) {
        console.error('Error minting carbon credits:', error);
        res.status(500).json({ error: 'Failed to mint carbon credits' });
    }
});

router.post('/carbon-credits/retire', (req, res) => {
    try {
        const { amount, reason, ownerAddress } = req.body;
        
        if (!amount || !reason || !ownerAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const credits = readDataFile('carbon_credits.json');
        const userCredits = credits.filter(c => c.owner === ownerAddress && !c.retired);
        
        let remainingAmount = parseFloat(amount);
        const retiredCredits = [];

        for (let credit of userCredits) {
            if (remainingAmount <= 0) break;
            
            const creditAmount = parseFloat(credit.amount);
            if (creditAmount <= remainingAmount) {
                credit.retired = true;
                credit.retiredAt = new Date().toISOString();
                credit.retirementReason = reason;
                retiredCredits.push(credit);
                remainingAmount -= creditAmount;
            }
        }

        if (remainingAmount > 0) {
            return res.status(400).json({ error: 'Insufficient credits to retire' });
        }

        writeDataFile('carbon_credits.json', credits);

        res.json({
            success: true,
            message: `${amount} carbon credits retired successfully`,
            retiredCredits
        });
    } catch (error) {
        console.error('Error retiring carbon credits:', error);
        res.status(500).json({ error: 'Failed to retire carbon credits' });
    }
});

// Blockchain endpoints
router.post('/blockchain/transaction', validation.validateBlockchainTransaction, (req, res) => {
    try {
        const transactions = readDataFile('transactions.json');
        const newTransaction = {
            id: Date.now().toString(),
            ...req.body,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        transactions.push(newTransaction);
        writeDataFile('transactions.json', transactions);

        res.status(201).json({
            success: true,
            message: 'Transaction recorded successfully',
            transaction: newTransaction
        });
    } catch (error) {
        console.error('Error recording transaction:', error);
        res.status(500).json({ error: 'Failed to record transaction' });
    }
});

router.get('/blockchain/transaction/:hash', (req, res) => {
    try {
        const transactions = readDataFile('transactions.json');
        const transaction = transactions.find(t => t.transactionHash === req.params.hash);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ transaction });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Failed to fetch transaction details' });
    }
});

// Search endpoints
router.get('/search', validation.validateSearchQuery, (req, res) => {
    try {
        const { q, type } = req.query;
        const results = {
            projects: [],
            stakeholders: [],
            transactions: []
        };

        if (!q) {
            return res.json(results);
        }

        const searchTerm = q.toLowerCase();

        if (!type || type === 'project') {
            const projects = readDataFile('projects.json');
            results.projects = projects.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.location.toLowerCase().includes(searchTerm) ||
                p.ecosystemType.toLowerCase().includes(searchTerm)
            ).slice(0, 10);
        }

        if (!type || type === 'stakeholder') {
            const stakeholders = readDataFile('stakeholders.json');
            results.stakeholders = stakeholders.filter(s =>
                s.name.toLowerCase().includes(searchTerm) ||
                s.organization.toLowerCase().includes(searchTerm) ||
                s.location.toLowerCase().includes(searchTerm)
            ).slice(0, 10);
        }

        if (!type || type === 'transaction') {
            const transactions = readDataFile('transactions.json');
            results.transactions = transactions.filter(t =>
                t.transactionHash.toLowerCase().includes(searchTerm) ||
                (t.fromAddress && t.fromAddress.toLowerCase().includes(searchTerm)) ||
                (t.toAddress && t.toAddress.toLowerCase().includes(searchTerm))
            ).slice(0, 10);
        }

        res.json({
            query: q,
            type: type || 'all',
            results
        });
    } catch (error) {
        console.error('Error performing search:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Analytics endpoints
router.get('/analytics/overview', (req, res) => {
    try {
        const projects = readDataFile('projects.json');
        const stakeholders = readDataFile('stakeholders.json');
        const mrvData = readDataFile('mobile_data.json');
        const credits = readDataFile('carbon_credits.json');

        const analytics = {
            totalProjects: projects.length,
            verifiedProjects: projects.filter(p => p.status === 'verified').length,
            pendingProjects: projects.filter(p => p.status === 'pending').length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            
            totalStakeholders: stakeholders.length,
            approvedStakeholders: stakeholders.filter(s => s.status === 'approved').length,
            pendingStakeholders: stakeholders.filter(s => s.status === 'pending_approval').length,
            
            totalMRVSubmissions: mrvData.length,
            verifiedMRVData: mrvData.filter(m => m.status === 'verified').length,
            pendingMRVData: mrvData.filter(m => m.status === 'pending_verification').length,
            
            totalCreditsIssued: credits.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
            retiredCredits: credits.filter(c => c.retired).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
            activeCredits: credits.filter(c => !c.retired).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
            
            ecosystemDistribution: projects.reduce((acc, p) => {
                acc[p.ecosystemType] = (acc[p.ecosystemType] || 0) + 1;
                return acc;
            }, {}),
            
            stakeholderDistribution: stakeholders.reduce((acc, s) => {
                acc[s.stakeholderType] = (acc[s.stakeholderType] || 0) + 1;
                return acc;
            }, {})
        };

        res.json({ analytics });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

// Export endpoints for data
router.get('/export/projects', (req, res) => {
    try {
        const projects = readDataFile('projects.json');
        const format = req.query.format || 'json';

        if (format === 'csv') {
            // Simple CSV export
            const csvHeaders = 'ID,Name,Location,Area,Ecosystem Type,Status,Created At\n';
            const csvData = projects.map(p => 
                `${p.id},"${p.name}","${p.location}",${p.area},"${p.ecosystemType}","${p.status}","${p.createdAt}"`
            ).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=projects.csv');
            res.send(csvHeaders + csvData);
        } else {
            res.json({ projects });
        }
    } catch (error) {
        console.error('Error exporting projects:', error);
        res.status(500).json({ error: 'Failed to export projects' });
    }
});

router.get('/export/stakeholders', (req, res) => {
    try {
        const stakeholders = readDataFile('stakeholders.json');
        const format = req.query.format || 'json';

        if (format === 'csv') {
            const csvHeaders = 'ID,Name,Organization,Type,Location,Status,Registered At\n';
            const csvData = stakeholders.map(s => 
                `${s.id},"${s.name}","${s.organization}","${s.stakeholderType}","${s.location}","${s.status}","${s.registrationDate}"`
            ).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=stakeholders.csv');
            res.send(csvHeaders + csvData);
        } else {
            res.json({ stakeholders });
        }
    } catch (error) {
        console.error('Error exporting stakeholders:', error);
        res.status(500).json({ error: 'Failed to export stakeholders' });
    }
});

// Notification endpoints
router.get('/notifications', (req, res) => {
    try {
        const notifications = readDataFile('notifications.json');
        const userAddress = req.query.user;

        let filteredNotifications = notifications;
        if (userAddress) {
            filteredNotifications = notifications.filter(n => 
                n.recipient === userAddress || n.recipient === 'all'
            );
        }

        // Sort by timestamp, newest first
        filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            notifications: filteredNotifications.slice(0, 20), // Limit to 20 most recent
            unreadCount: filteredNotifications.filter(n => !n.read).length
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.put('/notifications/:id/read', (req, res) => {
    try {
        const notifications = readDataFile('notifications.json');
        const notificationIndex = notifications.findIndex(n => n.id === req.params.id);

        if (notificationIndex === -1) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        notifications[notificationIndex].read = true;
        notifications[notificationIndex].readAt = new Date().toISOString();

        writeDataFile('notifications.json', notifications);

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl
    });
});

module.exports = router;
