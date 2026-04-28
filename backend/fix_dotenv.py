import os

root_dir = r"c:\Users\mypc\Desktop\saas_house\backend"
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".rs"):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content.replace("dotenv::dotenv", "dotenvy::dotenv")
            new_content = new_content.replace("use dotenv", "use dotenvy")
            
            if content != new_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {file_path}")
