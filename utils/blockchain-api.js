// Blockchain API utilities for Blue Carbon Registry

class BlockchainAPI {
    constructor(web3Config) {
        this.web3Config = web3Config;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Cache management
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    // Carbon Credit Token Methods
    async getCarbonCreditBalance(address) {
        try {
            const cacheKey = `balance_${address}`;
            const cached = this.getCache(cacheKey);
            if (cached !== null) return cached;

            const contract = this.web3Config.contracts.carbonCreditToken;
            const balance = await contract.methods.balanceOf(address).call();
            const balanceInTokens = this.web3Config.fromWei(balance);
            
            this.setCache(cacheKey, balanceInTokens);
            return balanceInTokens;
        } catch (error) {
            console.error('Error getting carbon credit balance:', error);
            throw error;
        }
    }

    async getTotalSupply() {
        try {
            const cacheKey = 'total_supply';
            const cached = this.getCache(cacheKey);
            if (cached !== null) return cached;

            const contract = this.web3Config.contracts.carbonCreditToken;
            const totalSupply = await contract.methods.totalSupply().call();
            const supplyInTokens = this.web3Config.fromWei(totalSupply);
            
            this.setCache(cacheKey, supplyInTokens);
            return supplyInTokens;
        } catch (error) {
            console.error('Error getting total supply:', error);
            throw error;
        }
    }

    async mintCarbonCredits(to, amount, projectId, verificationHash) {
        try {
            const contract = this.web3Config.contracts.carbonCreditToken;
            const amountInWei = this.web3Config.toWei(amount);
            
            const tx = await this.web3Config.sendTransaction(
                contract,
                'mintCredits',
                [to, amountInWei, projectId, verificationHash]
            );

            // Clear relevant caches
            this.cache.delete(`balance_${to}`);
            this.cache.delete('total_supply');

            return tx;
        } catch (error) {
            console.error('Error minting carbon credits:', error);
            throw error;
        }
    }

    async retireCredits(amount, reason) {
        try {
            const contract = this.web3Config.contracts.carbonCreditToken;
            const amountInWei = this.web3Config.toWei(amount);
            
            const tx = await this.web3Config.sendTransaction(
                contract,
                'retireCredits',
                [amountInWei, reason]
            );

            // Clear relevant caches
            this.cache.delete(`balance_${this.web3Config.currentAccount}`);
            this.cache.delete('total_supply');

            return tx;
        } catch (error) {
            console.error('Error retiring credits:', error);
            throw error;
        }
    }

    async getUserCreditBatches(address) {
        try {
            const cacheKey = `credit_batches_${address}`;
            const cached = this.getCache(cacheKey);
            if (cached !== null) return cached;

            const contract = this.web3Config.contracts.carbonCreditToken;
            const batchIds = await contract.methods.getUserCreditBatches(address).call();
            
            const batches = await Promise.all(
                batchIds.map(async (batchId) => {
                    const batch = await contract.methods.getCreditBatch(batchId).call();
                    return {
                        id: batchId,
                        projectId: batch.projectId,
                        amount: this.web3Config.fromWei(batch.amount),
                        mintedAt: new Date(batch.mintedAt * 1000),
                        verificationHash: batch.verificationHash,
                        retired: batch.retired
                    };
                })
            );

            this.setCache(cacheKey, batches);
            return batches;
        } catch (error) {
            console.error('Error getting user credit batches:', error);
            throw error;
        }
    }

    // Blue Carbon Registry Methods
    async registerProject(projectData) {
        try {
            const contract = this.web3Config.contracts.blueCarbonRegistry;
            const { name, location, area, ecosystemType, documentHashes, estimatedCredits } = projectData;
            
            // Convert ecosystem type to enum value
            const ecosystemTypeEnum = this.getEcosystemTypeEnum(ecosystemType);
            
            const tx = await this.web3Config.sendTransaction(
                contract,
                'registerProject',
                [name, location, area, ecosystemTypeEnum, documentHashes, estimatedCredits]
            );

            // Clear project-related caches
            this.cache.delete('registry_statistics');
            this.cache.delete(`stakeholder_projects_${this.web3Config.currentAccount}`);

            return tx;
        } catch (error) {
            console.error('Error registering project:', error);
            throw error;
        }
    }

    async registerStakeholder(stakeholderData) {
        try {
            const contract = this.web3Config.contracts.blueCarbonRegistry;
            const { name, organization, stakeholderType, location } = stakeholderData;
            
            // Convert stakeholder type to enum value
            const stakeholderTypeEnum = this.getStakeholderTypeEnum(stakeholderType);
            
            const tx = await this.web3Config.sendTransaction(
                contract,
                'registerStakeholder',
                [name, organization, stakeholderTypeEnum, location]
            );

            return tx;
        } catch (error) {
            console.error('Error registering stakeholder:', error);
            throw error;
        }
    }

    async approveStakeholder(stakeholderAddress) {
        try {
            const contract = this.web3Config.contracts.blueCarbonRegistry;
            
            const tx = await this.web3Config.sendTransaction(
                contract,
                'approveStakeholder',
                [stakeholderAddress]
            );

            // Clear stakeholder cache
            this.cache.delete(`stakeholder_${stakeholderAddress}`);

            return tx;
        } catch (error) {
            console.error('Error approving stakeholder:', error);
            throw error;
        }
    }

    async submitMRVData(mrvData) {
        try {
            const contract = this.web3Config.contracts.blueCarbonRegistry;
            const { projectId, dataHash, coordinates, carbonSequestration } = mrvData;
            
            const tx = await this.web3Config.sendTransaction(
                contract,
                'submitMRVData',
                [projectId, dataHash, coordinates, carbonSequestration]
            );

            // Clear project MRV data cache
            this.cache.delete(`project_mrv_${projectId}`);
            this.cache.delete('registry_statistics');

            return tx;
        } catch (error) {
            console.error('Error submitting MRV data:', error);
            throw error;
        }
    }

    async verifyMRVData(dataId) {
        try {
            const contract = this.web3Config.contracts.blueCarbonRegistry;
            
            const tx = await this.web3Config.sendTransaction(
                contract,
                'verifyMRVData',
                [dataId]
            );

            // Clear relevant caches
            this.cache.delete('registry_statistics');

            return tx;
        } catch (error) {
            console.error('Error verifying MRV data:', error);
            throw error;
        }
    }

    async verifyProject(projectId) {
        try {
            const contract = this.web3Config.contracts.blueCarbonRegistry;
            
            const tx = await this.web3Config.sendTransaction(
                contract,
                'verifyProject',
                [projectId]
            );

            // Clear project and statistics caches
            this.cache.delete(`project_${projectId}`);
            this.cache.delete('registry_statistics');

            return tx;
        } catch (error) {
            console.error('Error verifying project:', error);
            throw error;
        }
    }

    async getProject(projectId) {
        try {
            const cacheKey = `project_${projectId}`;
            const cached = this.getCache(cacheKey);
            if (cached !== null) return cached;

            const contract = this.web3Config.contracts.blueCarbonRegistry;
            const project = await contract.methods.getProject(projectId).call();
            
            const formattedProject = {
                id: project.id,
                name: project.name,
                location: project.location,
                area: project.area,
                ecosystemType: this.getEcosystemTypeName(project.ecosystemType),
                owner: project.owner,
                status: this.getProjectStatusName(project.status),
                createdAt: new Date(project.createdAt * 1000),
                verifiedAt: project.verifiedAt > 0 ? new Date(project.verifiedAt * 1000) : null,
                documentHashes: project.documentHashes,
                estimatedCredits: project.estimatedCredits,
                actualCredits: project.actualCredits
            };

            this.setCache(cacheKey, formattedProject);
            return formattedProject;
        } catch (error) {
            console.error('Error getting project:', error);
            throw error;
        }
    }

    async getStakeholder(address) {
        try {
            const cacheKey = `stakeholder_${address}`;
            const cached = this.getCache(cacheKey);
            if (cached !== null) return cached;

            const contract = this.web3Config.contracts.blueCarbonRegistry;
            const stakeholder = await contract.methods.getStakeholder(address).call();
            
            const formattedStakeholder = {
                address: stakeholder.stakeholderAddress,
                name: stakeholder.name,
                organization: stakeholder.organization,
                type: this.getStakeholderTypeName(stakeholder.stakeholderType),
                location: stakeholder.location,
                approved: stakeholder.approved,
                registeredAt: new Date(stakeholder.registeredAt * 1000),
                projectIds: stakeholder.projectIds
            };

            this.setCache(cacheKey, formattedStakeholder);
            return formattedStakeholder;
        } catch (error) {
            console.error('Error getting stakeholder:', error);
            throw error;
        }
    }

    async getProjectMRVData(projectId) {
        try {
            const cacheKey = `project_mrv_${projectId}`;
            const cached = this.getCache(cacheKey);
            if (cached !== null) return cached;

            const contract = this.web3Config.contracts.blueCarbonRegistry;
            const mrvDataArray = await contract.methods.getProjectMRVData(projectId).call();
            
            const formattedMRVData = mrvDataArray.map(data => ({
                projectId: data.projectId,
                collector: data.collector,
                timestamp: new Date(data.timestamp * 1000),
                dataHash: data.dataHash,
                coordinates: data.coordinates,
                carbonSequestration: data.carbonSequestration,
                verified: data.verified,
                verifier: data.verifier,
                verifiedAt: data.verifiedAt > 0 ? new Date(data.verifiedAt * 1000) : null
            }));

            this.setCache(cacheKey, formattedMRVData);
            return formattedMRVData;
        } catch (error) {
            console.error('Error getting project MRV data:', error);
            throw error;
        }
    }

    async getStakeholderProjects(address) {
        try {
            const cacheKey = `stakeholder_projects_${address}`;
            const cached = this.getCache(cacheKey);
            if (cached !== null) return cached;

            const stakeholder = await this.getStakeholder(address);
            const projects = await Promise.all(
                stakeholder.projectIds.map(projectId => this.getProject(projectId))
            );

            this.setCache(cacheKey, projects);
            return projects;
        } catch (error) {
            console.error('Error getting stakeholder projects:', error);
            throw error;
        }
    }

    async getRegistryStatistics() {
        try {
            const cacheKey = 'registry_statistics';
            const cached = this.getCache(cacheKey);
            if (cached !== null) return cached;

            const contract = this.web3Config.contracts.blueCarbonRegistry;
            const stats = await contract.methods.getRegistryStatistics().call();
            
            const formattedStats = {
                totalProjects: parseInt(stats._totalProjects),
                totalVerifiedProjects: parseInt(stats._totalVerifiedProjects),
                totalCarbonSequestered: parseInt(stats._totalCarbonSequestered),
                totalStakeholders: parseInt(stats._totalStakeholders)
            };

            this.setCache(cacheKey, formattedStats);
            return formattedStats;
        } catch (error) {
            console.error('Error getting registry statistics:', error);
            throw error;
        }
    }

    // Event listening methods
    async subscribeToEvents(eventName, contract, callback, fromBlock = 'latest') {
        try {
            const contractInstance = this.web3Config.contracts[contract];
            
            const subscription = contractInstance.events[eventName]({
                fromBlock: fromBlock
            });

            subscription.on('data', callback);
            subscription.on('error', (error) => {
                console.error(`Error in ${eventName} event subscription:`, error);
            });

            return subscription;
        } catch (error) {
            console.error('Error subscribing to events:', error);
            throw error;
        }
    }

    async getPastEvents(eventName, contract, fromBlock = 0, toBlock = 'latest') {
        try {
            const contractInstance = this.web3Config.contracts[contract];
            
            const events = await contractInstance.getPastEvents(eventName, {
                fromBlock: fromBlock,
                toBlock: toBlock
            });

            return events.map(event => ({
                ...event,
                timestamp: new Date(event.blockNumber * 1000) // Approximate timestamp
            }));
        } catch (error) {
            console.error('Error getting past events:', error);
            throw error;
        }
    }

    // Utility methods for enum conversions
    getEcosystemTypeEnum(typeName) {
        const types = {
            'mangrove': 0,
            'seagrass': 1,
            'saltmarsh': 2,
            'tidalmarsh': 3
        };
        return types[typeName.toLowerCase()] ?? 0;
    }

    getEcosystemTypeName(typeEnum) {
        const names = ['Mangrove', 'Seagrass', 'Salt Marsh', 'Tidal Marsh'];
        return names[parseInt(typeEnum)] || 'Unknown';
    }

    getStakeholderTypeEnum(typeName) {
        const types = {
            'ngo': 0,
            'community': 1,
            'panchayat': 2,
            'researcher': 3,
            'government': 4
        };
        return types[typeName.toLowerCase()] ?? 0;
    }

    getStakeholderTypeName(typeEnum) {
        const names = ['NGO', 'Community', 'Panchayat', 'Researcher', 'Government'];
        return names[parseInt(typeEnum)] || 'Unknown';
    }

    getProjectStatusName(statusEnum) {
        const statuses = ['Pending', 'Active', 'Verified', 'Suspended'];
        return statuses[parseInt(statusEnum)] || 'Unknown';
    }

    // IPFS integration for document storage
    async uploadToIPFS(data) {
        try {
            // This would integrate with an IPFS service
            // For now, return a mock hash
            const mockHash = 'Qm' + Math.random().toString(36).substring(2, 46);
            console.log('Mock IPFS upload:', mockHash);
            return mockHash;
        } catch (error) {
            console.error('Error uploading to IPFS:', error);
            throw error;
        }
    }

    async getFromIPFS(hash) {
        try {
            // This would retrieve from IPFS
            // For now, return mock data
            console.log('Mock IPFS retrieval for hash:', hash);
            return { data: 'Mock IPFS data' };
        } catch (error) {
            console.error('Error retrieving from IPFS:', error);
            throw error;
        }
    }

    // Utility method to validate transaction hash
    isValidTransactionHash(hash) {
        return /^0x[a-fA-F0-9]{64}$/.test(hash);
    }

    // Get transaction details
    async getTransactionDetails(txHash) {
        try {
            if (!this.isValidTransactionHash(txHash)) {
                throw new Error('Invalid transaction hash');
            }

            const [transaction, receipt] = await Promise.all([
                this.web3Config.web3.eth.getTransaction(txHash),
                this.web3Config.web3.eth.getTransactionReceipt(txHash)
            ]);

            return {
                transaction,
                receipt,
                status: receipt.status ? 'Success' : 'Failed',
                gasUsed: receipt.gasUsed,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error getting transaction details:', error);
            throw error;
        }
    }

    // Clear all caches
    clearCache() {
        this.cache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export for browser and Node.js
if (typeof window !== 'undefined') {
    window.BlockchainAPI = BlockchainAPI;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockchainAPI;
}
