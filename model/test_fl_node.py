
import requests
import io
import pandas as pd
import numpy as np
from PIL import Image

def test_fl_node():
    url = "http://127.0.0.1:8000/fl/execute"
    
    # 1. Create dummy image
    img = Image.new('RGB', (224, 224), color='red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    # 2. Create dummy clinical data
    df = pd.DataFrame({'Time': [0, 15, 30], 'Feature1': [1, 2, 3]})
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_str = csv_buffer.getvalue()

    # 3. Construct Payload
    files = [
        ('images', ('frame1.jpg', img_bytes, 'image/jpeg')),
        ('images', ('frame2.jpg', img_bytes, 'image/jpeg')),
        ('clinical_data', ('data.csv', csv_str, 'text/csv'))
    ]

    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            print("✅ FL Node Test Passed!")
            print("Response:", response.json())
        else:
            print(f"❌ FL Node Test Failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("Ensure the backend is running: 'uvicorn model.src.fl_node:app --reload'")

if __name__ == "__main__":
    test_fl_node()
