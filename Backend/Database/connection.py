import asyncpg
import asyncio
from typing import Optional
from contextlib import asynccontextmanager
from config import settings

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def create_pool(self):
        """Create connection pool with proper configuration"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                host=settings.PGHOST,
                port=settings.PGPORT,
                user=settings.PGUSER,
                password=settings.PGPASSWORD,
                database=settings.PGDATABASE,
                min_size=2,  # Reduced from 5
                max_size=10,  # Reduced from 20
                max_queries=50000,  # Limit queries per connection
                max_inactive_connection_lifetime=300,  # 5 minutes
                command_timeout=30,  # 30 second timeout for commands
            )
            print(f"✅ Database pool created with {self.pool.get_size()} connections")
    
    async def close_pool(self):
        """Close connection pool with timeout"""
        if self.pool:
            try:
                # Check pool status before closing
                self.check_pool_status()
                
                # Set a timeout for pool closure to prevent hanging
                await asyncio.wait_for(self.pool.close(), timeout=10.0)
                print("✅ Database pool closed successfully")
            except asyncio.TimeoutError:
                print("⚠️ Database pool close timed out - forcing closure")
                # Force close any remaining connections
                if hasattr(self.pool, '_holders'):
                    for holder in list(self.pool._holders):
                        if holder._con and not holder._con.is_closed():
                            holder._con.close()
            except Exception as e:
                print(f"⚠️ Error closing database pool: {e}")
            finally:
                self.pool = None
    
    def check_pool_status(self):
        """Check and log pool status for debugging"""
        if self.pool:
            try:
                size = self.pool.get_size()
                idle = self.pool.get_idle_size()
                print(f"📊 Pool status - Total: {size}, Idle: {idle}, Active: {size - idle}")
                
                if size - idle > 0:
                    print(f"⚠️ Warning: {size - idle} connections still active during shutdown")
            except Exception as e:
                print(f"⚠️ Error checking pool status: {e}")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get connection from pool as async context manager"""
        if not self.pool:
            await self.create_pool()
        
        connection = None
        try:
            connection = await asyncio.wait_for(self.pool.acquire(), timeout=10.0)
            yield connection
        except asyncio.TimeoutError:
            print("⚠️ Database connection acquisition timed out")
            raise Exception("Database connection timeout")
        except Exception as e:
            print(f"⚠️ Database connection error: {e}")
            raise
        finally:
            if connection:
                try:
                    await self.pool.release(connection)
                except Exception as e:
                    print(f"⚠️ Error releasing connection: {e}")

# Global database instance
db = Database() 