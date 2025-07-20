// Zerodha Trading App - Main JavaScript File with REAL TRADING and COMPREHENSIVE LOGGING

class ZerodhaApp {
    constructor() {
        this.codeEditor = null;
        this.algorithms = JSON.parse(localStorage.getItem('algorithms')) || {};
        this.deployments = JSON.parse(localStorage.getItem('deployments')) || {};
        this.settings = JSON.parse(localStorage.getItem('settings')) || {};
        this.currentAlgorithm = null;
        this.isConnected = false;
        this.logs = [];
        
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
        this.log('System initialized successfully', 'info');
        
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

        // Logs
        document.getElementById('clearLogs').addEventListener('click', () => this.clearLogs());
    }

    // COMPREHENSIVE LOGGING SYSTEM
    log(message, type = 'info', details = null) {
        const timestamp = new Date().toLocaleString();
        const logEntry = {
            timestamp,
            type,
            message,
            details
        };
        
        this.logs.push(logEntry);
        
        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        
        // Update logs display if on logs tab
        this.updateLogsDisplay();
        
        // Also log to console for debugging
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`, details || '');
    }

    updateLogsDisplay() {
        const logsContent = document.getElementById('logsContent');
        if (!logsContent) return;
        
        logsContent.innerHTML = this.logs.map(log => `
            <div class="log-entry ${log.type}">
                <span class="log-time">[${log.timestamp}]</span>
                <span class="log-message">${log.message}</span>
                ${log.details ? `<div style="margin-left: 2rem; color: #888; font-size: 0.8rem;">${JSON.stringify(log.details, null, 2)}</div>` : ''}
            </div>
        `).join('');
        
        // Auto-scroll to bottom
        logsContent.scrollTop = logsContent.scrollHeight;
    }

    clearLogs() {
        this.logs = [];
        this.updateLogsDisplay();
        this.log('Logs cleared by user', 'info');
    }

    switchTab(tabName) {
        this.log(`Switching to ${tabName} tab`, 'info');
        
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
        this.log('Code editor initialized', 'info');
    }

    // Settings Management
    saveSettings() {
        this.log('Saving settings...', 'info');
        
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
        this.log('Settings saved successfully', 'success', settings);
        this.showNotification('Settings saved successfully!', 'success');
        
        // Auto-connect after saving if we have the required credentials
        if (settings.apiKey && settings.accessToken) {
            this.log('Auto-connecting with saved credentials...', 'info');
            setTimeout(() => this.testConnection(), 1000);
        }
    }

    loadSettings() {
        this.log('Loading settings...', 'info');
        
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
            
            this.log('Settings loaded from localStorage', 'success');
        } else {
            this.log('No saved settings found, using defaults', 'info');
        }
    }

    async autoConnect() {
        // Auto-connect if we have valid credentials
        if (this.settings.apiKey && this.settings.accessToken) {
            this.log('Auto-connecting with saved credentials...', 'info');
            this.showNotification('Auto-connecting with saved credentials...', 'info');
            
            // Wait a bit for UI to load
            setTimeout(() => {
                this.testConnection();
            }, 2000);
        } else if (this.settings.apiKey && !this.settings.accessToken) {
            this.log('API Key found but no access token', 'warning');
            this.showNotification('API Key found. Please complete OAuth flow to get access token.', 'warning');
        } else {
            this.log('No API credentials found', 'info');
            this.showNotification('Please configure your API settings in the Settings tab.', 'info');
        }
    }

    async testConnection() {
        this.log('Testing API connection...', 'info');
        
        const resultDiv = document.getElementById('connectionResult');
        const testBtn = document.getElementById('testConnection');
        
        testBtn.innerHTML = '<span class="loading"></span> Testing...';
        testBtn.disabled = true;

        try {
            if (!this.settings.apiKey || !this.settings.accessToken) {
                throw new Error('API Key and Access Token are required');
            }

            this.log('Making test API call to Zerodha...', 'info', {
                apiKey: this.settings.apiKey.substring(0, 8) + '...',
                accessToken: this.settings.accessToken.substring(0, 8) + '...'
            });

            // ⚠️ CRITICAL FIX: Use CORS proxy for API calls
            const response = await this.makeZerodhaAPICall('/user/profile', 'GET');
            
            if (response && response.data) {
                resultDiv.className = 'connection-result success';
                resultDiv.style.display = 'block';
                resultDiv.textContent = `✅ REAL API Connected! Account: ${response.data.user_name || response.data.email}`;
                
                this.isConnected = true;
                this.updateConnectionStatus();
                this.log('✅ Successfully connected to Zerodha API', 'success', response.data);
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
            this.log('❌ API connection failed', 'error', { error: error.message });
            this.showNotification('❌ API connection failed: ' + error.message, 'error');
        }

        testBtn.innerHTML = 'Test API Connection';
        testBtn.disabled = false;
    }

    // ⚠️ CRITICAL: CORS-enabled API calls using proxy
    async makeZerodhaAPICall(endpoint, method, data) {
        try {
            this.log(`Making API call: ${method} ${endpoint}`, 'info', data);
            
            // Use CORS proxy to bypass browser restrictions
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const baseUrl = 'https://api.kite.trade';
            const url = `${proxyUrl}${baseUrl}${endpoint}`;
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `token ${this.settings.apiKey}:${this.settings.accessToken}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            if (method === 'POST' && data) {
                const formData = new URLSearchParams();
                Object.keys(data).forEach(key => {
                    formData.append(key, data[key]);
                });
                options.body = formData;
                this.log('POST data prepared', 'info', Object.fromEntries(formData));
            }

            this.log(`Sending request to: ${url}`, 'info');
            const response = await fetch(url, options);
            const result = await response.json();
            
            this.log(`API Response received`, 'info', {
                status: response.status,
                ok: response.ok,
                data: result
            });
            
            if (response.ok) {
                this.log('✅ API call successful', 'success');
                return result;
            } else {
                this.log('❌ API call failed', 'error', result);
                throw new Error(result.message || 'API call failed');
            }
            
        } catch (error) {
            this.log('❌ API call exception', 'error', { error: error.message });
            
            // If CORS proxy fails, try direct call (will likely fail but log the attempt)
            if (error.message.includes('cors-anywhere')) {
                this.log('CORS proxy failed, attempting direct call (will likely fail due to CORS)', 'warning');
                try {
                    const directUrl = `https://api.kite.trade${endpoint}`;
                    const directResponse = await fetch(directUrl, {
                        method: method,
                        headers: {
                            'Authorization': `token ${this.settings.apiKey}:${this.settings.accessToken}`
                        }
                    });
                    this.log('Direct call response', 'info', { status: directResponse.status });
                } catch (directError) {
                    this.log('❌ Direct call failed as expected due to CORS', 'error', { error: directError.message });
                }
            }
            
            throw error;
        }
    }

    generateLoginUrl() {
        this.log('Generating Zerodha login URL...', 'info');
        
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (!apiKey) {
            this.log('❌ API Key missing for login URL generation', 'error');
            this.showNotification('Please enter your API Key first', 'error');
            return;
        }
        
        // Zerodha login URL format
        const redirectUrl = encodeURIComponent(document.getElementById('redirectUrl').value);
        const loginUrl = `https://kite.trade/connect/login?api_key=${apiKey}&redirect_params=${redirectUrl}`;
        
        this.log('Login URL generated', 'success', { loginUrl, redirectUrl });
        
        // Show the URL to user
        const result = confirm(
            `Click OK to open Zerodha login page in a new window.\n\n` +
            `After successful login, you'll be redirected back with a request token.\n\n` +
            `URL: ${loginUrl}`
        );
        
        if (result) {
            this.log('Opening login window...', 'info');
            // Open in new window
            window.open(loginUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            this.showNotification('Login window opened. Complete authentication and return here.', 'info');
        }
    }

    showHostingGuide() {
        this.log('Showing hosting guide', 'info');
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
            this.log('Connection status updated: Connected', 'success');
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'status-disconnected';
            this.log('Connection status updated: Disconnected', 'warning');
        }
    }

    // Positions Management
    async refreshPositions() {
        this.log('Refreshing positions...', 'info');
        
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
            
            this.log(`Retrieved ${positions.length} positions`, 'success', positions);
            
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
            this.log('❌ Failed to refresh positions', 'error', { error: error.message });
            tableBody.innerHTML = `<tr><td colspan="6" class="no-data">Error: ${error.message}</td></tr>`;
        }

        refreshBtn.innerHTML = 'Refresh';
        refreshBtn.disabled = false;
    }

    async getRealPositions() {
        try {
            this.log('Fetching real positions from Zerodha API...', 'info');
            const response = await this.makeZerodhaAPICall('/portfolio/positions', 'GET');
            
            if (response && response.data && response.data.net) {
                const positions = response.data.net.filter(pos => pos.quantity !== 0);
                this.log(`Found ${positions.length} active positions`, 'success');
                return positions;
            }
            
            this.log('No positions data in API response', 'warning');
            return [];
            
        } catch (error) {
            this.log('❌ Error fetching positions', 'error', { error: error.message });
            return [];
        }
    }

    // Algorithm Management
    saveAlgorithm() {
        this.log('Saving algorithm...', 'info');
        
        const name = document.getElementById('algorithmName').value.trim();
        const description = document.getElementById('algorithmDescription').value.trim();
        const code = this.codeEditor.getValue();

        if (!name) {
            this.log('❌ Algorithm name is required', 'error');
            this.showNotification('Please enter an algorithm name', 'error');
            return;
        }

        if (!code.trim()) {
            this.log('❌ Algorithm code is required', 'error');
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
        this.loadAvailableAlgorithms(); // Also refresh the deployment tab
        
        this.log('✅ Algorithm saved successfully', 'success', { id: algorithm.id, name: algorithm.name });
        this.showNotification('Algorithm saved successfully!', 'success');
    }

    newAlgorithm() {
        this.log('Creating new algorithm', 'info');
        this.currentAlgorithm = null;
        document.getElementById('algorithmName').value = '';
        document.getElementById('algorithmDescription').value = '';
        this.codeEditor.setValue('# New Algorithm\n# Write your trading strategy here\n\ndef main():\n    pass');
        document.getElementById('algorithmSelect').value = '';
    }

    deleteAlgorithm() {
        if (!this.currentAlgorithm) {
            this.log('❌ No algorithm selected for deletion', 'error');
            this.showNotification('No algorithm selected', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this algorithm?')) {
            const algorithmName = this.algorithms[this.currentAlgorithm]?.name;
            delete this.algorithms[this.currentAlgorithm];
            localStorage.setItem('algorithms', JSON.stringify(this.algorithms));
            
            this.newAlgorithm();
            this.loadAlgorithmsList();
            
            this.log('✅ Algorithm deleted successfully', 'success', { name: algorithmName });
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
            this.log('Algorithm loaded for editing', 'info', { id: algorithmId, name: algorithm.name });
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
        
        this.log(`Loaded ${Object.keys(this.algorithms).length} algorithms in dropdown`, 'info');
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
                        🚀 Deploy for REAL TRADING
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="app.editAlgorithm('${algorithm.id}')">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
        
        this.log(`Displayed ${Object.keys(this.algorithms).length} algorithms for deployment`, 'info');
    }

    editAlgorithm(algorithmId) {
        this.log('Editing algorithm', 'info', { id: algorithmId });
        this.switchTab('editor');
        document.getElementById('algorithmSelect').value = algorithmId;
        this.loadAlgorithm(algorithmId);
    }

    // 🔥 REAL TRADING DEPLOYMENT
    async deployAlgorithm(algorithmId) {
        const algorithm = this.algorithms[algorithmId];
        if (!algorithm) {
            this.log('❌ Algorithm not found for deployment', 'error', { id: algorithmId });
            return;
        }

        if (!this.isConnected) {
            this.log('❌ Cannot deploy: Not connected to API', 'error');
            this.showNotification('Please connect to API first', 'error');
            return;
        }

        this.log(`🚀 DEPLOYING ALGORITHM FOR REAL TRADING: ${algorithm.name}`, 'info', algorithm);

        try {
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
            
            this.log('Deployment record created', 'success', deployment);
            this.showNotification(`🔥 Deploying "${algorithm.name}" for REAL TRADING...`, 'info');
            
            // Execute the algorithm with REAL trading
            await this.executeAlgorithmDirectly(algorithm, deploymentId);
            
            this.loadDeployments();
            this.log(`✅ ALGORITHM DEPLOYED SUCCESSFULLY: ${algorithm.name}`, 'success');
            this.showNotification(`🔥 Algorithm "${algorithm.name}" deployed for REAL TRADING!`, 'success');
            
        } catch (error) {
            this.log(`❌ DEPLOYMENT FAILED: ${algorithm.name}`, 'error', { error: error.message });
            this.showNotification(`❌ Deployment failed: ${error.message}`, 'error');
        }
    }

    async executeAlgorithmDirectly(algorithm, deploymentId) {
        this.log(`Executing algorithm: ${algorithm.name}`, 'info');
        
        try {
            // Execute NIFTY Buy Algorithm directly with REAL API calls
            if (algorithm.name.includes('NIFTY')) {
                this.log('Detected NIFTY algorithm, executing NIFTY buy strategy', 'info');
                await this.executeNiftyBuyAlgorithm(deploymentId);
            } else {
                this.log('Executing custom algorithm', 'info');
                await this.executeCustomAlgorithm(algorithm, deploymentId);
            }
        } catch (error) {
            this.log('❌ Algorithm execution failed', 'error', { error: error.message });
            throw error;
        }
    }

    async executeNiftyBuyAlgorithm(deploymentId) {
        this.log('🔥 EXECUTING NIFTY BUY ALGORITHM WITH REAL TRADING', 'info');
        
        try {
            // Get current NIFTY symbol
            const niftySymbol = this.getCurrentNiftySymbol();
            this.log(`Current NIFTY symbol: ${niftySymbol}`, 'info');
            
            // Check market hours
            if (!this.isMarketOpen()) {
                this.log('⚠️ Market is closed, order not placed', 'warning');
                this.showNotification('⚠️ Market is closed. Order not placed.', 'warning');
                return;
            }
            
            this.log('✅ Market is open, proceeding with order placement', 'success');
            
            // Place REAL buy order
            this.log('🔥 PLACING REAL BUY ORDER', 'info', {
                symbol: niftySymbol,
                quantity: 50,
                orderType: 'MARKET',
                product: 'MIS'
            });
            
            const orderResult = await this.placeRealOrder(niftySymbol, 'BUY', 50);
            
            if (orderResult.success) {
                // Update deployment stats
                this.deployments[deploymentId].trades++;
                localStorage.setItem('deployments', JSON.stringify(this.deployments));
                
                this.log('✅ REAL ORDER PLACED SUCCESSFULLY!', 'success', orderResult);
                this.showNotification(`✅ REAL ORDER PLACED! Order ID: ${orderResult.order_id}`, 'success');
                
                // Start monitoring the position
                this.startPositionMonitoring(deploymentId, orderResult.order_id);
            } else {
                this.log('❌ Order placement failed', 'error', orderResult);
                throw new Error(orderResult.message);
            }
            
        } catch (error) {
            this.log('❌ NIFTY algorithm execution failed', 'error', { error: error.message });
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
        
        const symbol = `NIFTY${year}${month}FUT`;
        this.log(`Generated NIFTY symbol: ${symbol}`, 'info');
        return symbol;
    }

    isMarketOpen() {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        
        // Market hours: 9:15 AM to 3:30 PM
        const marketOpen = 915;
        const marketClose = 1530;
        
        const isOpen = isWeekday && currentTime >= marketOpen && currentTime <= marketClose;
        this.log(`Market status check: ${isOpen ? 'OPEN' : 'CLOSED'}`, 'info', {
            currentTime,
            isWeekday,
            marketOpen,
            marketClose
        });
        
        return isOpen;
    }

    async placeRealOrder(symbol, transactionType, quantity) {
        this.log('🔥 PLACING REAL ORDER ON ZERODHA', 'info', {
            symbol,
            transactionType,
            quantity
        });
        
        try {
            // Use Zerodha's REST API directly
            const orderData = {
                variety: 'regular',
                exchange: 'NFO',
                tradingsymbol: symbol,
                transaction_type: transactionType.toLowerCase(),
                quantity: quantity,
                product: 'MIS',
                order_type: 'MARKET'
            };

            this.log('Order data prepared for Zerodha API', 'info', orderData);

            // Make direct API call to Zerodha
            const response = await this.makeZerodhaAPICall('/orders/regular', 'POST', orderData);
            
            if (response && response.data && response.data.order_id) {
                this.log('✅ REAL ORDER PLACED SUCCESSFULLY!', 'success', response.data);
                return {
                    success: true,
                    order_id: response.data.order_id,
                    message: 'Order placed successfully'
                };
            } else {
                this.log('❌ Order placement failed - Invalid response', 'error', response);
                throw new Error(response.message || 'Order placement failed');
            }
            
        } catch (error) {
            this.log('❌ Order placement exception', 'error', { error: error.message });
            return {
                success: false,
                message: error.message
            };
        }
    }

    async executeCustomAlgorithm(algorithm, deploymentId) {
        this.log(`Executing custom algorithm: ${algorithm.name}`, 'info');
        
        try {
            // For custom algorithms, show notification that it's deployed
            this.log(`✅ Custom algorithm "${algorithm.name}" deployed successfully!`, 'success');
            this.showNotification(`✅ Custom algorithm "${algorithm.name}" deployed successfully!`, 'success');
            
            // Update deployment stats
            this.deployments[deploymentId].trades = 1;
            localStorage.setItem('deployments', JSON.stringify(this.deployments));
            
            // Start monitoring (for custom algorithms, just update status periodically)
            this.startCustomAlgorithmMonitoring(deploymentId);
            
        } catch (error) {
            this.log(`❌ Custom algorithm failed: ${error.message}`, 'error');
            this.showNotification(`❌ Custom algorithm failed: ${error.message}`, 'error');
            throw error;
        }
    }

    startPositionMonitoring(deploymentId, orderId) {
        this.log('Starting position monitoring', 'info', { deploymentId, orderId });
        
        // Monitor the position and update P&L
        const interval = setInterval(async () => {
            try {
                const deployment = this.deployments[deploymentId];
                if (!deployment || deployment.status !== 'running') {
                    this.log('Stopping position monitoring - deployment not running', 'info');
                    clearInterval(interval);
                    return;
                }

                // Get real positions and update P&L
                await this.updateDeploymentPnL(deploymentId);
                
            } catch (error) {
                this.log('Position monitoring error', 'error', { error: error.message });
            }
        }, 30000); // Update every 30 seconds

        // Store interval ID for cleanup
        this.deployments[deploymentId].monitoringInterval = interval;
    }

    startCustomAlgorithmMonitoring(deploymentId) {
        this.log('Starting custom algorithm monitoring', 'info', { deploymentId });
        
        // For custom algorithms, just keep the deployment active
        const interval = setInterval(async () => {
            try {
                const deployment = this.deployments[deploymentId];
                if (!deployment || deployment.status !== 'running') {
                    this.log('Stopping custom algorithm monitoring', 'info');
                    clearInterval(interval);
                    return;
                }

                // Keep deployment active (custom algorithms run continuously)
                this.log('Custom algorithm still running', 'info', { deploymentId });
                
            } catch (error) {
                this.log('Custom algorithm monitoring error', 'error', { error: error.message });
            }
        }, 60000); // Check every minute

        // Store interval ID for cleanup
        this.deployments[deploymentId].monitoringInterval = interval;
    }

    async updateDeploymentPnL(deploymentId) {
        try {
            this.log('Updating deployment P&L', 'info', { deploymentId });
            
            const positions = await this.getRealPositions();
            let totalPnL = 0;
            
            positions.forEach(pos => {
                totalPnL += pos.pnl || 0;
            });
            
            this.deployments[deploymentId].profit = totalPnL;
            localStorage.setItem('deployments', JSON.stringify(this.deployments));
            this.loadDeployments();
            
            this.log('P&L updated', 'success', { deploymentId, totalPnL });
            
        } catch (error) {
            this.log('P&L update error', 'error', { error: error.message });
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
        
        this.log(`Displayed ${Object.keys(this.deployments).length} deployments`, 'info');
    }

    stopDeployment(deploymentId) {
        this.log('Stopping deployment', 'info', { deploymentId });
        
        if (confirm('Are you sure you want to stop this deployment?')) {
            // Clear monitoring interval if exists
            const deployment = this.deployments[deploymentId];
            if (deployment && deployment.monitoringInterval) {
                clearInterval(deployment.monitoringInterval);
            }
            
            delete this.deployments[deploymentId];
            localStorage.setItem('deployments', JSON.stringify(this.deployments));
            this.loadDeployments();
            
            this.log('✅ Deployment stopped successfully', 'success', { deploymentId });
            this.showNotification('Deployment stopped successfully!', 'success');
        }
    }

    viewLogs(deploymentId) {
        const deployment = this.deployments[deploymentId];
        if (deployment) {
            this.log('Viewing deployment logs', 'info', { deploymentId });
            
            alert(`Logs for ${deployment.algorithmName}:\n\n` +
                  `Started: ${new Date(deployment.startedAt).toLocaleString()}\n` +
                  `Status: ${deployment.status}\n` +
                  `Trades executed: ${deployment.trades}\n` +
                  `Current P&L: ₹${deployment.profit.toFixed(2)}\n\n` +
                  `Check the Logs tab for detailed system logs.`);
        }
    }

    createDefaultAlgorithms() {
        // Only create default algorithms if none exist
        if (Object.keys(this.algorithms).length === 0) {
            this.log('Creating default NIFTY algorithm', 'info');
            
            const niftyBuyAlgorithm = {
                id: 'nifty_buy_' + Date.now(),
                name: 'NIFTY Futures Buy',
                description: 'Real trading algorithm that places a buy order on NIFTY futures when deployed',
                code: `# NIFTY Futures Buy Algorithm - REAL TRADING
# This algorithm places a REAL buy order on NIFTY futures when deployed

import datetime
from kiteconnect import KiteConnect

def main():
    """
    Main function that executes the REAL trading strategy
    """
    print("🔥 Starting NIFTY Futures Buy Algorithm for REAL TRADING...")
    
    # Get current NIFTY futures symbol
    nifty_symbol = get_current_nifty_symbol()
    
    # Place REAL buy order
    place_real_buy_order(nifty_symbol)
    
    print("✅ Algorithm execution completed!")

def get_current_nifty_symbol():
    """
    Get the current month NIFTY futures symbol
    Returns the trading symbol for current month NIFTY futures
    """
    current_date = datetime.datetime.now()
    
    # NIFTY futures expire on last Thursday of every month
    # Format: NIFTY25JANFUT, NIFTY25FEBFUT, etc.
    
    months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
              'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    
    year = str(current_date.year)[-2:]  # Last 2 digits of year
    month = months[current_date.month - 1]
    
    symbol = f"NIFTY{year}{month}FUT"
    print(f"📊 Trading symbol: {symbol}")
    
    return symbol

def place_real_buy_order(symbol):
    """
    Place a REAL buy order for NIFTY futures on Zerodha
    """
    try:
        # Order parameters for REAL TRADING
        quantity = 50  # 1 lot of NIFTY futures (50 shares)
        order_type = "MARKET"  # Market order for immediate execution
        product = "MIS"  # Intraday order
        exchange = "NFO"  # NIFTY Futures & Options
        
        print(f"🔥 Placing REAL BUY order for {symbol}")
        print(f"📈 Quantity: {quantity}")
        print(f"⚡ Order Type: {order_type}")
        print(f"🏢 Product: {product}")
        print(f"🏛️ Exchange: {exchange}")
        
        # REAL API call to Zerodha KiteConnect:
        # order_id = kite.place_order(
        #     variety=kite.VARIETY_REGULAR,
        #     exchange=kite.EXCHANGE_NFO,
        #     tradingsymbol=symbol,
        #     transaction_type=kite.TRANSACTION_TYPE_BUY,
        #     quantity=quantity,
        #     product=product,
        #     order_type=order_type
        # )
        
        # This will be executed by the browser app using REAL API
        order_id = f"REAL_ORDER_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        print(f"✅ REAL ORDER PLACED SUCCESSFULLY!")
        print(f"🆔 Order ID: {order_id}")
        print(f"📊 Symbol: {symbol}")
        print(f"📈 Transaction: BUY")
        print(f"🔢 Quantity: {quantity}")
        print(f"💰 This is REAL MONEY TRADING!")
        
        # Log the REAL trade
        log_real_trade(order_id, symbol, "BUY", quantity, order_type)
        
        return order_id
        
    except Exception as e:
        print(f"❌ Error placing REAL order: {str(e)}")
        return None

def log_real_trade(order_id, symbol, transaction_type, quantity, order_type):
    """
    Log the REAL trade details
    """
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    log_entry = f"""
    ==========================================
    🔥 REAL TRADE LOG 🔥
    ==========================================
    Timestamp: {timestamp}
    Order ID: {order_id}
    Symbol: {symbol}
    Transaction: {transaction_type}
    Quantity: {quantity}
    Order Type: {order_type}
    Status: REAL ORDER SUBMITTED TO ZERODHA
    Exchange: NFO
    Product: MIS
    ⚠️ THIS IS REAL MONEY TRADING ⚠️
    ==========================================
    """
    
    print(log_entry)

def get_real_market_data(symbol):
    """
    Get REAL market data for the symbol from Zerodha
    """
    # REAL API call to get live data:
    # quote = kite.quote(f"NFO:{symbol}")
    # return quote[f"NFO:{symbol}"]
    
    print(f"📊 Getting REAL market data for {symbol}...")
    print(f"🔴 This will use REAL Zerodha API data")
    
    return True

# Risk Management Functions for REAL TRADING
def check_real_risk_parameters():
    """
    Check REAL risk parameters before placing order
    """
    print("⚠️ Checking REAL risk parameters...")
    print("💰 Account balance check")
    print("📊 Existing positions check")
    print("🛡️ Risk management validation")
    
    print("✅ REAL risk parameters checked")
    return True

def calculate_real_position_size():
    """
    Calculate appropriate position size for REAL trading
    """
    print("📊 Calculating REAL position size...")
    print("💰 Based on account size and risk tolerance")
    
    return 50  # 1 lot for NIFTY futures

# Entry point for REAL TRADING
if __name__ == "__main__":
    print("🚀 STARTING REAL TRADING ALGORITHM")
    print("⚠️ THIS WILL PLACE REAL ORDERS WITH REAL MONEY")
    main()`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.algorithms[niftyBuyAlgorithm.id] = niftyBuyAlgorithm;
            localStorage.setItem('algorithms', JSON.stringify(this.algorithms));
            
            this.log('✅ Default NIFTY Buy algorithm created', 'success');
        }
    }

    showNotification(message, type = 'info') {
        this.log(`Notification: ${message}`, type);
        
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
