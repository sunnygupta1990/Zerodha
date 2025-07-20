# Zerodha Trading App

A comprehensive web-based trading application that connects with Zerodha's API to manage positions, create trading algorithms, and deploy automated trading strategies.

## Features

### 🔧 Settings & Configuration
- **API Configuration**: Secure storage of Zerodha API credentials
- **Trading Parameters**: Configure max positions, risk per trade, and auto-trading settings
- **Connection Testing**: Validate API credentials before trading
- **Persistent Storage**: All settings saved locally using localStorage

### 📊 Position Management
- **Real-time Positions**: View current stock positions with live P&L
- **Portfolio Overview**: Track quantity, average price, LTP, and day changes
- **Refresh Functionality**: Manual refresh to get latest position data
- **Connection Status**: Visual indicator of API connection status

### 💻 Code Editor
- **Syntax Highlighting**: Python code editor with syntax highlighting
- **Algorithm Management**: Create, save, edit, and delete trading algorithms
- **Code Persistence**: Algorithms saved locally with metadata
- **Rich Editor**: Powered by CodeMirror with features like auto-completion and bracket matching

### 🚀 Deployment System
- **Algorithm Deployment**: Deploy saved algorithms for live trading
- **Real-time Monitoring**: Track running deployments with live P&L updates
- **Trade Logging**: Monitor number of trades and performance metrics
- **Deployment Control**: Start, stop, and view logs for each deployment

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Code Editor**: CodeMirror
- **Styling**: Custom CSS with responsive design
- **Storage**: Browser localStorage for data persistence
- **API Integration**: Designed for Zerodha KiteConnect API

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Zerodha trading account with API access
- API Key and Secret from Zerodha Developer Console

### Installation

1. **Clone or Download** the project files to your local machine
2. **Open** `index.html` in your web browser
3. **Configure** your API settings in the Settings tab

### Initial Setup

1. **Deploy Your App to Web Hosting (REQUIRED)**
   - ⚠️ **IMPORTANT**: Zerodha API requires HTTPS URLs, local files won't work
   - Choose a hosting option: GitHub Pages, Netlify, Vercel (all FREE)
   - See `DEPLOYMENT_GUIDE.md` for detailed instructions
   - Upload all files: `index.html`, `app.js`, `styles.css`, `redirect.html`

2. **Create Zerodha App in Developer Console**
   - Go to [Zerodha Developer Console](https://developers.kite.trade/)
   - Create a new app
   - Use your hosted redirect URL: `https://yourdomain.com/redirect.html`
   - Note down your API Key and Secret

2. **Configure API Settings**
   - Navigate to Settings Tab in the app
   - Enter your Zerodha API Key and Secret
   - The redirect URL is pre-filled for you
   - Configure trading parameters (Max Positions, Risk Per Trade)

3. **Generate Request Token**
   - Click "Generate Zerodha Login URL" button
   - Complete the OAuth flow in the popup window
   - Copy the request token from the redirect page
   - Paste it in the Request Token field

4. **Test Connection**
   - Click "Test API Connection" to validate credentials
   - Successful connection will generate an access token

5. **Start Trading**
   - View positions in the Positions tab
   - Create algorithms in the Code Editor
   - Deploy algorithms in the Deployment tab

## Usage Guide

### Managing API Settings

```javascript
// Required Zerodha API credentials
{
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret", 
  "requestToken": "request_token_from_login",
  "accessToken": "auto_generated_after_connection"
}
```

### Creating Trading Algorithms

1. Go to the **Code Editor** tab
2. Click **"New"** to create a new algorithm
3. Enter algorithm name and description
4. Write your trading logic in Python
5. Click **"Save"** to store the algorithm

Example algorithm structure:
```python
# Sample Trading Algorithm
def main():
    # Your trading logic here
    # Access to positions, place orders, etc.
    pass

def calculate_signals():
    # Technical analysis logic
    pass

def risk_management():
    # Risk management rules
    pass
```

### Deploying Algorithms

1. Navigate to the **Deployment** tab
2. Select an algorithm from "Available Algorithms"
3. Click **"Deploy"** to start live trading
4. Monitor performance in "Running Deployments"
5. Use **"Stop"** to halt a deployment
6. View **"Logs"** for detailed trading activity

### Monitoring Positions

1. Go to the **Positions** tab
2. Click **"Refresh"** to get latest data
3. View real-time P&L and day changes
4. Monitor connection status indicator

## File Structure

```
zerodha-trading-app/
├── index.html          # Main HTML structure
├── styles.css          # Application styling
├── app.js             # Core JavaScript functionality
└── README.md          # Documentation
```

## Key Components

### ZerodhaApp Class
Main application class handling:
- Tab navigation and UI management
- API connection and settings management
- Algorithm CRUD operations
- Deployment lifecycle management
- Position data fetching and display

### Data Storage
- **Algorithms**: Stored in localStorage as JSON
- **Deployments**: Active deployments with real-time updates
- **Settings**: API credentials and trading parameters
- **Positions**: Fetched from API (mock data in demo)

## Security Considerations

⚠️ **Important Security Notes:**

1. **API Credentials**: Never share your API keys publicly
2. **Local Storage**: Credentials stored in browser localStorage
3. **HTTPS**: Use HTTPS in production for secure data transmission
4. **Token Management**: Implement proper token refresh mechanisms
5. **Risk Management**: Always set appropriate position limits

## Demo Mode

The application includes demo/mock functionality for testing:
- **Mock Positions**: Sample stock positions with realistic data
- **Simulated Trading**: Fake trading activity for deployed algorithms
- **Connection Simulation**: Mock API connection testing

## Customization

### Adding New Features
- Extend the `ZerodhaApp` class in `app.js`
- Add new UI components in `index.html`
- Style new elements in `styles.css`

### API Integration
Replace mock functions with actual Zerodha KiteConnect API calls:
- `getMockPositions()` → Real position fetching
- `simulateApiCall()` → Actual API authentication
- `simulateTrading()` → Real order placement

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Responsive Design

The application is fully responsive and works on:
- 💻 Desktop computers
- 📱 Tablets
- 📱 Mobile phones

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and personal use. Please ensure compliance with Zerodha's API terms of service.

## Support

For issues and questions:
1. Check the browser console for error messages
2. Verify API credentials are correct
3. Ensure stable internet connection
4. Review Zerodha API documentation

## Disclaimer

⚠️ **Trading Risk Warning:**
- Trading in financial markets involves substantial risk
- Past performance does not guarantee future results
- Only trade with money you can afford to lose
- This software is provided "as-is" without warranties
- Users are responsible for their trading decisions

---

**Happy Trading! 📈**
