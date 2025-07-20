#!/usr/bin/env python3
"""
Algorithm Executor Service
Handles deployment and execution of trading algorithms
"""

import json
import time
import threading
import datetime
import logging
import traceback
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from kiteconnect import KiteConnect
import subprocess
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('algorithm_executor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class DeploymentConfig:
    """Configuration for algorithm deployment"""
    algorithm_id: str
    algorithm_name: str
    algorithm_code: str
    api_key: str
    access_token: str
    max_positions: int = 10
    risk_per_trade: float = 2.0
    auto_trade: bool = True
    status: str = "stopped"
    created_at: str = ""
    profit: float = 0.0
    trades: int = 0

@dataclass
class TradeResult:
    """Result of a trade execution"""
    order_id: str
    symbol: str
    transaction_type: str
    quantity: int
    price: float
    status: str
    timestamp: str
    error: Optional[str] = None

class AlgorithmExecutor:
    """Main class for executing trading algorithms"""
    
    def __init__(self):
        self.deployments: Dict[str, DeploymentConfig] = {}
        self.running_threads: Dict[str, threading.Thread] = {}
        self.stop_flags: Dict[str, threading.Event] = {}
        self.kite_instances: Dict[str, KiteConnect] = {}
        self.load_deployments()
        
    def load_deployments(self):
        """Load existing deployments from file"""
        try:
            if os.path.exists('deployments.json'):
                with open('deployments.json', 'r') as f:
                    data = json.load(f)
                    for dep_id, dep_data in data.items():
                        self.deployments[dep_id] = DeploymentConfig(**dep_data)
                logger.info(f"Loaded {len(self.deployments)} deployments")
        except Exception as e:
            logger.error(f"Error loading deployments: {e}")
    
    def save_deployments(self):
        """Save deployments to file"""
        try:
            data = {dep_id: asdict(dep) for dep_id, dep in self.deployments.items()}
            with open('deployments.json', 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving deployments: {e}")
    
    def deploy_algorithm(self, config: DeploymentConfig) -> bool:
        """Deploy and start an algorithm"""
        try:
            # Validate configuration
            if not self._validate_config(config):
                return False
            
            # Initialize KiteConnect instance
            kite = KiteConnect(api_key=config.api_key)
            kite.set_access_token(config.access_token)
            self.kite_instances[config.algorithm_id] = kite
            
            # Test connection
            try:
                profile = kite.profile()
                logger.info(f"Connected to Zerodha account: {profile.get('user_name', 'Unknown')}")
            except Exception as e:
                logger.error(f"Failed to connect to Zerodha API: {e}")
                return False
            
            # Update deployment status
            config.status = "running"
            config.created_at = datetime.datetime.now().isoformat()
            self.deployments[config.algorithm_id] = config
            
            # Create stop flag
            stop_flag = threading.Event()
            self.stop_flags[config.algorithm_id] = stop_flag
            
            # Start execution thread
            thread = threading.Thread(
                target=self._execute_algorithm,
                args=(config, stop_flag),
                daemon=True
            )
            thread.start()
            self.running_threads[config.algorithm_id] = thread
            
            self.save_deployments()
            logger.info(f"Algorithm '{config.algorithm_name}' deployed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error deploying algorithm: {e}")
            return False
    
    def stop_algorithm(self, algorithm_id: str) -> bool:
        """Stop a running algorithm"""
        try:
            if algorithm_id in self.stop_flags:
                self.stop_flags[algorithm_id].set()
                
            if algorithm_id in self.running_threads:
                self.running_threads[algorithm_id].join(timeout=5)
                del self.running_threads[algorithm_id]
                
            if algorithm_id in self.deployments:
                self.deployments[algorithm_id].status = "stopped"
                
            if algorithm_id in self.kite_instances:
                del self.kite_instances[algorithm_id]
                
            if algorithm_id in self.stop_flags:
                del self.stop_flags[algorithm_id]
                
            self.save_deployments()
            logger.info(f"Algorithm {algorithm_id} stopped successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping algorithm: {e}")
            return False
    
    def get_deployment_status(self, algorithm_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a deployment"""
        if algorithm_id in self.deployments:
            return asdict(self.deployments[algorithm_id])
        return None
    
    def get_all_deployments(self) -> Dict[str, Dict[str, Any]]:
        """Get all deployments"""
        return {dep_id: asdict(dep) for dep_id, dep in self.deployments.items()}
    
    def _validate_config(self, config: DeploymentConfig) -> bool:
        """Validate deployment configuration"""
        if not config.api_key:
            logger.error("API Key is required")
            return False
            
        if not config.access_token:
            logger.error("Access Token is required")
            return False
            
        if not config.algorithm_code:
            logger.error("Algorithm code is required")
            return False
            
        return True
    
    def _execute_algorithm(self, config: DeploymentConfig, stop_flag: threading.Event):
        """Execute algorithm in a separate thread"""
        logger.info(f"Starting execution of algorithm: {config.algorithm_name}")
        
        try:
            # Create a temporary Python file with the algorithm code
            temp_file = f"temp_algorithm_{config.algorithm_id}.py"
            
            # Prepare the algorithm code with KiteConnect integration
            enhanced_code = self._enhance_algorithm_code(config)
            
            with open(temp_file, 'w') as f:
                f.write(enhanced_code)
            
            # Execute the algorithm
            while not stop_flag.is_set():
                try:
                    # Run the algorithm
                    result = subprocess.run(
                        [sys.executable, temp_file],
                        capture_output=True,
                        text=True,
                        timeout=300  # 5 minute timeout
                    )
                    
                    if result.returncode == 0:
                        logger.info(f"Algorithm {config.algorithm_name} executed successfully")
                        logger.info(f"Output: {result.stdout}")
                        
                        # Update trade count and profit (mock for now)
                        self.deployments[config.algorithm_id].trades += 1
                        # In real implementation, parse the output to get actual P&L
                        
                    else:
                        logger.error(f"Algorithm {config.algorithm_name} failed: {result.stderr}")
                    
                    # Wait before next execution (configurable interval)
                    if not stop_flag.wait(60):  # Wait 1 minute between executions
                        continue
                    else:
                        break
                        
                except subprocess.TimeoutExpired:
                    logger.warning(f"Algorithm {config.algorithm_name} execution timed out")
                except Exception as e:
                    logger.error(f"Error executing algorithm {config.algorithm_name}: {e}")
                    
                # Wait before retry
                if not stop_flag.wait(30):  # Wait 30 seconds before retry
                    continue
                else:
                    break
                    
        except Exception as e:
            logger.error(f"Fatal error in algorithm execution: {e}")
            logger.error(traceback.format_exc())
        finally:
            # Cleanup
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
            
            # Update status
            if config.algorithm_id in self.deployments:
                self.deployments[config.algorithm_id].status = "stopped"
                self.save_deployments()
            
            logger.info(f"Algorithm {config.algorithm_name} execution ended")
    
    def _enhance_algorithm_code(self, config: DeploymentConfig) -> str:
        """Enhance algorithm code with KiteConnect integration"""
        
        # Add imports and setup code
        setup_code = f'''
import sys
import os
import json
import datetime
import logging
from kiteconnect import KiteConnect

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize KiteConnect
kite = KiteConnect(api_key="{config.api_key}")
kite.set_access_token("{config.access_token}")

# Global configuration
MAX_POSITIONS = {config.max_positions}
RISK_PER_TRADE = {config.risk_per_trade}
AUTO_TRADE = {config.auto_trade}

def get_positions():
    """Get current positions"""
    try:
        return kite.positions()
    except Exception as e:
        logger.error(f"Error getting positions: {{e}}")
        return {{"net": [], "day": []}}

def place_order(symbol, transaction_type, quantity, order_type="MARKET", product="MIS"):
    """Place an order using KiteConnect"""
    try:
        if not AUTO_TRADE:
            logger.info(f"AUTO_TRADE disabled. Would place order: {{transaction_type}} {{quantity}} {{symbol}}")
            return f"MOCK_ORDER_{{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}}"
        
        order_id = kite.place_order(
            variety=kite.VARIETY_REGULAR,
            exchange=kite.EXCHANGE_NFO,
            tradingsymbol=symbol,
            transaction_type=transaction_type,
            quantity=quantity,
            product=product,
            order_type=order_type
        )
        
        logger.info(f"Order placed successfully: {{order_id}}")
        return order_id
        
    except Exception as e:
        logger.error(f"Error placing order: {{e}}")
        return None

def get_quote(symbol):
    """Get quote for a symbol"""
    try:
        return kite.quote(f"NFO:{{symbol}}")
    except Exception as e:
        logger.error(f"Error getting quote: {{e}}")
        return None

# Original algorithm code starts here:
'''
        
        return setup_code + "\n" + config.algorithm_code

class AlgorithmAPI:
    """REST API interface for algorithm management"""
    
    def __init__(self, executor: AlgorithmExecutor):
        self.executor = executor
    
    def deploy(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy algorithm endpoint"""
        try:
            config = DeploymentConfig(**request_data)
            success = self.executor.deploy_algorithm(config)
            
            return {
                "success": success,
                "message": "Algorithm deployed successfully" if success else "Failed to deploy algorithm",
                "algorithm_id": config.algorithm_id
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "algorithm_id": None
            }
    
    def stop(self, algorithm_id: str) -> Dict[str, Any]:
        """Stop algorithm endpoint"""
        success = self.executor.stop_algorithm(algorithm_id)
        return {
            "success": success,
            "message": "Algorithm stopped successfully" if success else "Failed to stop algorithm"
        }
    
    def status(self, algorithm_id: str) -> Dict[str, Any]:
        """Get algorithm status endpoint"""
        status = self.executor.get_deployment_status(algorithm_id)
        return {
            "success": status is not None,
            "data": status
        }
    
    def list_all(self) -> Dict[str, Any]:
        """List all deployments endpoint"""
        deployments = self.executor.get_all_deployments()
        return {
            "success": True,
            "data": deployments
        }

def main():
    """Main function to run the executor service"""
    executor = AlgorithmExecutor()
    api = AlgorithmAPI(executor)
    
    logger.info("Algorithm Executor Service started")
    
    # Keep the service running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down Algorithm Executor Service")
        
        # Stop all running algorithms
        for algorithm_id in list(executor.deployments.keys()):
            if executor.deployments[algorithm_id].status == "running":
                executor.stop_algorithm(algorithm_id)

if __name__ == "__main__":
    main()
