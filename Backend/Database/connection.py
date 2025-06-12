import asyncpg
import asyncio
import psycopg2
from typing import Optional
from contextlib import asynccontextmanager, contextmanager
from config import settings

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def create_pool(self):
        """Create connection pool"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                host=settings.PGHOST,
                port=settings.PGPORT,
                user=settings.PGUSER,
                password=settings.PGPASSWORD,
                database=settings.PGDATABASE,
                min_size=5,
                max_size=20
            )
    
    async def close_pool(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
    
    @asynccontextmanager
    async def get_connection(self):
        """Get connection from pool as async context manager"""
        if not self.pool:
            await self.create_pool()
        
        async with self.pool.acquire() as connection:
            yield connection
    
    @contextmanager
    def get_sync_connection(self):
        """Get synchronous connection for sync operations"""
        conn = None
        try:
            conn = psycopg2.connect(
                host=settings.PGHOST,
                port=settings.PGPORT,
                user=settings.PGUSER,
                password=settings.PGPASSWORD,
                database=settings.PGDATABASE
            )
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        else:
            if conn:
                conn.commit()
        finally:
            if conn:
                conn.close()

# Global database instance
db = Database() 