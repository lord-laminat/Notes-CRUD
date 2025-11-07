import os
import time
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL не установлена, пропускаю ожидание.")
    exit(0)

print(f"Ожидаю доступности БД по URL: {DATABASE_URL}")
engine = create_engine(DATABASE_URL)

retries = 0
max_retries = 60
wait_seconds = 1

while retries < max_retries:
    try:
        conn = engine.connect()
        conn.close()
        print("БД доступна.")
        exit(0)
    except OperationalError:
        retries += 1
        print(f"БД ещё не доступна, пробую снова ({retries}/{max_retries})...")
        time.sleep(wait_seconds)

print("Не удалось подключиться к БД в отведённое время.")
exit(1)
