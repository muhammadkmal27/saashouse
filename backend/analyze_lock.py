import os

lock_path = r"c:\Users\mypc\Desktop\saas_house\backend\Cargo.lock"
with open(lock_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_package(name):
    pkg_start = -1
    for i, line in enumerate(lines):
        if line.startswith('[[package]]'):
            pkg_start = i
        elif line.startswith(f'name = "{name}"'):
            # Found package!
            print(f"Found package: {name}")
            # Find its dependencies and version
            j = pkg_start
            while j < len(lines) and not (j > pkg_start and lines[j].startswith('[[package]]')):
                print(f"  {lines[j].strip()}")
                j += 1
            print("-" * 20)

find_package("rsa")
find_package("sqlx-mysql")
find_package("sqlx")
find_package("paste")
