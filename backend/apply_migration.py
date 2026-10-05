#!/usr/bin/env python3
"""
Apply database migration for RFQ and Orders tables.
"""

import asyncio
import sys
from sqlalchemy import text
from app.database import engine

async def apply_migration():
    print("Applying migration: Add RFQ and Orders tables...")
    
    try:
        migration_file = "migrations/003_add_rfq_and_orders.sql"
        
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        async with engine.begin() as conn:
            # Split by semicolon and execute each statement
            statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
            
            for i, statement in enumerate(statements, 1):
                if statement and not statement.startswith('--'):
                    try:
                        await conn.execute(text(statement))
                        print(f"✓ Executed statement {i}/{len(statements)}")
                    except Exception as e:
                        # Skip if table already exists
                        if "already exists" in str(e):
                            print(f"⊙ Statement {i}: Table already exists (skipping)")
                        else:
                            raise
        
        print("\n✓ Migration applied successfully!")
        
        # Verify tables were created
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('rfqs', 'rfq_bids', 'orders', 'order_status_history', 'order_documents')
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result.fetchall()]
            
            print(f"\nVerified tables ({len(tables)}):")
            for table in tables:
                print(f"  ✓ {table}")
            
            if len(tables) == 5:
                print("\n✅ All tables created successfully!")
            else:
                print(f"\n⚠️  Expected 5 tables, found {len(tables)}")
    
    except FileNotFoundError:
        print(f"❌ Migration file not found: {migration_file}")
        print("   Make sure you're running this from the backend directory")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(apply_migration())
