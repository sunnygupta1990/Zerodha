# Quick Start Guide - Zerodha Trading Algorithm System

## 🚀 Get Started in 5 Minutes

### Step 1: Download & Setup
1. Download all files to a folder on your computer
2. Double-click `start_trading_system.bat` to start the backend server
3. Open `index.html` in your web browser

### Step 2: Configure API (First Time Only)
1. Go to **Settings** tab in the web app
2. Enter your Zerodha API Key and Secret
3. Click **"Test API Connection"** to verify

### Step 3: Deploy Your First Algorithm
1. Go to **Deployment** tab
2. Find "NIFTY Futures Buy" algorithm (pre-loaded)
3. Click **"Deploy"** button
4. Watch it run in "Running Deployments" section

## 🔧 What You Need

### Required
- **Python 3.7+** installed on your computer
- **Zerodha trading account** with API access
- **API Key & Secret** from [Zerodha Developer Console](https://developers.kite.trade/)

### For Real Trading (Optional)
- **Access Token** (generated after OAuth login)
- **Hosted app** on GitHub Pages/Netlify for OAuth redirect

## 📊 Two Modes

### 🎮 Demo Mode (Default)
- **No real trading** - safe for testing
- **Mock data** for positions and trades
- **Learn the interface** without risk

### 💰 Live Trading Mode
- **Real algorithm execution** with actual trades
- **Requires valid API credentials** and access token
- **Use with caution** - real money involved

## 🛠️ Troubleshooting

### "Python not found"
```bash
# Install Python from https://python.org
# Make sure to check "Add to PATH" during installation
```

### "API Connection Failed"
- Check your API Key and Secret are correct
- Ensure you have an active Zerodha account
- Try the demo mode first

### "Algorithm won't deploy"
- Make sure the backend server is running (`start_trading_system.bat`)
- Check the console for error messages
- Verify your algorithm code is valid Python

## 📁 Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main web interface |
| `start_trading_system.bat` | Starts the backend server |
| `algorithm_executor.py` | Executes your algorithms |
| `api_server.py` | REST API for frontend-backend communication |
| `nifty_buy_algorithm.py` | Sample algorithm |

## 🎯 Next Steps

1. **Explore the interface** - Try all tabs and features
2. **Create your own algorithm** - Use the Code Editor
3. **Test in demo mode** - Deploy and monitor algorithms
4. **Set up OAuth** - For real trading (see DEPLOYMENT_GUIDE.md)
5. **Start small** - Use minimal quantities for real trading

## ⚠️ Safety First

- **Always test in demo mode first**
- **Start with small quantities**
- **Monitor your algorithms closely**
- **Set appropriate risk limits**
- **Never risk more than you can afford to lose**

---

**Ready to start? Run `start_trading_system.bat` and open `index.html`!** 🚀
