# 🚀 ALGORITHM CREATION GUIDE FOR REAL TRADING

## 📋 How to Create Custom Trading Algorithms

Your trading app now supports **intelligent algorithm parsing** that can automatically detect trading signals from your code and place **real orders** on Zerodha!

## 🎯 SUPPORTED ALGORITHM PATTERNS

### **Pattern 1: Direct Symbol Declaration**
```python
# The app will detect TCS and place a BUY order
symbol = "TCS"
action = "BUY"
quantity = 5

# Or using tradingsymbol
tradingsymbol = "RELIANCE"
transaction = "SELL"
qty = 2
```

### **Pattern 2: Algorithm Name Detection**
```python
# Just name your algorithm with stock symbols
# Algorithm Name: "INFY Buy Strategy"
# The app will automatically place INFY BUY order

def main():
    print("This algorithm will buy INFY")
```

### **Pattern 3: Multiple Stock Trading**
```python
# Trade multiple stocks in one algorithm
stocks = ["TCS", "INFY", "RELIANCE"]
actions = ["BUY", "SELL", "BUY"]
quantities = [1, 2, 1]

for i, stock in enumerate(stocks):
    print(f"Trading {stock}: {actions[i]} {quantities[i]} shares")
```

### **Pattern 4: Comment-Based Detection**
```python
# The app scans comments for trading signals
# BUY TCS 5 shares
# SELL HDFC 3 shares
# LONG WIPRO 10 shares

def trading_strategy():
    # This will place real orders based on comments above
    pass
```

### **Pattern 5: Function-Based Orders**
```python
def place_order(symbol, quantity):
    # App detects this pattern and places real orders
    print(f"Placing order for {symbol}: {quantity} shares")

# These will become real orders
place_order("SBI", 5)
place_order("ICICI", 3)
```

## 📊 SUPPORTED SYMBOLS

### **NSE Stocks (Exchange: NSE)**
- TCS, INFY, RELIANCE, HDFC, ICICI
- SBI, ITC, WIPRO, HCLTECH, TECHM
- And many more NSE stocks

### **NIFTY Futures (Exchange: NFO)**
- NIFTY, BANKNIFTY
- Automatically uses correct exchange

## 🔧 ALGORITHM EXECUTION FLOW

When you deploy an algorithm:

1. **Code Parsing**: App scans your code for trading patterns
2. **Signal Extraction**: Identifies symbols, actions, and quantities
3. **Market Validation**: Checks if market is open
4. **Real Order Placement**: Places actual orders on Zerodha
5. **Monitoring**: Tracks P&L and position updates

## 📝 EXAMPLE ALGORITHMS

### **Example 1: Simple TCS Buy**
```python
# Algorithm Name: TCS Momentum Strategy
# Description: Buys TCS stock when deployed

def main():
    symbol = "TCS"
    action = "BUY"
    quantity = 1
    
    print(f"Executing {action} order for {symbol}")
    print(f"Quantity: {quantity}")
    print("This is real money trading!")
```

### **Example 2: Multi-Stock Portfolio**
```python
# Algorithm Name: Diversified Portfolio
# Description: Trades multiple stocks

def execute_portfolio():
    # Portfolio allocation
    portfolio = {
        "TCS": {"action": "BUY", "quantity": 2},
        "INFY": {"action": "BUY", "quantity": 3},
        "RELIANCE": {"action": "SELL", "quantity": 1}
    }
    
    for stock, details in portfolio.items():
        print(f"{details['action']} {details['quantity']} shares of {stock}")
```

### **Example 3: Conditional Trading**
```python
# Algorithm Name: HDFC Bank Strategy
# Description: Conditional HDFC trading

def hdfc_strategy():
    # Market analysis (simulated)
    market_trend = "bullish"
    
    if market_trend == "bullish":
        symbol = "HDFC"
        action = "BUY"
        quantity = 5
        print(f"Market is {market_trend}, executing {action} for {symbol}")
    else:
        print("Market conditions not favorable")
```

### **Example 4: NIFTY Futures Trading**
```python
# Algorithm Name: NIFTY Futures Scalping
# Description: NIFTY futures trading

def nifty_scalping():
    # NIFTY futures trading
    symbol = "NIFTY"  # App will use correct NIFTY symbol
    action = "BUY"
    quantity = 50  # 1 lot
    
    print(f"NIFTY Futures Trading: {action} {quantity} shares")
    print("High-frequency trading strategy")
```

## ⚙️ ALGORITHM DEPLOYMENT PROCESS

### **Step 1: Create Algorithm**
1. Go to **Editor** tab
2. Click **"New Algorithm"**
3. Enter algorithm name and description
4. Write your trading code
5. Click **"Save Algorithm"**

### **Step 2: Deploy for Real Trading**
1. Go to **Deploy** tab
2. Find your algorithm
3. Click **"🚀 Deploy for REAL TRADING"**
4. Algorithm will parse code and place real orders
5. Monitor in **Deployments** section

### **Step 3: Monitor Performance**
1. Check **Positions** tab for real positions
2. View **Logs** tab for detailed execution logs
3. Monitor P&L in deployment cards
4. Stop deployment when needed

## 🎯 ADVANCED FEATURES

### **Automatic Exchange Detection**
```python
# App automatically determines correct exchange
symbol = "TCS"      # → NSE
symbol = "NIFTY"    # → NFO
symbol = "RELIANCE" # → NSE
```

### **Default Strategy Fallback**
```python
# If no specific signals found, app places default TCS order
def my_algorithm():
    print("Custom logic here")
    # App will place default TCS BUY order
```

### **Market Hours Validation**
```python
# App automatically checks market hours
# Orders only placed during 9:15 AM - 3:30 PM IST
# Queued orders shown in logs
```

### **Real-time Logging**
```python
# Every action is logged in real-time
# Check Logs tab for detailed execution trace
# All API calls and responses logged
```

## 🚨 IMPORTANT NOTES

### **Real Money Trading**
- ⚠️ **All orders are REAL** and use real money
- Orders are placed on your actual Zerodha account
- MIS (Intraday) orders auto-square at 3:20 PM
- Check positions in Zerodha Kite app

### **Market Hours**
- Orders only placed during market hours
- Monday to Friday: 9:15 AM - 3:30 PM IST
- Weekend/holiday orders are queued

### **Risk Management**
- Start with small quantities (1-2 shares)
- Test algorithms during market hours
- Monitor positions actively
- Use stop-losses in your strategy

## 🎉 GETTING STARTED

1. **Test the Python script first** to ensure API works
2. **Create a simple algorithm** with TCS or INFY
3. **Deploy during market hours** to see real orders
4. **Check Zerodha Kite app** for order confirmation
5. **Scale up** once comfortable with the system

## 📞 TROUBLESHOOTING

### **No Orders Placed**
- Check if market is open
- Verify API connection in Settings
- Ensure algorithm contains recognizable patterns
- Check Logs tab for detailed errors

### **Algorithm Not Detected**
- Use clear symbol names (TCS, INFY, etc.)
- Include action keywords (BUY, SELL)
- Add quantity specifications
- Check algorithm name for stock symbols

### **API Errors**
- Verify access token is valid
- Check account balance
- Ensure sufficient margin
- Review Zerodha account status

**Your algorithms can now place real trades automatically!** 🚀
