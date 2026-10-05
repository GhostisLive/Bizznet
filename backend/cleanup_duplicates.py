#!/usr/bin/env python3
"""
Cleanup script to remove duplicate listings from the database.
This keeps the most recent listing for each product and removes older duplicates.
"""

import asyncio
import sys
from sqlalchemy import text
from app.database import engine

async def cleanup_duplicates():
    async with engine.begin() as conn:
        print("Checking for duplicate listings...")
        
        # Find duplicate listings (same title, org, category, and price)
        # This query identifies groups of duplicates
        result = await conn.execute(text("""
            WITH duplicates AS (
                SELECT 
                    id,
                    title,
                    organization_id,
                    created_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY title, organization_id, category, price, moq, unit 
                        ORDER BY created_at DESC
                    ) as row_num
                FROM listings
                WHERE status = 'active'
            )
            SELECT id, title, created_at
            FROM duplicates
            WHERE row_num > 1
            ORDER BY created_at DESC
        """))
        
        duplicates = result.fetchall()
        
        if not duplicates:
            print("✓ No duplicate listings found!")
            return
        
        print(f"Found {len(duplicates)} duplicate listing(s) to remove:")
        for dup in duplicates:
            listing_id = str(dup[0])
            title = str(dup[1])
            created = str(dup[2])
            print(f"  - ID: {listing_id[:13]}... | Title: {title[:40]} | Created: {created}")
        
        # Remove the duplicates
        for dup in duplicates:
            listing_id = str(dup[0])
            
            # First, unlink any products that reference this listing
            await conn.execute(
                text("UPDATE products SET listing_id = NULL WHERE listing_id = :listing_id"),
                {"listing_id": listing_id}
            )
            
            # Then delete the duplicate listing
            await conn.execute(
                text("DELETE FROM listings WHERE id = :listing_id"),
                {"listing_id": listing_id}
            )
            
            print(f"  ✓ Removed duplicate: {listing_id[:13]}...")
        
        print(f"\n✓ Cleanup complete! Removed {len(duplicates)} duplicate listing(s).")
        
        # Show remaining listings summary
        result = await conn.execute(text("""
            SELECT COUNT(*) as total, status 
            FROM listings 
            GROUP BY status
        """))
        
        print("\nCurrent listings summary:")
        for row in result.fetchall():
            print(f"  {row[1]}: {row[0]}")

if __name__ == "__main__":
    try:
        asyncio.run(cleanup_duplicates())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
