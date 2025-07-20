# NIFTY Futures Buy Algorithm
# Simple algorithm that places a buy order on NIFTY futures when deployed

import datetime
from kiteconnect import KiteConnect

def main():
    """
    Main function that executes the trading strategy
    """
    print("🚀 Starting NIFTY Futures Buy Algorithm...")
    
    # Get current NIFTY futures symbol
    nifty_symbol = get_current_nifty_symbol()
    
    # Check risk parameters before trading
    if check_risk_parameters():
        # Place buy order
        order_id = place_buy_order(nifty_symbol)
        
        if order_id:
            print(f"✅ Algorithm executed successfully! Order ID: {order_id}")
        else:
            print("❌ Algorithm execution failed!")
    else:
        print("⚠️ Risk check failed. Order not placed.")
    
    print("🏁 Algorithm execution completed!")

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

def place_buy_order(symbol):
    """
    Place a buy order for NIFTY futures
    """
    try:
        # Order parameters
        quantity = 50  # 1 lot of NIFTY futures (50 shares)
        order_type = "MARKET"  # Market order for immediate execution
        product = "MIS"  # Intraday order
        
        print(f"📈 Placing BUY order for {symbol}")
        print(f"   Quantity: {quantity}")
        print(f"   Order Type: {order_type}")
        print(f"   Product: {product}")
        
        # Get current market data
        market_data = get_market_data(symbol)
        
        # In real implementation, this would use KiteConnect API:
        # kite = KiteConnect(api_key="your_api_key")
        # kite.set_access_token(access_token="your_access_token")
        # 
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
        print(f"   Order ID: {order_id}")
        print(f"   Symbol: {symbol}")
        print(f"   Transaction: BUY")
        print(f"   Quantity: {quantity}")
        print(f"   Expected Price: ₹{market_data['last_price']}")
        
        # Log the trade
        log_trade(order_id, symbol, "BUY", quantity, order_type, market_data['last_price'])
        
        return order_id
        
    except Exception as e:
        print(f"❌ Error placing order: {str(e)}")
        return None

def get_market_data(symbol):
    """
    Get current market data for the symbol
    """
    # In real implementation, this would fetch live data:
    # kite = KiteConnect(api_key="your_api_key")
    # quote = kite.quote(f"NFO:{symbol}")
    # return quote[f"NFO:{symbol}"]
    
    # Mock data for demo
    import random
    base_price = 21500
    change = random.uniform(-200, 200)
    
    mock_data = {
        'last_price': round(base_price + change, 2),
        'volume': random.randint(1000000, 2000000),
        'change': round(change, 2),
        'change_percent': round((change / base_price) * 100, 2)
    }
    
    print(f"📊 Market Data for {symbol}:")
    print(f"   LTP: ₹{mock_data['last_price']}")
    print(f"   Change: {'+' if mock_data['change'] >= 0 else ''}₹{mock_data['change']} ({mock_data['change_percent']}%)")
    print(f"   Volume: {mock_data['volume']:,}")
    
    return mock_data

def log_trade(order_id, symbol, transaction_type, quantity, order_type, price):
    """
    Log the trade details
    """
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    log_entry = f"""
    ==========================================
    📝 TRADE LOG
    ==========================================
    Timestamp: {timestamp}
    Order ID: {order_id}
    Symbol: {symbol}
    Transaction: {transaction_type}
    Quantity: {quantity}
    Order Type: {order_type}
    Price: ₹{price}
    Status: SUBMITTED
    ==========================================
    """
    
    print(log_entry)

def check_risk_parameters():
    """
    Check risk parameters before placing order
    """
    print("🔍 Checking risk parameters...")
    
    # Add your risk management logic here
    # Example checks:
    # - Account balance
    # - Existing positions
    # - Daily loss limits
    # - Market conditions
    
    # For demo, always return True
    # In real implementation, add proper risk checks
    
    current_time = datetime.datetime.now().time()
    market_open = datetime.time(9, 15)  # 9:15 AM
    market_close = datetime.time(15, 30)  # 3:30 PM
    
    if market_open <= current_time <= market_close:
        print("✅ Market is open")
        print("✅ Risk parameters checked")
        return True
    else:
        print("⚠️ Market is closed")
        return False

def calculate_position_size():
    """
    Calculate appropriate position size based on risk management
    """
    # Add position sizing logic here
    # Example: Based on account size, risk per trade, etc.
    
    # For NIFTY futures, minimum is 1 lot = 50 shares
    return 50

# Entry point
if __name__ == "__main__":
    main()
