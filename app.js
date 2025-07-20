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
        this.createDefaultAlgorithms();
    }

    init() {
        this.setupEventListeners();
        this.initCodeEditor();
        this.loadSettings();
        this.loadAlgorithms();
        this.loadDeployments();
        this.updateConnectionStatus();
        
        // Auto-connect if we have valid credentials
        this.autoConnect();
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
            apiKey: document.getElementById('apiKey').value.trim(),
            apiSecret: document.getElementById('apiSecret').value.trim(),
            requestToken: document.getElementById('requestToken').value.trim(),
            accessToken: document.getElementById('accessToken').value.trim(),
            redirectUrl: document.getElementById('redirectUrl').value.trim(),
            maxPositions: parseInt(document.getElementById('maxPositions').value) || 10,
            riskPerTrade: parseFloat(document.getElementById('riskPerTrade').value) || 2.0,
            autoTrade: document.getElementById('autoTrade').checked
        };

        this.settings = settings;
        localStorage.setItem('settings', JSON.stringify(settings));
        this.showNotification('Settings saved successfully!', 'success');
        
        // Auto-connect after saving if we have the required credentials
        if (settings.apiKey && settings.accessToken) {
            setTimeout(() => this.testConnection(), 1000);
        }
    }

    loadSettings() {
        // Set default redirect URL based on current domain
        const defaultRedirectUrl = window.location.origin + '/redirect.html';
        document.getElementById('redirectUrl').value = defaultRedirectUrl;
        
        if (Object.keys(this.settings).length > 0) {
            document.getElementById('apiKey').value = this.settings.apiKey || '';
            document.getElementById('apiSecret').value = this.settings.apiSecret || '';
            document.getElementById('requestToken').value = this.settings.requestToken || '';
            document.getElementById('accessToken').value = this.settings.accessToken || '';
            document.getElementById('redirectUrl').value = this.settings.redirectUrl || defaultRedirectUrl;
            document.getElementById('maxPositions').value = this.settings.maxPositions || 10;
            document.getElementById('riskPerTrade').value = this.settings.riskPerTrade || 2;
            document.getElementById('autoTrade').checked = this.settings.autoTrade || false;
        }
    }

    async autoConnect() {
        // Auto-connect if we have valid credentials
        if (this.settings.apiKey && this.settings.accessToken) {
            console.log('Auto-connecting with saved credentials...');
            this.showNotification('Auto-connecting with saved credentials...', 'info');
            
            // Wait a bit for UI to load
            setTimeout(() => {
                this.testConnection();
            }, 2000);
        } else if (this.settings.apiKey && !this.settings.accessToken) {
            this.showNotification('API Key found. Please complete OAuth flow to get access token.', 'warning');
        } else {
            this.showNotification('Please configure your API settings in the Settings tab.', 'info');
        }
    }

    async testConnection() {
        const resultDiv = document.getElementById('connectionResult');
        const testBtn = document.getElementById('testConnection');
        
        testBtn.innerHTML = '<span class="loading"></span> Testing...';
        testBtn.disabled = true;

        try {
            // Test connection directly with Zerodha API
            if (!this.settings.apiKey || !this.settings.accessToken) {
                throw new Error('API Key and Access Token are required');
            }

            // Test by getting user profile from Zerodha API
            const response = await this.makeZerodhaAPICall('/user/profile', 'GET');
            
            if (response && response.data) {
                resultDiv.className = 'connection-result success';
                resultDiv.style.display = 'block';
                resultDiv.textContent = `✅ REAL API Connected! Account: ${response.data.user_name || response.data.email}`;
                
                this.isConnected = true;
                this.updateConnectionStatus();
                this.showNotification('✅ Connected to Zerodha API successfully!', 'success');
            } else {
                throw new Error('Invalid API response');
            }
            
        } catch (error) {
            resultDiv.className = 'connection-result error';
            resultDiv.style.display = 'block';
            resultDiv.textContent = '❌ Connection failed: ' + error.message;
            
            this.isConnected = false;
            this.updateConnectionStatus();
            this.showNotification('❌ API connection failed: ' + error.message, 'error');
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

            // Get real positions directly from Zerodha API
            const positions = await this.getRealPositions();
            
            if (positions.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No positions found.</td></tr>';
            } else {
                tableBody.innerHTML = positions.map(position => `
                    <tr>
                        <td>${position.tradingsymbol}</td>
                        <td>${position.quantity}</td>
                        <td>₹${(position.average_price || 0).toFixed(2)}</td>
                        <td>₹${(position.last_price || position.average_price || 0).toFixed(2)}</td>
                        <td class="${(position.pnl || 0) >= 0 ? 'text-success' : 'text-danger'}">
                            ₹${(position.pnl || 0).toFixed(2)}
                        </td>
                        <td class="${(position.day_change || 0) >= 0 ? 'text-success' : 'text-danger'}">
                            ${((position.day_change || 0) * 100).toFixed(2)}%
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

    processPositionsData(positionsData) {
        // Process real Zerodha positions data into our format
        const netPositions = positionsData.net || [];
        
        return netPositions.filter(pos => pos.quantity !== 0).map(pos => ({
            symbol: pos.tradingsymbol,
            quantity: pos.quantity,
            averagePrice: pos.average_price || 0,
            ltp: pos.last_price || pos.average_price || 0,
            pnl: pos.pnl || 0,
            dayChange: pos.last_price && pos.average_price ? 
                ((pos.last_price - pos.average_price) / pos.average_price * 100) : 0
        }));
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

    async deployAlgorithm(algorithmId) {
        const algorithm = this.algorithms[algorithmId];
        if (!algorithm) return;

        if (!this.isConnected) {
            this.showNotification('Please connect to API first', 'error');
            return;
        }

        try {
            // Execute algorithm directly in browser with REAL trading
            this.showNotification(`🔥 Deploying "${algorithm.name}" for REAL TRADING...`, 'info');
            
            // Create deployment record
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
            
            // Execute the algorithm with REAL trading
            await this.executeAlgorithmDirectly(algorithm, deploymentId);
            
            this.loadDeployments();
            this.showNotification(`🔥 Algorithm "${algorithm.name}" deployed for REAL TRADING!`, 'success');
            
        } catch (error) {
            this.showNotification(`❌ Deployment failed: ${error.message}`, 'error');
        }
    }

    async executeAlgorithmDirectly(algorithm, deploymentId) {
        try {
            // Execute NIFTY Buy Algorithm directly with REAL API calls
            if (algorithm.name.includes('NIFTY')) {
                await this.executeNiftyBuyAlgorithm(deploymentId);
            } else {
                // For custom algorithms, execute the code logic
                await this.executeCustomAlgorithm(algorithm, deploymentId);
            }
        } catch (error) {
            console.error('Algorithm execution error:', error);
            throw error;
        }
    }

    async executeNiftyBuyAlgorithm(deploymentId) {
        try {
            // Get current NIFTY symbol
            const niftySymbol = this.getCurrentNiftySymbol();
            
            // Check market hours
            if (!this.isMarketOpen()) {
                this.showNotification('⚠️ Market is closed. Order not placed.', 'warning');
                return;
            }
            
            // Place REAL buy order
            const orderResult = await this.placeRealOrder(niftySymbol, 'BUY', 50);
            
            if (orderResult.success) {
                // Update deployment stats
                this.deployments[deploymentId].trades++;
                localStorage.setItem('deployments', JSON.stringify(this.deployments));
                
                this.showNotification(`✅ REAL ORDER PLACED! Order ID: ${orderResult.order_id}`, 'success');
                
                // Start monitoring the position
                this.startPositionMonitoring(deploymentId, orderResult.order_id);
            } else {
                throw new Error(orderResult.message);
            }
            
        } catch (error) {
            this.showNotification(`❌ Order failed: ${error.message}`, 'error');
            throw error;
        }
    }

    getCurrentNiftySymbol() {
        const now = new Date();
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        
        const year = now.getFullYear().toString().slice(-2);
        const month = months[now.getMonth()];
        
        return `NIFTY${year}${month}FUT`;
    }

    isMarketOpen() {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        
        // Market hours: 9:15 AM to 3:30 PM
        const marketOpen = 915;
        const marketClose = 1530;
        
        return isWeekday && currentTime >= marketOpen && currentTime <= marketClose;
    }

    async placeRealOrder(symbol, transactionType, quantity) {
        try {
            // Use Zerodha's REST API directly from browser
            const orderData = {
                api_key: this.settings.apiKey,
                access_token: this.settings.accessToken,
                variety: 'regular',
                exchange: 'NFO',
                tradingsymbol: symbol,
                transaction_type: transactionType.toLowerCase(),
                quantity: quantity,
                product: 'MIS',
                order_type: 'MARKET'
            };

            // Make direct API call to Zerodha
            const response = await this.makeZerodhaAPICall('/orders/regular', 'POST', orderData);
            
            if (response && response.data && response.data.order_id) {
                return {
                    success: true,
                    order_id: response.data.order_id,
                    message: 'Order placed successfully'
                };
            } else {
                throw new Error(response.message || 'Order placement failed');
            }
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async makeZerodhaAPICall(endpoint, method, data) {
        try {
            const baseUrl = 'https://api.kite.trade';
            const url = `${baseUrl}${endpoint}`;
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `token ${this.settings.apiKey}:${this.settings.accessToken}`
                }
            };

            if (method === 'POST' && data) {
                const formData = new URLSearchParams();
                Object.keys(data).forEach(key => {
                    formData.append(key, data[key]);
                });
                options.body = formData;
            }

            const response = await fetch(url, options);
            const result = await response.json();
            
            if (response.ok) {
                return result;
            } else {
                throw new Error(result.message || 'API call failed');
            }
            
        } catch (error) {
            console.error('Zerodha API call failed:', error);
            throw error;
        }
    }

    startPositionMonitoring(deploymentId, orderId) {
        // Monitor the position and update P&L
        const interval = setInterval(async () => {
            try {
                const deployment = this.deployments[deploymentId];
                if (!deployment || deployment.status !== 'running') {
                    clearInterval(interval);
                    return;
                }

                // Get real positions and update P&L
                await this.updateDeploymentPnL(deploymentId);
                
            } catch (error) {
                console.error('Position monitoring error:', error);
            }
        }, 30000); // Update every 30 seconds

        // Store interval ID for cleanup
        this.deployments[deploymentId].monitoringInterval = interval;
    }

    async updateDeploymentPnL(deploymentId) {
        try {
            const positions = await this.getRealPositions();
            let totalPnL = 0;
            
            positions.forEach(pos => {
                totalPnL += pos.pnl || 0;
            });
            
            this.deployments[deploymentId].profit = totalPnL;
            localStorage.setItem('deployments', JSON.stringify(this.deployments));
            this.loadDeployments();
            
        } catch (error) {
            console.error('P&L update error:', error);
        }
    }

    async getRealPositions() {
        try {
            const response = await this.makeZerodhaAPICall('/portfolio/positions', 'GET');
            
            if (response && response.data && response.data.net) {
                return response.data.net.filter(pos => pos.quantity !== 0);
            }
            
            return [];
            
        } catch (error) {
            console.error('Get positions error:', error);
            return [];
        }
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

    createDefaultAlgorithms() {
        // Only create default algorithms if none exist
        if (Object.keys(this.algorithms).length === 0) {
            const niftyBuyAlgorithm = {
                id: 'nifty_buy_' + Date.now(),
                name: 'NIFTY Futures Buy',
                description: 'Simple algorithm that places a buy order on NIFTY futures when deployed',
                code: `# NIFTY Futures Buy Algorithm
# This algorithm places a buy order on NIFTY futures when deployed

import datetime
from kiteconnect import KiteConnect

def main():
    """
    Main function that executes the trading strategy
    """
    print("Starting NIFTY Futures Buy Algorithm...")
    
    # Get current NIFTY futures symbol
    nifty_symbol = get_current_nifty_symbol()
    
    # Place buy order
    place_buy_order(nifty_symbol)
    
    print("Algorithm execution completed!")

def get_current_nifty_symbol():
    """
    Get the current month NIFTY futures symbol
    Returns the trading symbol for current month NIFTY futures
    """
    current_date = datetime.datetime.now()
    
    # NIFTY futures expire on last Thursday of every month
    # Format: NIFTY24JANFUT, NIFTY24FEBFUT, etc.
    
    months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
              'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    
    year = str(current_date.year)[-2:]  # Last 2 digits of year
    month = months[current_date.month - 1]
    
    symbol = f"NIFTY{year}{month}FUT"
    print(f"Trading symbol: {symbol}")
    
    return symbol

def place_buy_order(symbol):
    """
    Place a buy order for NIFTY futures
    """
    try:
        # Order parameters
        quantity = 50  # 1 lot of NIFTY futures (50 shares)
        order_type = "MARKET"  # Market order for immediate execution
        product = "MIS"  # Intraday order
        
        print(f"Placing BUY order for {symbol}")
        print(f"Quantity: {quantity}")
        print(f"Order Type: {order_type}")
        print(f"Product: {product}")
        
        # In real implementation, this would use KiteConnect API:
        # order_id = kite.place_order(
        #     variety=kite.VARIETY_REGULAR,
        #     exchange=kite.EXCHANGE_NFO,
        #     tradingsymbol=symbol,
        #     transaction_type=kite.TRANSACTION_TYPE_BUY,
        #     quantity=quantity,
        #     product=product,
        #     order_type=order_type
        # )
        
        # Mock order placement for demo
        order_id = f"ORDER_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        print(f"✅ Order placed successfully!")
        print(f"Order ID: {order_id}")
        print(f"Symbol: {symbol}")
        print(f"Transaction: BUY")
        print(f"Quantity: {quantity}")
        
        # Log the trade
        log_trade(order_id, symbol, "BUY", quantity, order_type)
        
        return order_id
        
    except Exception as e:
        print(f"❌ Error placing order: {str(e)}")
        return None

def log_trade(order_id, symbol, transaction_type, quantity, order_type):
    """
    Log the trade details
    """
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    log_entry = f"""
    ==========================================
    TRADE LOG
    ==========================================
    Timestamp: {timestamp}
    Order ID: {order_id}
    Symbol: {symbol}
    Transaction: {transaction_type}
    Quantity: {quantity}
    Order Type: {order_type}
    Status: SUBMITTED
    ==========================================
    """
    
    print(log_entry)

def get_market_data(symbol):
    """
    Get current market data for the symbol
    """
    # In real implementation, this would fetch live data:
    # quote = kite.quote(f"NFO:{symbol}")
    # return quote[f"NFO:{symbol}"]
    
    # Mock data for demo
    mock_data = {
        'last_price': 21500.75,
        'volume': 1250000,
        'change': 125.50,
        'change_percent': 0.58
    }
    
    print(f"Market Data for {symbol}:")
    print(f"LTP: ₹{mock_data['last_price']}")
    print(f"Change: +₹{mock_data['change']} ({mock_data['change_percent']}%)")
    
    return mock_data

# Risk Management Functions
def check_risk_parameters():
    """
    Check risk parameters before placing order
    """
    # Add your risk management logic here
    # Example: Check account balance, existing positions, etc.
    
    print("✅ Risk parameters checked")
    return True

def calculate_position_size():
    """
    Calculate appropriate position size based on risk management
    """
    # Add position sizing logic here
    # Example: Based on account size, risk per trade, etc.
    
    return 50  # 1 lot for NIFTY futures

# Entry point
if __name__ == "__main__":
    main()`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.algorithms[niftyBuyAlgorithm.id] = niftyBuyAlgorithm;
            localStorage.setItem('algorithms', JSON.stringify(this.algorithms));
            
            console.log('Default NIFTY Buy algorithm created');
        }
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
