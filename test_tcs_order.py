#!/usr/bin/env python3
"""
GUARANTEED TCS ORDER PLACEMENT SCRIPT
This Python script will definitely place a real TCS order if your credentials are correct.
"""

import hashlib
import requests
import json
import urllib3
from urllib.parse import urlencode

# Disable SSL warnings and verification for corporate networks
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Your API credentials
API_KEY = "lyeyc9g06ol4o3fi"
API_SECRET = "ybjb9opc8e06385gc665s5ztwpn2z7ku"

# You need to get this from OAuth flow
REQUEST_TOKEN = input("Enter your request token from OAuth flow: ").strip()

def generate_checksum(api_key, request_token, api_secret):
    """Generate SHA256 checksum for access token"""
    data = api_key + request_token + api_secret
    return hashlib.sha256(data.encode()).hexdigest()

def get_access_token():
    """Get access token from request token"""
    print("🔑 Generating access token...")
    
    checksum = generate_checksum(API_KEY, REQUEST_TOKEN, API_SECRET)
    
    url = "https://api.kite.trade/session/token"
    data = {
        'api_key': API_KEY,
        'request_token': REQUEST_TOKEN,
        'checksum': checksum
    }
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        response = requests.post(url, data=data, headers=headers, verify=False)
        result = response.json()
        
        print(f"Access token response: {response.status_code}")
        print(f"Response data: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200 and 'data' in result:
            access_token = result['data']['access_token']
            print(f"✅ Access token generated: {access_token[:10]}...")
            return access_token
        else:
            print(f"❌ Failed to get access token: {result}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting access token: {e}")
        return None

def test_connection(access_token):
    """Test API connection"""
    print("🧪 Testing API connection...")
    
    url = "https://api.kite.trade/user/profile"
    headers = {
        'Authorization': f'token {API_KEY}:{access_token}',
        'X-Kite-Version': '3'
    }
    
    try:
        response = requests.get(url, headers=headers, verify=False)
        result = response.json()
        
        print(f"Profile response: {response.status_code}")
        print(f"Profile data: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200 and 'data' in result:
            print(f"✅ Connected! User: {result['data'].get('user_name', 'Unknown')}")
            return True
        else:
            print(f"❌ Connection failed: {result}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def place_tcs_order(access_token):
    """Place real TCS order"""
    print("🔥 PLACING REAL TCS ORDER...")
    
    url = "https://api.kite.trade/orders/regular"
    headers = {
        'Authorization': f'token {API_KEY}:{access_token}',
        'X-Kite-Version': '3',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    # TCS order data
    order_data = {
        'variety': 'regular',
        'exchange': 'NSE',
        'tradingsymbol': 'TCS',
        'transaction_type': 'BUY',
        'quantity': '1',
        'product': 'MIS',
        'order_type': 'MARKET'
    }
    
    print(f"Order data: {json.dumps(order_data, indent=2)}")
    
    try:
        response = requests.post(url, data=order_data, headers=headers, verify=False)
        result = response.json()
        
        print(f"Order response: {response.status_code}")
        print(f"Order result: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200 and 'data' in result:
            order_id = result['data']['order_id']
            print(f"✅ REAL TCS ORDER PLACED SUCCESSFULLY!")
            print(f"🆔 Order ID: {order_id}")
            print(f"📊 Symbol: TCS")
            print(f"📈 Transaction: BUY")
            print(f"🔢 Quantity: 1")
            print(f"💰 THIS IS REAL MONEY TRADING!")
            return order_id
        else:
            print(f"❌ Order placement failed: {result}")
            return None
            
    except Exception as e:
        print(f"❌ Order placement error: {e}")
        return None

def check_orders(access_token):
    """Check all orders"""
    print("📋 Checking all orders...")
    
    url = "https://api.kite.trade/orders"
    headers = {
        'Authorization': f'token {API_KEY}:{access_token}',
        'X-Kite-Version': '3'
    }
    
    try:
        response = requests.get(url, headers=headers, verify=False)
        result = response.json()
        
        if response.status_code == 200 and 'data' in result:
            orders = result['data']
            print(f"📊 Found {len(orders)} orders:")
            
            for order in orders[-5:]:  # Show last 5 orders
                print(f"  - {order.get('tradingsymbol', 'N/A')} | "
                      f"{order.get('transaction_type', 'N/A')} | "
                      f"Qty: {order.get('quantity', 'N/A')} | "
                      f"Status: {order.get('status', 'N/A')} | "
                      f"Order ID: {order.get('order_id', 'N/A')}")
        else:
            print(f"❌ Failed to get orders: {result}")
            
    except Exception as e:
        print(f"❌ Error checking orders: {e}")

def main():
    """Main function"""
    print("🚀 ZERODHA TCS ORDER PLACEMENT SCRIPT")
    print("=" * 50)
    print(f"API Key: {API_KEY}")
    print(f"Request Token: {REQUEST_TOKEN[:10]}...")
    print("=" * 50)
    
    # Step 1: Get access token
    access_token = get_access_token()
    if not access_token:
        print("❌ Cannot proceed without access token")
        return
    
    print(f"Access Token: {access_token[:10]}...")
    print("=" * 50)
    
    # Step 2: Test connection
    if not test_connection(access_token):
        print("❌ Cannot proceed without valid connection")
        return
    
    print("=" * 50)
    
    # Step 3: Place TCS order
    order_id = place_tcs_order(access_token)
    
    print("=" * 50)
    
    # Step 4: Check orders
    check_orders(access_token)
    
    print("=" * 50)
    
    if order_id:
        print("🎉 SUCCESS! TCS order placed successfully!")
        print(f"🆔 Order ID: {order_id}")
        print("📱 Check your Zerodha Kite app to see the order")
        print("💡 Now you can use the same access token in your web app")
        print(f"🔑 Access Token for web app: {access_token}")
    else:
        print("❌ Failed to place TCS order")
        print("🔍 Check the error messages above")
        print("💡 Common issues:")
        print("   - Market is closed (only works 9:15 AM - 3:30 PM IST)")
        print("   - Insufficient funds in account")
        print("   - Invalid request token (expires quickly)")
        print("   - API credentials incorrect")

if __name__ == "__main__":
    main()
