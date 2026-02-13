import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import List
import uvicorn
from PIL import Image
import io
import pandas as pd
import numpy as np
from torchvision import transforms
from .models.hybrid_model import EmbryoGenModel

app = FastAPI(title="EmbryoGen Federated Node")

# --- Model Initialization ---
# Initialize with random weights since we don't have a pretrained .pth file
# In a real FL scenario, this would load the global model weights sent by the server
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = EmbryoGenModel(num_classes=17).to(device)
model.eval()

# --- Preprocessing ---
image_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def process_clinical_data(csv_file: bytes) -> torch.Tensor:
    """
    Parses clinical data from CSV bytes.
    Expected format: CSV with 'Time' column and other clinical features.
    Returns: Tensor of time values (or other features as needed by the model).
    """
    try:
        df = pd.read_csv(io.BytesIO(csv_file))
        if 'Time' not in df.columns:
            # Fallback if 'Time' is missing, create dummy relative time
            times = np.arange(len(df))
        else:
            times = df['Time'].values
        
        return torch.tensor(times, dtype=torch.float32)
    except Exception as e:
        print(f"Error processing clinical data: {e}")
        # Return dummy time if parsing fails
        return torch.zeros(1) # Return at least one element

@app.post("/fl/execute")
async def execute_fl_task(
    images: List[UploadFile] = File(...),
    clinical_data: UploadFile = File(...)
):
    """
    Simulates a Federated Learning execution step.
    Receives:
    - Sequence of Image frames
    - Clinical Data (CSV)
    
    Returns:
    - Model predictions (Simulating local inference/gradients)
    """
    print(f"Received FL Task: {len(images)} images, {clinical_data.filename}")
    
    if not images:
        raise HTTPException(status_code=400, detail="No images provided")

    try:
        # 1. Process Images
        img_tensors = []
        for img_file in images:
            content = await img_file.read()
            image = Image.open(io.BytesIO(content)).convert("RGB")
            img_tensors.append(image_transform(image))
        
        # Stack into (Batch=1, Time, Channels, Height, Width)
        # The model expects batched input
        frames_tensor = torch.stack(img_tensors).unsqueeze(0).to(device)
        
        # 2. Process Clinical Data
        clinical_content = await clinical_data.read()
        times_tensor = process_clinical_data(clinical_content).unsqueeze(0).to(device)
        
        # Ensure times match frames dimension (truncate or pad if necessary)
        # For simplicity, we'll resize times to match frames count
        b, t, c, h, w = frames_tensor.shape
        if times_tensor.shape[1] != t:
             # Create linear time steps as fallback or resize
             times_tensor = torch.linspace(0, 120, steps=t).unsqueeze(0).to(device)

        # 3. Validated Inference (Local Step)
        with torch.no_grad():
            logits = model(frames_tensor, times_tensor)
            probs = torch.softmax(logits, dim=-1)
            
            # Simple viability score (e.g., prob of 'tB' (Blastocyst) or similar positive class)
            # Assuming 'tB' is a late stage, we can just take the max prob as usage confidence
            confidence, predicted_class = torch.max(probs, dim=-1)
            
            # Simulated Viability Score (mean confidence of late stages)
            viability_score = float(torch.mean(confidence).item())
            
        return {
            "status": "success",
            "fl_round": 1,
            "node_id": "local_node_1",
            "results": {
                "viability_score": viability_score,
                "confidence": viability_score * 100, # Mock connection
                "frames_processed": len(images),
                "predictions": predicted_class.cpu().tolist()[0]
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
