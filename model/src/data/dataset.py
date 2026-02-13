import torch
import pandas as pd
import numpy as np
import os
from torch.utils.data import Dataset
from PIL import Image
from pathlib import Path

class EmbryoSequenceDataset(Dataset):
    def __init__(self, csv_path, frames_root, window_size=16, stride=8, transform=None):
        self.df = pd.read_csv(csv_path)
        self.frames_root = Path(frames_root)
        self.window_size = window_size
        self.stride = stride
        self.transform = transform
        
        # 1. Map labels to consistent indices (SOTA fixed list)
        self.classes = ['tPB2', 'tPNa', 'tPNf', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9+', 'tM', 'tSB', 'tB', 'tEB', 'tHB', 'unknown']
        self.class_to_idx = {cls: i for i, cls in enumerate(self.classes)}

        # 2. Create sliding windows
        self.windows = []
        embryo_groups = self.df.groupby("EmbryoID")
        
        print(f"Indexing windows for {len(embryo_groups)} embryos...")
        for emb_id, group in embryo_groups:
            group = group.sort_values("Frame")
            num_frames = len(group)
            
            if num_frames >= window_size:
                for start in range(0, num_frames - window_size + 1, stride):
                    self.windows.append(group.iloc[start:start + window_size])
        
        # 3. Cache for file mapping to avoid slow disk lookups
        self.file_cache = {}

    def __len__(self):
        return len(self.windows)

    def _get_image_path(self, emb_id, frame_num):
        """Robustly finds the filename ending in _RUN{frame_num}.jpeg"""
        emb_dir = self.frames_root / str(emb_id)
        
        # Cache directory listing for speed
        if emb_id not in self.file_cache:
            try:
                self.file_cache[emb_id] = os.listdir(emb_dir)
            except FileNotFoundError:
                return None
        
        target_suffix = f"RUN{int(frame_num)}.jpeg"
        files = self.file_cache[emb_id]
        
        # Search for the specific RUN index
        actual_file = next((f for f in files if f.endswith(target_suffix)), None)
        return emb_dir / actual_file if actual_file else None

    def __getitem__(self, idx):
        window_df = self.windows[idx]
        emb_id = window_df.iloc[0]['EmbryoID']
        
        images = []
        times = []
        labels = []
        
        for _, row in window_df.iterrows():
            img_path = self._get_image_path(emb_id, row['Frame'])
            
            if img_path and img_path.exists():
                try:
                    img = Image.open(img_path).convert("RGB")
                    if self.transform:
                        img = self.transform(img)
                    images.append(img)
                except Exception:
                    images.append(torch.zeros(3, 224, 224))
            else:
                # If frame is missing, return a black placeholder
                images.append(torch.zeros(3, 224, 224))
            
            times.append(row['time'])
            label = self.class_to_idx.get(row['Event'], self.class_to_idx['unknown'])
            labels.append(label)
            
        return torch.stack(images), torch.tensor(times).float(), torch.tensor(labels)