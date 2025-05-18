import subprocess
import json
import sys

def get_suggestions(query):
    try:
        result = subprocess.run(
            [sys.executable, 'contentbased.py', query],
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error: {e}")
        return []