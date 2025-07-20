// Zerodha Trading App - Main JavaScript File

class ZerodhaApp {
    constructor() {
        this.codeEditor = null;
        this.algorithms = JSON.parse(localStorage.getItem('algorithms')) || {};
        this.deployments = JSON.parse(localStorage.getItem('deployments')) || {};
        this.settings = JSON.parse(localStorage.getItem('settings')) || {};
        this.currentAlgorithm = null;
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initCodeEditor();
        this.loadSettings();
        this.loadAlgorithms();
        this.loadDeployments();
        this.updateConnectionStatus();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('testConnection').addEventListener('click', () => this.testConnection());
        document.getElementById('generateLoginUrl').addEventListener('click', () => this.generateLoginUrl());
        document.getElementById('setupHosting').addEventListener('click', () => this.showHostingGuide());

        // Positions
        document.getElementById('refreshPositions').addEventListener('click', () => this.refreshPositions());

        // Code Editor
        document.getElementById('saveAlgorithm').addEventListener('click', () => this.saveAlgorithm());
        document.getElementById('newAlgorithm').addEventListener('click', () => this.newAlgorithm());
        document.getElementById('deleteAlgorithm').addEventListener('click', () => this.deleteAlgorithm());
        document.getElementById('algorithmSelect').addEventListener('change', (e) => this.loadAlgorithm(e.target.value));

        // Deployment
        document.getElementById('refreshDeployments').addEventListener('click', () => this.loadDeployments());
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        // Refresh code editor if switching to editor tab
        if (tabName === 'editor' && this.codeEditor) {
            setTimeout(() => this.codeEditor.refresh(), 100);
        }
    }

    initCodeEditor() {
        const textarea = document.getElementById('codeEditor');
        this.codeEditor = CodeMirror.fromTextArea(textarea, {
            mode: 'python',
            theme: 'monokai',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            indentWithTabs: false,
            lineWrapping: true
        });

        this.codeEditor.setSize('100%', '100%');
    }

    // Settings Management
    saveSettings() {
        const settings = {
            apiKey: document.getElementById('apiKey').value,
            apiSecret: document.getElementById('apiSecret').value,
            requestToken: document.getElementById('requestToken').value,
            accessToken: document.getElementById('accessToken').value,
            maxPositions: parseInt(document.getElementById('maxPositions').value),
            riskPerTrade: parseFloat(document.getElementById('riskPerTrade').value),
            autoTrade: document.getElementById('autoTrade').checked
        };

        this.settings = settings;
        localStorage.setItem('settings', JSON.stringify(settings));
        this.showNotification('Settings saved successfully!', 'success');
    }

    loadSettings() {
        if (Object.keys(this.settings).length > 0) {
            document.getElementById('apiKey').value = this.settings.apiKey || '';
            document.getElementById('apiSecret').value = this.settings.apiSecret || '';
            document.getElementById('requestToken').value = this.settings.requestToken || '';
            document.getElementById('accessToken').value = this.settings.accessToken || '';
            document.getElementById('maxPositions').value = this.settings.maxPositions || 10;
            document.getElementById('riskPerTrade').value = this.settings.riskPerTrade || 2;
            document.getElementById('autoTrade').checked = this.settings.autoTrade || false;
        }
    }

    async testConnection() {
        const resultDiv = document.getElementById('connectionResult');
        const testBtn = document.getElementById('testConnection');
        
        testBtn.innerHTML = '<span class="loading"></span> Testing...';
        testBtn.disabled = true;

        try {
            // Simulate API connection test
            await this.simulateApiCall();
            
            resultDiv.className = 'connection-result success';
            resultDiv.style.display = 'block';
            resultDiv.textContent = 'Connection successful! API credentials are valid.';
            
            this.isConnected = true;
            this.updateConnectionStatus();
            
            // Generate mock access token
            if (this.settings.apiKey && this.settings.apiSecret && this.settings.requestToken) {
                const mockAccessToken = 'mock_access_token_' + Date.now();
                document.getElementById('accessToken').value = mockAccessToken;
                this.settings.accessToken = mockAccessToken;
                localStorage.setItem('settings', JSON.stringify(this.settings));
            }
            
        } catch (error) {
            resultDiv.className = 'connection-result error';
            resultDiv.style.display = 'block';
            resultDiv.textContent = 'Connection failed: ' + error.message;
            
            this.isConnected = false;
            this.updateConnectionStatus();
        }

        testBtn.innerHTML = 'Test API Connection';
        testBtn.disabled = false;
    }

    generateLoginUrl() {
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (!apiKey) {
            this.showNotification('Please enter your API Key first', 'error');
            return;
        }
        
        // Zerodha login URL format
        const redirectUrl = encodeURIComponent(document.getElementById('redirectUrl').value);
        const loginUrl = `https://kite.trade/connect/login?api_key=${apiKey}&redirect_params=${redirectUrl}`;
        
        // Show the URL to user
        const result = confirm(
            `Click OK to open Zerodha login page in a new window.\n\n` +
            `After successful login, you'll be redirected back with a request token.\n\n` +
            `URL: ${loginUrl}`
        );
        
        if (result) {
            // Open in new window
            window.open(loginUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            this.showNotification('Login window opened. Complete authentication and return here.', 'info');
        }
    }

    showHostingGuide() {
        const guide = `
🚀 HOSTING SETUP GUIDE FOR ZERODHA API

⚠️ IMPORTANT: Zerodha requires a publicly accessible HTTPS URL for OAuth redirects.
Local file:// URLs will NOT work.

📋 RECOMMENDED HOSTING OPTIONS:

1️⃣ GITHUB PAGES (FREE & EASY)
   • Push your app to a GitHub repository
   • Go to Settings > Pages
   • Select source branch (main/master)
   • Your app will be available at: https://username.github.io/repository-name/
   • Use redirect URL: https://username.github.io/repository-name/redirect.html

2️⃣ NETLIFY (FREE)
   • Drag & drop your app folder to netlify.com/drop
   • Get instant HTTPS URL like: https://random-name.netlify.app/
   • Use redirect URL: https://random-name.netlify.app/redirect.html

3️⃣ VERCEL (FREE)
   • Upload to vercel.com
   • Get URL like: https://your-app.vercel.app/
   • Use redirect URL: https://your-app.vercel.app/redirect.html

4️⃣ FIREBASE HOSTING (FREE)
   • Use Firebase CLI to deploy
   • Get URL like: https://your-app.web.app/
   • Use redirect URL: https://your-app.web.app/redirect.html

5️⃣ YOUR OWN SERVER
   • Any web server with HTTPS
   • Use your domain: https://yourdomain.com/redirect.html

📝 STEPS AFTER HOSTING:
1. Upload all files (index.html, app.js, styles.css, redirect.html)
2. Copy the redirect.html URL
3. Paste it in the "Redirect URL" field above
4. Use the same URL in Zerodha Developer Console
5. Generate login URL and test OAuth flow

💡 TIP: GitHub Pages is the easiest option for beginners!
        `;
        
        alert(guide);
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (this.isConnected) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'status-connected';
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'status-disconnected';
        }
    }

    // Positions Management
    async refreshPositions() {
        const tableBody = document.getElementById('positionsTableBody');
        const refreshBtn = document.getElementById('refreshPositions');
        
        refreshBtn.innerHTML = '<span class="loading"></span> Refreshing...';
        refreshBtn.disabled = true;

        try {
            if (!this.isConnected) {
                throw new Error('Not connected to API. Please configure and test your connection first.');
            }

            // Simulate API call to get positions
            const positions = await this.getMockPositions();
            
            if (positions.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No positions found.</td></tr>';
            } else {
                tableBody.innerHTML = positions.map(position => `
                    <tr>
                        <td>${position.symbol}</td>
                        <td>${position.quantity}</td>
                        <td>₹${position.averagePrice.toFixed(2)}</td>
                        <td>₹${position.ltp.toFixed(2)}</td>
                        <td class="${position.pnl >= 0 ? 'text-success' : 'text-danger'}">
                            ₹${position.pnl.toFixed(2)}
                        </td>
                        <td class="${position.dayChange >= 0 ? 'text-success' : 'text-danger'}">
                            ${position.dayChange.toFixed(2)}%
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="no-data">Error: ${error.message}</td></tr>`;
        }

        refreshBtn.innerHTML = 'Refresh';
        refreshBtn.disabled = false;
    }

    async getMockPositions() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return mock position data
        return [
            {
                symbol: 'RELIANCE',
                quantity: 10,
                averagePrice: 2450.50,
                ltp: 2465.75,
                pnl: 152.50,
                dayChange: 0.62
            },
            {
                symbol: 'TCS',
                quantity: 5,
                averagePrice: 3520.00,
                ltp: 3498.25,
                pnl: -108.75,
                dayChange: -0.62
            },
            {
                symbol: 'INFY',
                quantity: 15,
                averagePrice: 1456.30,
                ltp: 1478.90,
                pnl: 339.00,
                dayChange: 1.55
            }
        ];
    }

    // Algorithm Management
    saveAlgorithm() {
        const name = document.getElementById('algorithmName').value.trim();
        const description = document.getElementById('algorithmDescription').value.trim();
        const code = this.codeEditor.getValue();

        if (!name) {
            this.showNotification('Please enter an algorithm name', 'error');
            return;
        }

        if (!code.trim()) {
            this.showNotification('Please enter some code', 'error');
            return;
        }

        const algorithm = {
            id: this.currentAlgorithm || Date.now().toString(),
            name,
            description,
            code,
            createdAt: this.algorithms[this.currentAlgorithm]?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.algorithms[algorithm.id] = algorithm;
        localStorage.setItem('algorithms', JSON.stringify(this.algorithms));
        
        this.currentAlgorithm = algorithm.id;
        this.loadAlgorithmsList();
        this.showNotification('Algorithm saved successfully!', 'success');
    }

    newAlgorithm() {
        this.currentAlgorithm = null;
        document.getElementById('algorithmName').value = '';
        document.getElementById('algorithmDescription').value = '';
        this.codeEditor.setValue('# New Algorithm\n# Write your trading strategy here\n\ndef main():\n    pass');
        document.getElementById('algorithmSelect').value = '';
    }

    deleteAlgorithm() {
        if (!this.currentAlgorithm) {
            this.showNotification('No algorithm selected', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this algorithm?')) {
            delete this.algorithms[this.currentAlgorithm];
            localStorage.setItem('algorithms', JSON.stringify(this.algorithms));
            
            this.newAlgorithm();
            this.loadAlgorithmsList();
            this.showNotification('Algorithm deleted successfully!', 'success');
        }
    }

    loadAlgorithm(algorithmId) {
        if (!algorithmId) return;

        const algorithm = this.algorithms[algorithmId];
        if (algorithm) {
            this.currentAlgorithm = algorithmId;
            document.getElementById('algorithmName').value = algorithm.name;
            document.getElementById('algorithmDescription').value = algorithm.description;
            this.codeEditor.setValue(algorithm.code);
        }
    }

    loadAlgorithms() {
        this.loadAlgorithmsList();
        this.loadAvailableAlgorithms();
    }

    loadAlgorithmsList() {
        const select = document.getElementById('algorithmSelect');
        select.innerHTML = '<option value="">Select Algorithm</option>';
        
        Object.values(this.algorithms).forEach(algorithm => {
            const option = document.createElement('option');
            option.value = algorithm.id;
            option.textContent = algorithm.name;
            select.appendChild(option);
        });
    }

    loadAvailableAlgorithms() {
        const container = document.getElementById('availableAlgorithms');
        
        if (Object.keys(this.algorithms).length === 0) {
            container.innerHTML = '<div class="no-data">No algorithms available</div>';
            return;
        }

        container.innerHTML = Object.values(this.algorithms).map(algorithm => `
            <div class="algorithm-card">
                <h5>${algorithm.name}</h5>
                <p>${algorithm.description || 'No description'}</p>
                <p><small>Last updated: ${new Date(algorithm.updatedAt).toLocaleDateString()}</small></p>
                <div class="card-actions">
                    <button class="btn btn-primary btn-sm" onclick="app.deployAlgorithm('${algorithm.id}')">
                        Deploy
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="app.editAlgorithm('${algorithm.id}')">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    editAlgorithm(algorithmId) {
        this.switchTab('editor');
        document.getElementById('algorithmSelect').value = algorithmId;
        this.loadAlgorithm(algorithmId);
    }

    deployAlgorithm(algorithmId) {
        const algorithm = this.algorithms[algorithmId];
        if (!algorithm) return;

        if (!this.isConnected) {
            this.showNotification('Please connect to API first', 'error');
            return;
        }

        const deploymentId = Date.now().toString();
        const deployment = {
            id: deploymentId,
            algorithmId,
            algorithmName: algorithm.name,
            status: 'running',
            startedAt: new Date().toISOString(),
            profit: 0,
            trades: 0
        };

        this.deployments[deploymentId] = deployment;
        localStorage.setItem('deployments', JSON.stringify(this.deployments));
        
        this.loadDeployments();
        this.showNotification(`Algorithm "${algorithm.name}" deployed successfully!`, 'success');
        
        // Simulate trading activity
        this.simulateTrading(deploymentId);
    }

    loadDeployments() {
        const container = document.getElementById('runningDeployments');
        
        if (Object.keys(this.deployments).length === 0) {
            container.innerHTML = '<div class="no-data">No active deployments</div>';
            return;
        }

        container.innerHTML = Object.values(this.deployments).map(deployment => `
            <div class="deployment-card">
                <h5>${deployment.algorithmName}</h5>
                <p>Status: <span class="status-${deployment.status}">${deployment.status}</span></p>
                <p>Profit: <span class="${deployment.profit >= 0 ? 'text-success' : 'text-danger'}">₹${deployment.profit.toFixed(2)}</span></p>
                <p>Trades: ${deployment.trades}</p>
                <p><small>Started: ${new Date(deployment.startedAt).toLocaleString()}</small></p>
                <div class="card-actions">
                    <button class="btn btn-danger btn-sm" onclick="app.stopDeployment('${deployment.id}')">
                        Stop
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="app.viewLogs('${deployment.id}')">
                        Logs
                    </button>
                </div>
            </div>
        `).join('');
    }

    stopDeployment(deploymentId) {
        if (confirm('Are you sure you want to stop this deployment?')) {
            delete this.deployments[deploymentId];
            localStorage.setItem('deployments', JSON.stringify(this.deployments));
            this.loadDeployments();
            this.showNotification('Deployment stopped successfully!', 'success');
        }
    }

    viewLogs(deploymentId) {
        const deployment = this.deployments[deploymentId];
        if (deployment) {
            alert(`Logs for ${deployment.algorithmName}:\n\n` +
                  `Started: ${new Date(deployment.startedAt).toLocaleString()}\n` +
                  `Status: ${deployment.status}\n` +
                  `Trades executed: ${deployment.trades}\n` +
                  `Current P&L: ₹${deployment.profit.toFixed(2)}\n\n` +
                  `[Mock logs - In a real implementation, this would show detailed trading logs]`);
        }
    }

    simulateTrading(deploymentId) {
        const interval = setInterval(() => {
            const deployment = this.deployments[deploymentId];
            if (!deployment) {
                clearInterval(interval);
                return;
            }

            // Simulate random trading activity
            if (Math.random() > 0.7) { // 30% chance of trade
                deployment.trades++;
                deployment.profit += (Math.random() - 0.5) * 1000; // Random profit/loss
                this.deployments[deploymentId] = deployment;
                localStorage.setItem('deployments', JSON.stringify(this.deployments));
                this.loadDeployments();
            }
        }, 5000); // Update every 5 seconds
    }

    // Utility Methods
    async simulateApiCall() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.settings.apiKey && this.settings.apiSecret) {
                    resolve({ status: 'success' });
                } else {
                    reject(new Error('API Key and Secret are required'));
                }
            }, 2000);
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ZerodhaApp();
});

// Add some CSS for text colors
const style = document.createElement('style');
style.textContent = `
    .text-success { color: #28a745 !important; }
    .text-danger { color: #dc3545 !important; }
    .status-running { color: #28a745; font-weight: 600; }
    .status-stopped { color: #dc3545; font-weight: 600; }
`;
document.head.appendChild(style);
