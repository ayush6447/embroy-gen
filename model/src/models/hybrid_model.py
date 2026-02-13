import torch
import torch.nn as nn
from torchvision import models

class EmbryoGenModel(nn.Module):
    def __init__(self, num_classes=17, d_model=256, nhead=8, num_layers=2):
        super(EmbryoGenModel, self).__init__()
        
        # 1. Feature Extractor (ResNet18)
        # We use ResNet18 because it's fast and efficient for 3-channel stacks
        resnet = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        self.feature_extractor = nn.Sequential(*list(resnet.children())[:-1]) # Remove last FC layer
        
        # 2. Linear projection from ResNet (512) to Transformer (d_model)
        self.feature_proj = nn.Linear(512, d_model)
        
        # 3. Time Embedder (Injects the 'TimeElapsed' clock)
        self.time_proj = nn.Linear(1, d_model)
        
        # 4. Positional Encoding (Tells the Transformer the order of frames)
        self.pos_embedding = nn.Parameter(torch.randn(1, 16, d_model))
        
        # 5. Transformer Encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, 
            nhead=nhead, 
            dim_feedforward=512, 
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # 6. Classification Head
        self.classifier = nn.Linear(d_model, num_classes)

    def forward(self, frames, times):
        # frames shape: (Batch, WindowSize, 3, 224, 224)
        # times shape: (Batch, WindowSize)
        
        b, t, c, h, w = frames.shape
        
        # Flatten Batch and Time to pass through ResNet: (B*T, 3, 224, 224)
        x = frames.view(b * t, c, h, w)
        features = self.feature_extractor(x) # (B*T, 512, 1, 1)
        features = features.view(b, t, -1)    # (B, T, 512)
        
        # Project to Transformer dimension
        x = self.feature_proj(features)       # (B, T, d_model)
        
        # Add Time Information
        time_info = times.unsqueeze(-1)       # (B, T, 1)
        time_emb = self.time_proj(time_info)  # (B, T, d_model)
        x = x + time_emb                      # Fuse spatial + temporal data
        
        # Add Positional Encoding
        if t <= self.pos_embedding.shape[1]:
            x = x + self.pos_embedding[:, :t, :]
        else:
             # Interpolate or pad if sequence is longer than 16 (fallback)
             # multidimensional interpolation is complex, for now we just repeat/truncate simplistically or crash safely
             # But let's just slice for now and assume T <= 16 or handle T > 16 by tiling (not ideal but works for shape)
             # Better: just use what we have and repeat
             pos_emb_stretched = self.pos_embedding.repeat(1, (t // 16) + 1, 1)[:, :t, :]
             x = x + pos_emb_stretched

        
        # Transformer Processing
        x = self.transformer(x)               # (B, T, d_model)
        
        # Classify each frame in the window
        logits = self.classifier(x)           # (B, T, num_classes)
        
        return logits