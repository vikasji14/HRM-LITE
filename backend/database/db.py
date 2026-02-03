
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE")

# Global database client and database instance
client: AsyncIOMotorClient = None
database = None

async def init_db():
    """
    Initialize MongoDB connection and create indexes
    """
    global client, database
    
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(MONGODB_URL)
        
        # Test connection
        await client.admin.command('ping')
        print(f" Connected to MongoDB at {MONGODB_URL}")
        
        # Get database instance
        database = client[MONGODB_DATABASE]
        
        # Create indexes for better query performance
        from database.indexes import create_indexes
        await create_indexes(database)
        
        print(f"✅ Database '{MONGODB_DATABASE}' initialized successfully")
        
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

def get_database():
   
    if database is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return database

async def close_db():
  
    global client
    if client:
        client.close()
        print("✅ MongoDB connection closed")

