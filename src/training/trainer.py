import sys
import os
from pathlib import Path

# --- THE ROBUST PATH FIX ---
current_file = Path(__file__).resolve()
src_path = current_file.parents[1] 
root_path = current_file.parents[2] 

sys.path.append(str(root_path))
sys.path.append(str(src_path))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms
from tqdm import tqdm

from data.dataset import EmbryoSequenceDataset
from models.hybrid_model import EmbryoGenModel
from training.utils import seed_everything

# --- CONFIGURATION ---
EPOCHS = 20
BATCH_SIZE = 4 
LR = 5e-5  # Lower learning rate for Transformer stability
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SAVE_DIR = Path("experiments/run_001_hybrid_sota")
SAVE_DIR.mkdir(parents=True, exist_ok=True)

def train():
    seed_everything(42)
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_ds = EmbryoSequenceDataset("data/splits/train.csv", "data/processed/stacked_frames", transform=transform)
    val_ds = EmbryoSequenceDataset("data/splits/val.csv", "data/processed/stacked_frames", transform=transform)
    
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    model = EmbryoGenModel(num_classes=17).to(DEVICE)
    
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-2)
    
    # --- UPDATED AMP SYNTAX ---
    scaler = torch.amp.GradScaler('cuda') 

    best_val_acc = 0.0
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0
        
        loop = tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS}")
        for frames, times, labels in loop:
            frames, times, labels = frames.to(DEVICE), times.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            
            # --- UPDATED AUTOCAST SYNTAX ---
            with torch.amp.autocast('cuda'):
                logits = model(frames, times) 
                loss = criterion(logits.view(-1, 17), labels.view(-1))
            
            # 1. Scale loss and backprop
            scaler.scale(loss).backward()
            
            # 2. UNscale for gradient clipping (Prevents NaN)
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            # 3. Step and update
            scaler.step(optimizer)
            scaler.update()
            
            if torch.isnan(loss):
                print(f"\n[WARNING] NaN loss detected at epoch {epoch+1}. Skipping batch...")
                continue
                
            train_loss += loss.item()
            loop.set_postfix(loss=f"{loss.item():.4f}")

        val_acc = validate(model, val_loader)
        print(f"Epoch {epoch+1} | Train Loss: {train_loss/len(train_loader):.4f} | Val Acc: {val_acc:.4f}")
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), SAVE_DIR / "best_model.pth")
            print(">>> Saved Best Model")

def validate(model, loader):
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for frames, times, labels in loader:
            frames, times, labels = frames.to(DEVICE), times.to(DEVICE), labels.to(DEVICE)
            logits = model(frames, times)
            preds = torch.argmax(logits, dim=-1)
            correct += (preds == labels).sum().item()
            total += labels.numel()
    return correct / total if total > 0 else 0

if __name__ == "__main__":
    train()