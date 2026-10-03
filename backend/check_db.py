import sqlite3
conn = sqlite3.connect(r'D:\Sangram\project\bizznet\Bizznet\backend\local_ledger.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type="table";')
tables = cursor.fetchall()
for t in tables:
    print(t[0])
    cursor.execute('PRAGMA table_info(' + t[0] + ')')
    cols = cursor.fetchall()
    for c in cols:
        print('  ' + c[1] + ': ' + c[2])