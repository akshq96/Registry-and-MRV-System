// Web3 Configuration and Utilities for Blue Carbon Registry

// Contract ABIs
const CARBON_CREDIT_TOKEN_ABI = [
    {
        "inputs": [{"name": "name", "type": "string"}, {"name": "symbol", "type": "string"}],
        "type": "constructor"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "projectId", "type": "uint256"},
            {"name": "verificationHash", "type": "string"}
        ],
        "name": "mintCredits",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "amount", "type": "uint256"}, {"name": "reason", "type": "string"}],
        "name": "retireCredits",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "projectId", "type": "uint256"}],
        "name": "verifyProject",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getUserCreditBatches",
        "outputs": [{"name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "batchId", "type": "uint256"}],
        "name": "getCreditBatch",
        "outputs": [
            {
                "components": [
                    {"name": "projectId", "type": "uint256"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "mintedAt", "type": "uint256"},
                    {"name": "verificationHash", "type": "string"},
                    {"name": "retired", "type": "bool"}
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "to", "type": "address"},
            {"indexed": false, "name": "amount", "type": "uint256"},
            {"indexed": false, "name": "projectId", "type": "uint256"},
            {"indexed": false, "name": "reason", "type": "string"}
        ],
        "name": "CreditsMinted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "from", "type": "address"},
            {"indexed": false, "name": "amount", "type": "uint256"},
            {"indexed": false, "name": "reason", "type": "string"}
        ],
        "name": "CreditsRetired",
        "type": "event"
    }
];

const BLUE_CARBON_REGISTRY_ABI = [
    {
        "inputs": [],
        "type": "constructor"
    },
    {
        "inputs": [
            {"name": "name", "type": "string"},
            {"name": "location", "type": "string"},
            {"name": "area", "type": "uint256"},
            {"name": "ecosystemType", "type": "uint8"},
            {"name": "documentHashes", "type": "string[]"},
            {"name": "estimatedCredits", "type": "uint256"}
        ],
        "name": "registerProject",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "name", "type": "string"},
            {"name": "organization", "type": "string"},
            {"name": "stakeholderType", "type": "uint8"},
            {"name": "location", "type": "string"}
        ],
        "name": "registerStakeholder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "stakeholder", "type": "address"}],
        "name": "approveStakeholder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "projectId", "type": "uint256"},
            {"name": "dataHash", "type": "string"},
            {"name": "coordinates", "type": "string"},
            {"name": "carbonSequestration", "type": "uint256"}
        ],
        "name": "submitMRVData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "dataId", "type": "uint256"}],
        "name": "verifyMRVData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "projectId", "type": "uint256"}],
        "name": "verifyProject",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "projectId", "type": "uint256"}],
        "name": "getProject",
        "outputs": [
            {
                "components": [
                    {"name": "id", "type": "uint256"},
                    {"name": "name", "type": "string"},
                    {"name": "location", "type": "string"},
                    {"name": "area", "type": "uint256"},
                    {"name": "ecosystemType", "type": "uint8"},
                    {"name": "owner", "type": "address"},
                    {"name": "status", "type": "uint8"},
                    {"name": "createdAt", "type": "uint256"},
                    {"name": "verifiedAt", "type": "uint256"},
                    {"name": "documentHashes", "type": "string[]"},
                    {"name": "estimatedCredits", "type": "uint256"},
                    {"name": "actualCredits", "type": "uint256"}
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "stakeholderAddress", "type": "address"}],
        "name": "getStakeholder",
        "outputs": [
            {
                "components": [
                    {"name": "stakeholderAddress", "type": "address"},
                    {"name": "name", "type": "string"},
                    {"name": "organization", "type": "string"},
                    {"name": "stakeholderType", "type": "uint8"},
                    {"name": "location", "type": "string"},
                    {"name": "approved", "type": "bool"},
                    {"name": "registeredAt", "type": "uint256"},
                    {"name": "projectIds", "type": "uint256[]"}
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "projectId", "type": "uint256"}],
        "name": "getProjectMRVData",
        "outputs": [
            {
                "components": [
                    {"name": "projectId", "type": "uint256"},
                    {"name": "collector", "type": "address"},
                    {"name": "timestamp", "type": "uint256"},
                    {"name": "dataHash", "type": "string"},
                    {"name": "coordinates", "type": "string"},
                    {"name": "carbonSequestration", "type": "uint256"},
                    {"name": "verified", "type": "bool"},
                    {"name": "verifier", "type": "address"},
                    {"name": "verifiedAt", "type": "uint256"}
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getRegistryStatistics",
        "outputs": [
            {"name": "_totalProjects", "type": "uint256"},
            {"name": "_totalVerifiedProjects", "type": "uint256"},
            {"name": "_totalCarbonSequestered", "type": "uint256"},
            {"name": "_totalStakeholders", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "projectId", "type": "uint256"},
            {"indexed": true, "name": "owner", "type": "address"},
            {"indexed": false, "name": "name", "type": "string"}
        ],
        "name": "ProjectRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "projectId", "type": "uint256"},
            {"indexed": true, "name": "verifier", "type": "address"}
        ],
        "name": "ProjectVerified",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "stakeholder", "type": "address"},
            {"indexed": false, "name": "stakeholderType", "type": "uint8"}
        ],
        "name": "StakeholderRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "projectId", "type": "uint256"},
            {"indexed": true, "name": "dataId", "type": "uint256"},
            {"indexed": true, "name": "collector", "type": "address"}
        ],
        "name": "MRVDataSubmitted",
        "type": "event"
    }
];

// Network configurations
const NETWORK_CONFIGS = {
    mainnet: {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/' + (process.env.INFURA_PROJECT_ID || 'your_infura_key'),
        blockExplorer: 'https://etherscan.io'
    },
    polygon: {
        chainId: '0x89',
        name: 'Polygon Mainnet',
        rpcUrl: 'https://polygon-rpc.com',
        blockExplorer: 'https://polygonscan.com'
    },
    mumbai: {
        chainId: '0x13881',
        name: 'Mumbai Testnet',
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        blockExplorer: 'https://mumbai.polygonscan.com'
    },
    sepolia: {
        chainId: '0xaa36a7',
        name: 'Sepolia Testnet',
        rpcUrl: 'https://sepolia.infura.io/v3/' + (process.env.INFURA_PROJECT_ID || 'your_infura_key'),
        blockExplorer: 'https://sepolia.etherscan.io'
    }
};

// Default contract addresses (these would be replaced with actual deployed addresses)
const CONTRACT_ADDRESSES = {
    carbonCreditToken: process.env.CARBON_CREDIT_TOKEN_ADDRESS || '0x1234567890123456789012345678901234567890',
    blueCarbonRegistry: process.env.BLUE_CARBON_REGISTRY_ADDRESS || '0x0987654321098765432109876543210987654321'
};

// Web3 Configuration Class
class Web3Config {
    constructor() {
        this.web3 = null;
        this.currentAccount = null;
        this.currentNetwork = null;
        this.contracts = {};
        this.eventListeners = [];
    }

    // Initialize Web3 connection
    async init() {
        try {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
                await this.connectWallet();
                await this.initializeContracts();
                this.setupEventListeners();
                return true;
            } else {
                throw new Error('MetaMask not detected');
            }
        } catch (error) {
            console.error('Web3 initialization failed:', error);
            return false;
        }
    }

    // Connect to MetaMask wallet
    async connectWallet() {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                this.currentAccount = accounts[0];
                await this.updateNetwork();
                return this.currentAccount;
            } else {
                throw new Error('No accounts found');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }

    // Update current network information
    async updateNetwork() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            this.currentNetwork = chainId;
            
            // Check if we're on a supported network
            const supportedNetworks = Object.values(NETWORK_CONFIGS).map(config => config.chainId);
            if (!supportedNetworks.includes(chainId)) {
                console.warn('Unsupported network detected:', chainId);
            }
            
            return chainId;
        } catch (error) {
            console.error('Failed to get network:', error);
            throw error;
        }
    }

    // Initialize smart contracts
    async initializeContracts() {
        try {
            this.contracts.carbonCreditToken = new this.web3.eth.Contract(
                CARBON_CREDIT_TOKEN_ABI,
                CONTRACT_ADDRESSES.carbonCreditToken
            );

            this.contracts.blueCarbonRegistry = new this.web3.eth.Contract(
                BLUE_CARBON_REGISTRY_ABI,
                CONTRACT_ADDRESSES.blueCarbonRegistry
            );

            console.log('Contracts initialized successfully');
            return this.contracts;
        } catch (error) {
            console.error('Contract initialization failed:', error);
            throw error;
        }
    }

    // Setup event listeners for account and network changes
    setupEventListeners() {
        if (window.ethereum) {
            // Account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.emit('accountChanged', accounts[0]);
                } else {
                    this.currentAccount = null;
                    this.emit('disconnected');
                }
            });

            // Network changes
            window.ethereum.on('chainChanged', (chainId) => {
                this.currentNetwork = chainId;
                this.emit('networkChanged', chainId);
                // Reload the page to reset app state
                window.location.reload();
            });

            // Connection
            window.ethereum.on('connect', (connectInfo) => {
                this.emit('connected', connectInfo);
            });

            // Disconnection
            window.ethereum.on('disconnect', (error) => {
                this.currentAccount = null;
                this.emit('disconnected', error);
            });
        }
    }

    // Event emitter for custom events
    on(event, callback) {
        this.eventListeners.push({ event, callback });
    }

    emit(event, data) {
        this.eventListeners
            .filter(listener => listener.event === event)
            .forEach(listener => listener.callback(data));
    }

    // Switch to a specific network
    async switchNetwork(networkName) {
        const networkConfig = NETWORK_CONFIGS[networkName];
        if (!networkConfig) {
            throw new Error(`Unsupported network: ${networkName}`);
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: networkConfig.chainId }]
            });
        } catch (switchError) {
            // If the network isn't added to MetaMask, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: networkConfig.chainId,
                            chainName: networkConfig.name,
                            rpcUrls: [networkConfig.rpcUrl],
                            blockExplorerUrls: [networkConfig.blockExplorer]
                        }]
                    });
                } catch (addError) {
                    throw new Error(`Failed to add network: ${addError.message}`);
                }
            } else {
                throw new Error(`Failed to switch network: ${switchError.message}`);
            }
        }
    }

    // Utility functions
    toWei(amount, unit = 'ether') {
        return this.web3.utils.toWei(amount.toString(), unit);
    }

    fromWei(amount, unit = 'ether') {
        return this.web3.utils.fromWei(amount.toString(), unit);
    }

    isAddress(address) {
        return this.web3.utils.isAddress(address);
    }

    // Gas estimation
    async estimateGas(contract, method, params, from) {
        try {
            const gasEstimate = await contract.methods[method](...params).estimateGas({ from });
            return Math.floor(gasEstimate * 1.2); // Add 20% buffer
        } catch (error) {
            console.error('Gas estimation failed:', error);
            return 500000; // Default gas limit
        }
    }

    // Transaction helpers
    async sendTransaction(contract, method, params, options = {}) {
        try {
            const defaultOptions = {
                from: this.currentAccount,
                gas: await this.estimateGas(contract, method, params, this.currentAccount)
            };

            const txOptions = { ...defaultOptions, ...options };
            
            return await contract.methods[method](...params).send(txOptions);
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    // Get transaction receipt with retry logic
    async getTransactionReceipt(txHash, maxRetries = 10) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const receipt = await this.web3.eth.getTransactionReceipt(txHash);
                if (receipt) {
                    return receipt;
                }
            } catch (error) {
                console.warn(`Retry ${i + 1}: Failed to get transaction receipt:`, error);
            }
            
            // Wait 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        throw new Error('Failed to get transaction receipt after retries');
    }

    // Format address for display
    formatAddress(address) {
        if (!address || !this.isAddress(address)) {
            return 'Invalid Address';
        }
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }

    // Get current gas price
    async getGasPrice() {
        try {
            return await this.web3.eth.getGasPrice();
        } catch (error) {
            console.error('Failed to get gas price:', error);
            return this.toWei('20', 'gwei'); // Default to 20 gwei
        }
    }

    // Check if user has sufficient balance for transaction
    async checkSufficientBalance(amount) {
        try {
            const balance = await this.web3.eth.getBalance(this.currentAccount);
            return this.web3.utils.toBN(balance).gte(this.web3.utils.toBN(amount));
        } catch (error) {
            console.error('Failed to check balance:', error);
            return false;
        }
    }
}

// Export configuration
window.Web3Config = Web3Config;
window.CARBON_CREDIT_TOKEN_ABI = CARBON_CREDIT_TOKEN_ABI;
window.BLUE_CARBON_REGISTRY_ABI = BLUE_CARBON_REGISTRY_ABI;
window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
window.NETWORK_CONFIGS = NETWORK_CONFIGS;

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Web3Config,
        CARBON_CREDIT_TOKEN_ABI,
        BLUE_CARBON_REGISTRY_ABI,
        CONTRACT_ADDRESSES,
        NETWORK_CONFIGS
    };
}
