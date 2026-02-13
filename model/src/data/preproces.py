import os
import cv2
import numpy as np
from pathlib import Path
from tqdm import tqdm

def create_stacked_dataset(raw_root, output_root):
    raw_root = Path(raw_root)
    output_root = Path(output_root)
    
    # Define our three planes
    planes = {
        "R": raw_root / "embryo_dataset_F-15",
        "G": raw_root / "embryo_dataset",       # Assuming this is F0
        "B": raw_root / "embryo_dataset_F15"
    }

    # Get list of embryo IDs (common to all folders)
    embryo_ids = sorted([d.name for d in planes["G"].iterdir() if d.is_dir()])
    
    for emb_id in tqdm(embryo_ids, desc="Stacking Embryos"):
        save_path = output_root / emb_id
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Get frame list from the central plane (F0)
        f0_frames = sorted(os.listdir(planes["G"] / emb_id))
        
        for frame_file in f0_frames:
            paths = {k: planes[k] / emb_id / frame_file for k in planes}
            
            # Ensure the frame exists in all 3 planes
            if all(p.exists() for p in paths.values()):
                # Read images in grayscale
                img_r = cv2.imread(str(paths["R"]), cv2.IMREAD_GRAYSCALE)
                img_g = cv2.imread(str(paths["G"]), cv2.IMREAD_GRAYSCALE)
                img_b = cv2.imread(str(paths["B"]), cv2.IMREAD_GRAYSCALE)
                
                # Resize to SOTA standard
                img_r = cv2.resize(img_r, (224, 224))
                img_g = cv2.resize(img_g, (224, 224))
                img_b = cv2.resize(img_b, (224, 224))
                
                # Stack into a single RGB image
                stacked = cv2.merge([img_b, img_g, img_r]) # BGR for OpenCV
                
                cv2.imwrite(str(save_path / frame_file), stacked)

if __name__ == "__main__":
    create_stacked_dataset("data/raw", "data/processed/stacked_frames")