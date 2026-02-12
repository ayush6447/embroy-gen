import torch
from torch.utils.data import DataLoader
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))  # adds project root

from src.data.dataset import EmbryoSequenceDataset
from torchvision import transforms

# 1. Simple Transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# 2. Initialize Dataset
try:
    dataset = EmbryoSequenceDataset(
        csv_path="data/splits/train.csv",
        frames_root="data/processed/stacked_frames",
        window_size=16,
        stride=8,
        transform=transform
    )

    # 3. Pull one sample
    frames, times, labels = dataset[0]

    print(f"--- Dataset Unit Test ---")
    print(f"Success! Pulled a window from embryo.")
    print(f"Frames Shape: {frames.shape}") # Should be [16, 3, 224, 224]
    print(f"Times: {times}")
    print(f"Labels: {labels}")

    # 4. Check for 'Real' Data
    if frames.sum() == 0:
        print("CRITICAL ERROR: Images are all black (zero sum). Check your paths.")
    else:
        print("Data Verification: Non-zero pixel values detected. Triple-stack is alive.")

except Exception as e:
    print(f"Unit Test Failed: {e}")