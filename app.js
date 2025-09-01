// Global variables
let web3;
let currentAccount;
let carbonCreditContract;
let registryContract;

// Contract addresses (these would be deployed contract addresses)
const CARBON_CREDIT_ADDRESS = "0x1234567890123456789012345678901234567890";
const REGISTRY_ADDRESS = "0x0987654321098765432109876543210987654321";

// Initialize the application
async function initApp() {
    await initWeb3();
    setupEventListeners();
    await loadDashboardData();
}

// Initialize Web3 connection
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            currentAccount = accounts[0];
            updateWalletDisplay();
            
            // Initialize contracts
            await initContracts();
        } catch (error) {
            console.error('User denied account access:', error);
            showNotification('Please connect your wallet to continue', 'error');
        }
    } else {
        showNotification('MetaMask is not installed. Please install MetaMask to use this application.', 'error');
    }
}

// Initialize smart contracts
async function initContracts() {
    try {
        // Carbon Credit Token Contract ABI (simplified)
        const carbonCreditABI = [
            {
                "inputs": [{"name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            },
            {
                "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
                "name": "mint",
                "outputs": [],
                "type": "function"
            }
        ];

        // Registry Contract ABI (simplified)
        const registryABI = [
            {
                "inputs": [],
                "name": "getProjectCount",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            },
            {
                "inputs": [{"name": "projectId", "type": "uint256"}],
                "name": "getProject",
                "outputs": [{"name": "", "type": "tuple", "components": [
                    {"name": "name", "type": "string"},
                    {"name": "location", "type": "string"},
                    {"name": "area", "type": "uint256"},
                    {"name": "ecosystemType", "type": "string"},
                    {"name": "verified", "type": "bool"}
                ]}],
                "type": "function"
            },
            {
                "inputs": [{"name": "name", "type": "string"}, {"name": "location", "type": "string"}, {"name": "area", "type": "uint256"}, {"name": "ecosystemType", "type": "string"}],
                "name": "addProject",
                "outputs": [],
                "type": "function"
            }
        ];

        carbonCreditContract = new web3.eth.Contract(carbonCreditABI, CARBON_CREDIT_ADDRESS);
        registryContract = new web3.eth.Contract(registryABI, REGISTRY_ADDRESS);
    } catch (error) {
        console.error('Error initializing contracts:', error);
        showNotification('Error connecting to blockchain contracts', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Connect wallet button
    document.getElementById('connectWallet').addEventListener('click', initWeb3);

    // Add project button and modal
    document.getElementById('addProject').addEventListener('click', () => {
        document.getElementById('addProjectModal').classList.remove('hidden');
    });

    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);

    // Project form submission
    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmission);

    // Mint credits button
    document.getElementById('mintCredits').addEventListener('click', mintCarbonCredits);

    // Verify projects button
    document.getElementById('verifyProjects').addEventListener('click', showVerificationPanel);

    // Close modal when clicking outside
    document.getElementById('addProjectModal').addEventListener('click', (e) => {
        if (e.target.id === 'addProjectModal') {
            closeModal();
        }
    });
}

// Update wallet display
function updateWalletDisplay() {
    if (currentAccount) {
        const walletDisplay = document.getElementById('walletAddress');
        walletDisplay.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
        walletDisplay.classList.remove('hidden');
        
        const connectButton = document.getElementById('connectWallet');
        connectButton.textContent = 'Connected';
        connectButton.disabled = true;
        connectButton.classList.add('bg-green-600', 'cursor-not-allowed');
        connectButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadCarbonCreditBalance(),
            loadRegistryStatistics(),
            loadProjectsList()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load carbon credit balance
async function loadCarbonCreditBalance() {
    try {
        if (carbonCreditContract && currentAccount) {
            const balance = await carbonCreditContract.methods.balanceOf(currentAccount).call();
            const balanceInTokens = web3.utils.fromWei(balance, 'ether');
            document.getElementById('creditBalance').textContent = `${balanceInTokens} BCT`;
        }
    } catch (error) {
        console.error('Error loading credit balance:', error);
        document.getElementById('creditBalance').textContent = '0 BCT';
    }
}

// Load registry statistics
async function loadRegistryStatistics() {
    try {
        if (registryContract) {
            const projectCount = await registryContract.methods.getProjectCount().call();
            document.getElementById('totalProjects').textContent = projectCount;
            
            // These would be calculated from contract data
            document.getElementById('verifiedCredits').textContent = Math.floor(projectCount * 150); // Example calculation
            document.getElementById('activeStakeholders').textContent = Math.floor(projectCount * 3); // Example calculation
        }
    } catch (error) {
        console.error('Error loading registry statistics:', error);
        // Set default values
        document.getElementById('totalProjects').textContent = '0';
        document.getElementById('verifiedCredits').textContent = '0';
        document.getElementById('activeStakeholders').textContent = '0';
    }
}

// Load projects list
async function loadProjectsList() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '<div class="text-center text-gray-500 py-8">Loading projects...</div>';

    try {
        if (registryContract) {
            const projectCount = await registryContract.methods.getProjectCount().call();
            
            if (projectCount == 0) {
                projectsList.innerHTML = '<div class="text-center text-gray-500 py-8">No projects registered yet. Add the first project to get started.</div>';
                return;
            }

            let projectsHTML = '';
            for (let i = 0; i < projectCount; i++) {
                try {
                    const project = await registryContract.methods.getProject(i).call();
                    projectsHTML += createProjectCard(project, i);
                } catch (error) {
                    console.error(`Error loading project ${i}:`, error);
                }
            }
            
            projectsList.innerHTML = projectsHTML || '<div class="text-center text-gray-500 py-8">No projects available.</div>';
        } else {
            projectsList.innerHTML = '<div class="text-center text-gray-500 py-8">Connect wallet to view projects.</div>';
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsList.innerHTML = '<div class="text-center text-red-500 py-8">Error loading projects. Please try again.</div>';
    }
}

// Create project card HTML
function createProjectCard(project, index) {
    const statusBadge = project.verified 
        ? '<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Verified</span>'
        : '<span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Pending</span>';

    return `
        <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
                <h4 class="text-lg font-semibold text-gray-900">${project.name}</h4>
                ${statusBadge}
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div><strong>Location:</strong> ${project.location}</div>
                <div><strong>Area:</strong> ${project.area} hectares</div>
                <div><strong>Ecosystem:</strong> ${project.ecosystemType}</div>
                <div><strong>Project ID:</strong> #${index}</div>
            </div>
            <div class="mt-4 flex space-x-2">
                <button onclick="viewProject(${index})" class="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors">
                    View Details
                </button>
                ${!project.verified ? `<button onclick="verifyProject(${index})" class="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors">Verify</button>` : ''}
            </div>
        </div>
    `;
}

// Handle project form submission
async function handleProjectSubmission(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('projectName').value,
        location: document.getElementById('projectLocation').value,
        area: document.getElementById('projectArea').value,
        ecosystemType: document.getElementById('ecosystemType').value
    };

    try {
        if (!registryContract || !currentAccount) {
            throw new Error('Wallet not connected');
        }

        showNotification('Adding project to blockchain...', 'info');
        
        // Add project to registry contract
        await registryContract.methods.addProject(
            formData.name,
            formData.location,
            parseInt(formData.area),
            formData.ecosystemType
        ).send({ from: currentAccount });

        showNotification('Project added successfully!', 'success');
        closeModal();
        document.getElementById('projectForm').reset();
        
        // Reload dashboard data
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error adding project:', error);
        showNotification('Error adding project: ' + error.message, 'error');
    }
}

// Mint carbon credits
async function mintCarbonCredits() {
    try {
        if (!carbonCreditContract || !currentAccount) {
            throw new Error('Wallet not connected');
        }

        const amount = web3.utils.toWei('100', 'ether'); // Mint 100 tokens
        
        showNotification('Minting carbon credits...', 'info');
        
        await carbonCreditContract.methods.mint(currentAccount, amount).send({ from: currentAccount });
        
        showNotification('Carbon credits minted successfully!', 'success');
        await loadCarbonCreditBalance();
        
    } catch (error) {
        console.error('Error minting credits:', error);
        showNotification('Error minting credits: ' + error.message, 'error');
    }
}

// View project details
function viewProject(projectId) {
    showNotification(`Viewing project #${projectId} details`, 'info');
    // This would open a detailed view modal
}

// Verify project
async function verifyProject(projectId) {
    try {
        showNotification(`Verifying project #${projectId}...`, 'info');
        
        // This would call a verification method on the contract
        // For now, we'll simulate the verification
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showNotification('Project verified successfully!', 'success');
        await loadProjectsList();
        
    } catch (error) {
        console.error('Error verifying project:', error);
        showNotification('Error verifying project: ' + error.message, 'error');
    }
}

// Show verification panel
function showVerificationPanel() {
    showNotification('Opening verification panel...', 'info');
    // This would show a panel with projects pending verification
}

// Close modal
function closeModal() {
    document.getElementById('addProjectModal').classList.add('hidden');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i data-feather="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    feather.replace();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            updateWalletDisplay();
            loadDashboardData();
        } else {
            currentAccount = null;
            location.reload();
        }
    });
}
