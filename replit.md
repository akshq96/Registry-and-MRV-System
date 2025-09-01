# Blue Carbon Registry - Blockchain MRV System

## Overview

Blue Carbon Registry is a blockchain-powered Monitoring, Reporting, and Verification (MRV) system for blue carbon ecosystem restoration projects. The platform enables transparent tracking of environmental restoration activities through tokenized carbon credits, mobile data collection, and smart contract verification. The system provides a comprehensive solution for environmental project management, from field data collection to carbon credit issuance and trading.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a multi-page web interface built with:
- **Vanilla JavaScript** with Web3.js integration for blockchain connectivity
- **Tailwind CSS** for responsive styling and component design
- **Feather Icons** for consistent iconography
- **Chart.js** for data visualization in admin dashboards
- **Progressive Web App** design optimized for mobile field data collection

The frontend is structured with three main interfaces:
- Main dashboard (index.html) for general users and project overview
- Mobile data collection interface (mobile.html) optimized for field workers
- Admin dashboard (admin.html) for system administrators and project managers

### Backend Architecture
The backend follows a Node.js/Express architecture with:
- **Express.js** server handling REST API endpoints and static file serving
- **Multer** middleware for handling file uploads with validation and storage
- **CORS** enabled for cross-origin requests
- **Express-validator** for input validation and sanitization
- **File-based data storage** using JSON files for simplicity and portability

The API layer is modularized with separate route handlers and validation middleware, supporting operations like project management, data collection, and verification workflows.

### Blockchain Integration
The system integrates with Ethereum-compatible blockchains through:
- **Web3.js** for smart contract interaction and wallet connectivity
- **MetaMask** integration for user authentication and transaction signing
- **Smart contract architecture** with two main contracts:
  - Carbon Credit Token contract for minting, transferring, and retiring credits
  - Registry contract for project registration and verification tracking
- **Caching layer** for blockchain data to improve performance and reduce RPC calls

### Data Management
The application uses a hybrid approach:
- **Local JSON storage** for application data, project information, and collected field data
- **Blockchain storage** for immutable records, verification hashes, and carbon credit transactions
- **File upload system** with validation for supporting documents and images
- **Progressive data sync** allowing offline data collection with later synchronization

### Mobile-First Design
The mobile interface is optimized for field data collection with:
- **Step-by-step data collection** workflow with progress tracking
- **GPS coordinate capture** for location verification
- **Offline-capable** data storage with sync capabilities
- **Image capture and upload** for verification purposes
- **Form validation** ensuring data quality before submission

## External Dependencies

### Blockchain Services
- **Ethereum Network** (or compatible EVM chains) for smart contract deployment
- **MetaMask** wallet integration for user authentication and transaction management
- **Web3.js library** (v4.16.0) for blockchain connectivity and contract interaction

### CDN Dependencies
- **Tailwind CSS** via CDN for styling framework
- **Web3.js** via CDN for frontend blockchain integration
- **Feather Icons** for icon library
- **Chart.js** for admin dashboard visualizations

### Node.js Dependencies
- **Express.js** (v5.1.0) for web server and API framework
- **Multer** (v2.0.2) for file upload handling
- **CORS** (v2.8.5) for cross-origin resource sharing
- **Express-validator** (v7.2.1) for input validation and sanitization

### Development and Deployment
- **Node.js runtime** for server execution
- **File system** for data persistence and file storage
- **Static file hosting** capabilities for frontend assets
- **Environment configuration** support for different deployment environments

The system is designed to be easily deployable on various platforms while maintaining blockchain connectivity and supporting both web and mobile interfaces for comprehensive blue carbon project management.