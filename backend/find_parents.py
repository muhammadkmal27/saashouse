import os

lock_path = r"c:\Users\mypc\Desktop\saas_house\backend\Cargo.lock"
with open(lock_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_parents(child_name):
    print(f"Finding parents of: {child_name}")
    current_pkg = None
    in_dependencies = False
    for line in lines:
        if line.startswith('[[package]]'):
            current_pkg = None
            in_dependencies = False
        elif line.startswith('name = '):
            current_pkg = line.split('=')[1].strip().strip('"')
        elif line.startswith('dependencies = ['):
            in_dependencies = True
        elif line.startswith(']'):
            in_dependencies = False
        elif in_dependencies:
            dep_name = line.strip().strip('"').split(' ')[0]
            if dep_name == child_name:
                print(f"  Parent found: {current_pkg}")

find_parents("sqlx-mysql")
find_parents("sqlx")
