import os

files = [
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\webhooks_tests.rs",
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\request_tests.rs",
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\pricing_tests.rs",
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\ownership_tests.rs",
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\comment_tests.rs",
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\billing_tests.rs",
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\auth\registration_tests.rs",
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\admin_tests.rs",
    r"c:\Users\mypc\Desktop\saas_house\backend\src\handlers\admin\auth_tests.rs"
]

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content.replace("dotenv::from_filename", "dotenvy::from_filename")
        
        if content != new_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed: {file_path}")
        else:
            print(f"No changes needed: {file_path}")
    else:
        print(f"File not found: {file_path}")
