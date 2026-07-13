"""Quick verification script — lists all tables and row counts."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_connection

conn = get_connection()
cur = conn.cursor()

cur.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' ORDER BY table_name;
""")
tables = [r[0] for r in cur.fetchall()]
print("Tables in database:")
for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM {t};")
    count = cur.fetchone()[0]
    print(f"  {t:<30} {count:>10} rows")

cur.close()
conn.close()
print("\nVerification complete.")
