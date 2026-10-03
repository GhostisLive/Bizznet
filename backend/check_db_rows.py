import sqlite3
conn = sqlite3.connect(r'D:\Sangram\project\bizznet\Bizznet\backend\local_ledger.db')
cursor = conn.cursor()

# Check all tables and row counts
cursor.execute('SELECT name FROM sqlite_master WHERE type="table";')
tables = cursor.fetchall()

for t in tables:
    table_name = t[0]
    cursor.execute(f'SELECT COUNT(*) FROM {table_name}')
    count = cursor.fetchone()[0]
    print(f'{table_name}: {count} rows')

conn.close()