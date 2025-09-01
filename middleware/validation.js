const { body, query, param, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Mobile data validation
const validateMobileData = [
    body('projectId')
        .notEmpty()
        .withMessage('Project ID is required')
        .isString()
        .withMessage('Project ID must be a string'),
    
    body('location')
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ min: 3, max: 500 })
        .withMessage('Location must be between 3 and 500 characters'),
    
    body('coordinates')
        .notEmpty()
        .withMessage('GPS coordinates are required')
        .matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
        .withMessage('Coordinates must be in format "latitude,longitude"'),
    
    body('measurements')
        .isObject()
        .withMessage('Measurements must be an object'),
    
    body('measurements.treeCount')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Tree count must be a non-negative integer'),
    
    body('measurements.avgHeight')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Average height must be a non-negative number'),
    
    body('measurements.crownCoverage')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Crown coverage must be between 0 and 100'),
    
    body('measurements.healthScore')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Health score must be between 1 and 10'),
    
    body('measurements.phLevel')
        .optional()
        .isFloat({ min: 0, max: 14 })
        .withMessage('pH level must be between 0 and 14'),
    
    body('measurements.salinity')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salinity must be a non-negative number'),
    
    body('measurements.waterTemp')
        .optional()
        .isFloat({ min: -10, max: 50 })
        .withMessage('Water temperature must be between -10 and 50 degrees Celsius'),
    
    body('measurements.turbidity')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Turbidity must be a non-negative number'),
    
    body('measurements.organicCarbon')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Organic carbon must be between 0 and 100 percent'),
    
    body('measurements.soilDepth')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Soil depth must be a non-negative integer'),
    
    body('measurements.bulkDensity')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Bulk density must be a non-negative number'),
    
    body('measurements.moistureContent')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Moisture content must be between 0 and 100 percent'),
    
    body('observations')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Observations must not exceed 2000 characters'),
    
    body('collectorId')
        .notEmpty()
        .withMessage('Collector ID is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Collector ID must be between 2 and 100 characters'),
    
    body('timestamp')
        .optional()
        .isISO8601()
        .withMessage('Timestamp must be a valid ISO 8601 date'),
    
    handleValidationErrors
];

// Stakeholder registration validation
const validateStakeholderRegistration = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\.]+$/)
        .withMessage('Name must contain only letters, spaces, and periods'),
    
    body('organization')
        .notEmpty()
        .withMessage('Organization is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Organization name must be between 2 and 200 characters'),
    
    body('stakeholderType')
        .notEmpty()
        .withMessage('Stakeholder type is required')
        .isIn(['NGO', 'Community', 'Panchayat', 'Researcher', 'Government'])
        .withMessage('Invalid stakeholder type'),
    
    body('location')
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Location must be between 3 and 200 characters'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    
    body('phone')
        .optional()
        .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
        .withMessage('Invalid phone number format'),
    
    body('website')
        .optional()
        .isURL()
        .withMessage('Invalid website URL'),
    
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    
    handleValidationErrors
];

// Project registration validation
const validateProjectRegistration = [
    body('name')
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Project name must be between 3 and 200 characters'),
    
    body('location')
        .notEmpty()
        .withMessage('Project location is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Location must be between 3 and 200 characters'),
    
    body('area')
        .notEmpty()
        .withMessage('Project area is required')
        .isFloat({ min: 0.1, max: 100000 })
        .withMessage('Area must be between 0.1 and 100,000 hectares'),
    
    body('ecosystemType')
        .notEmpty()
        .withMessage('Ecosystem type is required')
        .isIn(['mangrove', 'seagrass', 'saltmarsh', 'tidalmarsh'])
        .withMessage('Invalid ecosystem type'),
    
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    
    body('estimatedCredits')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Estimated credits must be a non-negative integer'),
    
    body('coordinates')
        .optional()
        .matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
        .withMessage('Coordinates must be in format "latitude,longitude"'),
    
    handleValidationErrors
];

// Blockchain transaction validation
const validateBlockchainTransaction = [
    body('transactionHash')
        .notEmpty()
        .withMessage('Transaction hash is required')
        .matches(/^0x[a-fA-F0-9]{64}$/)
        .withMessage('Invalid transaction hash format'),
    
    body('contractAddress')
        .optional()
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid contract address format'),
    
    body('fromAddress')
        .optional()
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid from address format'),
    
    body('toAddress')
        .optional()
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid to address format'),
    
    handleValidationErrors
];

// Carbon credit minting validation
const validateCarbonCreditMinting = [
    body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0.01'),
    
    body('projectId')
        .notEmpty()
        .withMessage('Project ID is required')
        .isString()
        .withMessage('Project ID must be a string'),
    
    body('verificationHash')
        .notEmpty()
        .withMessage('Verification hash is required')
        .isLength({ min: 10, max: 200 })
        .withMessage('Verification hash must be between 10 and 200 characters'),
    
    body('recipientAddress')
        .notEmpty()
        .withMessage('Recipient address is required')
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid recipient address format'),
    
    handleValidationErrors
];

// MRV data validation
const validateMRVData = [
    body('projectId')
        .notEmpty()
        .withMessage('Project ID is required')
        .isString()
        .withMessage('Project ID must be a string'),
    
    body('dataHash')
        .notEmpty()
        .withMessage('Data hash is required')
        .isLength({ min: 10, max: 200 })
        .withMessage('Data hash must be between 10 and 200 characters'),
    
    body('coordinates')
        .notEmpty()
        .withMessage('GPS coordinates are required')
        .matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
        .withMessage('Coordinates must be in format "latitude,longitude"'),
    
    body('carbonSequestration')
        .notEmpty()
        .withMessage('Carbon sequestration value is required')
        .isFloat({ min: 0 })
        .withMessage('Carbon sequestration must be a non-negative number'),
    
    body('timestamp')
        .optional()
        .isISO8601()
        .withMessage('Timestamp must be a valid ISO 8601 date'),
    
    body('collectorAddress')
        .notEmpty()
        .withMessage('Collector address is required')
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid collector address format'),
    
    handleValidationErrors
];

// File upload validation
const validateFileUpload = [
    body('fileType')
        .optional()
        .isIn(['image', 'document', 'video'])
        .withMessage('Invalid file type'),
    
    body('fileName')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('File name must be between 1 and 255 characters'),
    
    body('projectId')
        .optional()
        .isString()
        .withMessage('Project ID must be a string'),
    
    handleValidationErrors
];

// Query parameter validation
const validatePaginationQuery = [
    query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Page must be an integer between 1 and 1000'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be an integer between 1 and 100'),
    
    query('sortBy')
        .optional()
        .isIn(['date', 'name', 'status', 'amount'])
        .withMessage('Invalid sort field'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be "asc" or "desc"'),
    
    handleValidationErrors
];

// Search query validation
const validateSearchQuery = [
    query('q')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters')
        .escape(),
    
    query('type')
        .optional()
        .isIn(['project', 'stakeholder', 'transaction'])
        .withMessage('Invalid search type'),
    
    query('status')
        .optional()
        .isIn(['pending', 'active', 'verified', 'suspended'])
        .withMessage('Invalid status filter'),
    
    handleValidationErrors
];

// Admin action validation
const validateAdminAction = [
    body('action')
        .notEmpty()
        .withMessage('Action is required')
        .isIn(['approve', 'reject', 'suspend', 'activate', 'verify'])
        .withMessage('Invalid action type'),
    
    body('targetId')
        .notEmpty()
        .withMessage('Target ID is required')
        .isString()
        .withMessage('Target ID must be a string'),
    
    body('reason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Reason must not exceed 500 characters'),
    
    body('adminAddress')
        .notEmpty()
        .withMessage('Admin address is required')
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid admin address format'),
    
    handleValidationErrors
];

// GPS coordinates validation
const validateGPSCoordinates = [
    body('latitude')
        .notEmpty()
        .withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90 degrees'),
    
    body('longitude')
        .notEmpty()
        .withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180 degrees'),
    
    body('accuracy')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Accuracy must be a non-negative number'),
    
    handleValidationErrors
];

// Environmental measurement validation
const validateEnvironmentalMeasurement = [
    body('temperature')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Temperature must be between -50 and 60 degrees Celsius'),
    
    body('humidity')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Humidity must be between 0 and 100 percent'),
    
    body('windSpeed')
        .optional()
        .isFloat({ min: 0, max: 200 })
        .withMessage('Wind speed must be between 0 and 200 km/h'),
    
    body('pressure')
        .optional()
        .isFloat({ min: 800, max: 1200 })
        .withMessage('Pressure must be between 800 and 1200 hPa'),
    
    handleValidationErrors
];

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Remove any potential script tags or dangerous HTML
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+\s*=/gi, '');
    };

    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeString(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

// Rate limiting validation
const validateRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requestCounts = new Map();

    return (req, res, next) => {
        const identifier = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        for (let [key, data] of requestCounts.entries()) {
            if (data.timestamp < windowStart) {
                requestCounts.delete(key);
            }
        }

        // Check current requests
        const currentRequests = requestCounts.get(identifier) || { count: 0, timestamp: now };

        if (currentRequests.timestamp < windowStart) {
            currentRequests.count = 0;
            currentRequests.timestamp = now;
        }

        currentRequests.count++;
        requestCounts.set(identifier, currentRequests);

        if (currentRequests.count > maxRequests) {
            return res.status(429).json({
                error: 'Too many requests',
                message: `Maximum ${maxRequests} requests per ${windowMs / 1000} seconds exceeded`
            });
        }

        next();
    };
};

module.exports = {
    validateMobileData,
    validateStakeholderRegistration,
    validateProjectRegistration,
    validateBlockchainTransaction,
    validateCarbonCreditMinting,
    validateMRVData,
    validateFileUpload,
    validatePaginationQuery,
    validateSearchQuery,
    validateAdminAction,
    validateGPSCoordinates,
    validateEnvironmentalMeasurement,
    sanitizeInput,
    validateRateLimit,
    handleValidationErrors
};
