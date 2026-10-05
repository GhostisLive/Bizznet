import asyncio
from sqlalchemy import text
from app.database import get_engine

async def check_duplicates():
    engine = get_engine()
    async with engine.begin() as conn:
        # Check for duplicate listings with same title and organization
        result = await conn.execute(text("""
            SELECT title, organization_id, COUNT(*) as count
            FROM listings
            GROUP BY title, organization_id
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        """))
        
        duplicates = result.fetchall()
        if duplicates:
            print("Found duplicate listings:")
            for row in duplicates:
                print(f"  Title: {row[0]}, Org: {row[1]}, Count: {row[2]}")
        else:
            print("No duplicate listings found")
        
        # Show all listings
        result = await conn.execute(text("SELECT id, title, organization_id, status, created_at FROM listings ORDER BY created_at DESC LIMIT 10"))
        print("\nRecent listings:")
        for row in result.fetchall():
            print(f"  {row[0][:8]}... | {row[1][:30]} | Status: {row[3]} | Created: {row[4]}")

if __name__ == "__main__":
    asyncio.run(check_duplicates())
