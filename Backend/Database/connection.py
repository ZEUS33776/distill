import asyncpg
import asyncio
from typing import Optional
from contextlib import asynccontextmanager
from config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def create_pool(self):
        """Create connection pool with robust configuration"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                host=settings.PGHOST,
                port=settings.PGPORT,
                user=settings.PGUSER,
                password=settings.PGPASSWORD,
                database=settings.PGDATABASE,
                min_size=3,  # Minimum active connections
                max_size=15,  # Maximum connections
                max_queries=10000,  # Limit queries per connection before recycling
                max_inactive_connection_lifetime=1800,  # 30 minutes
                command_timeout=60,  # 60 second timeout for commands
                server_settings={
                    'application_name': 'distill_backend',
                    'tcp_keepalives_idle': '600',  # 10 minutes
                    'tcp_keepalives_interval': '30',  # 30 seconds  
                    'tcp_keepalives_count': '3'  # 3 retries
                }
            )
            logger.info(f"✅ Database pool created with {self.pool.get_size()} connections")
    
    async def close_pool(self):
        """Close connection pool with timeout"""
        if self.pool:
            try:
                # Check pool status before closing
                self.check_pool_status()
                
                # Set a timeout for pool closure to prevent hanging
                await asyncio.wait_for(self.pool.close(), timeout=15.0)
                logger.info("✅ Database pool closed successfully")
            except asyncio.TimeoutError:
                logger.warning("⚠️ Database pool close timed out - forcing closure")
                # Force close any remaining connections
                if hasattr(self.pool, '_holders'):
                    for holder in list(self.pool._holders):
                        if holder._con and not holder._con.is_closed():
                            holder._con.close()
            except Exception as e:
                logger.error(f"⚠️ Error closing database pool: {e}")
            finally:
                self.pool = None
    
    def check_pool_status(self):
        """Check and log pool status for debugging"""
        if self.pool:
            try:
                size = self.pool.get_size()
                idle = self.pool.get_idle_size()
                logger.info(f"📊 Pool status - Total: {size}, Idle: {idle}, Active: {size - idle}")
                
                if size - idle > 8:  # Alert if more than 8 active connections
                    logger.warning(f"⚠️ High connection usage: {size - idle} active connections")
            except Exception as e:
                logger.error(f"⚠️ Error checking pool status: {e}")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get connection from pool with retry logic and better error handling"""
        if not self.pool:
            await self.create_pool()
        
        connection = None
        max_retries = 3
        retry_delay = 0.5
        
        for attempt in range(max_retries):
            try:
                # Try to acquire connection with timeout
                connection = await asyncio.wait_for(self.pool.acquire(), timeout=15.0)
                
                # Test connection health
                await connection.fetchval("SELECT 1")
                
                yield connection
                return
                
            except asyncio.TimeoutError:
                logger.warning(f"🔄 Connection timeout (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    raise Exception("Database connection timeout after retries")
                    
            except asyncpg.exceptions.ConnectionDoesNotExistError:
                logger.warning(f"🔄 Connection closed, recreating pool (attempt {attempt + 1}/{max_retries})")
                if connection:
                    try:
                        await self.pool.release(connection, timeout=1.0)
                    except:
                        pass
                    connection = None
                
                # Recreate pool on connection errors
                try:
                    await self.close_pool()
                    await self.create_pool()
                except Exception as pool_error:
                    logger.error(f"Error recreating pool: {pool_error}")
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    raise Exception("Database connection failed after retries")
                    
            except Exception as e:
                logger.error(f"💥 Database connection error (attempt {attempt + 1}/{max_retries}): {e}")
                if connection:
                    try:
                        await self.pool.release(connection, timeout=1.0)
                    except:
                        pass
                    connection = None
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    raise Exception(f"Database connection failed: {e}")
                    
            finally:
                if connection and attempt == max_retries - 1:
                    try:
                        await self.pool.release(connection, timeout=5.0)
                    except Exception as release_error:
                        logger.error(f"⚠️ Error releasing connection: {release_error}")

# Global database instance
db = Database()