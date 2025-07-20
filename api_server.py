#!/usr/bin/env python3
"""
Flask API Server for Algorithm Deployment
Provides REST API endpoints for the frontend to manage algorithm deployments
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import threading
import time
from algorithm_executor import AlgorithmExecutor, AlgorithmAPI, DeploymentConfig

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Global executor instance
executor = AlgorithmExecutor()
api = AlgorithmAPI(executor)

@app.route('/api/deploy', methods=['POST'])
def deploy_algorithm():
    """Deploy an algorithm"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['algorithm_id', 'algorithm_name', 'algorithm_code', 'api_key', 'access_token']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        result = api.deploy(data)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/stop/<algorithm_id>', methods=['POST'])
def stop_algorithm(algorithm_id):
    """Stop a running algorithm"""
    try:
        result = api.stop(algorithm_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/status/<algorithm_id>', methods=['GET'])
def get_algorithm_status(algorithm_id):
    """Get status of a specific algorithm"""
    try:
        result = api.status(algorithm_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/deployments', methods=['GET'])
def list_deployments():
    """List all deployments"""
    try:
        result = api.list_all()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Algorithm Executor API is running',
        'active_deployments': len([d for d in executor.deployments.values() if d.status == 'running'])
    })

@app.route('/api/logs/<algorithm_id>', methods=['GET'])
def get_algorithm_logs(algorithm_id):
    """Get logs for a specific algorithm"""
    try:
        # Read logs from file (if exists)
        log_file = f'algorithm_{algorithm_id}.log'
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                logs = f.read()
        else:
            logs = "No logs available"
        
        return jsonify({
            'success': True,
            'logs': logs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error reading logs: {str(e)}'
        }), 500

@app.route('/api/test-connection', methods=['POST'])
def test_api_connection():
    """Test Zerodha API connection"""
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        access_token = data.get('access_token')
        
        if not api_key or not access_token:
            return jsonify({
                'success': False,
                'message': 'API Key and Access Token are required'
            }), 400
        
        from kiteconnect import KiteConnect
        kite = KiteConnect(api_key=api_key)
        kite.set_access_token(access_token)
        
        # Test connection by getting profile
        profile = kite.profile()
        
        return jsonify({
            'success': True,
            'message': 'Connection successful',
            'user_name': profile.get('user_name', 'Unknown'),
            'broker': profile.get('broker', 'Unknown')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Connection failed: {str(e)}'
        }), 400

@app.route('/api/positions', methods=['POST'])
def get_positions():
    """Get current positions"""
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        access_token = data.get('access_token')
        
        if not api_key or not access_token:
            return jsonify({
                'success': False,
                'message': 'API Key and Access Token are required'
            }), 400
        
        from kiteconnect import KiteConnect
        kite = KiteConnect(api_key=api_key)
        kite.set_access_token(access_token)
        
        # Get positions
        positions = kite.positions()
        
        return jsonify({
            'success': True,
            'positions': positions
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting positions: {str(e)}'
        }), 400

def run_background_monitor():
    """Background thread to monitor deployments"""
    while True:
        try:
            # Update deployment statuses
            for deployment_id, deployment in executor.deployments.items():
                if deployment.status == 'running':
                    # Check if thread is still alive
                    if deployment_id not in executor.running_threads or not executor.running_threads[deployment_id].is_alive():
                        deployment.status = 'stopped'
                        executor.save_deployments()
            
            time.sleep(10)  # Check every 10 seconds
        except Exception as e:
            print(f"Error in background monitor: {e}")
            time.sleep(30)

if __name__ == '__main__':
    # Start background monitoring thread
    monitor_thread = threading.Thread(target=run_background_monitor, daemon=True)
    monitor_thread.start()
    
    print("Starting Algorithm Executor API Server...")
    print("API endpoints available at:")
    print("  POST /api/deploy - Deploy algorithm")
    print("  POST /api/stop/<id> - Stop algorithm")
    print("  GET  /api/status/<id> - Get algorithm status")
    print("  GET  /api/deployments - List all deployments")
    print("  GET  /api/health - Health check")
    print("  POST /api/test-connection - Test API connection")
    print("  POST /api/positions - Get positions")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)
