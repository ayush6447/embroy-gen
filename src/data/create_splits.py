import pandas as pd
from sklearn.model_selection import train_test_split
from pathlib import Path

def create_final_splits(master_csv, processed_dir, output_dir):
    # 1. Load the master labels
    df = pd.read_csv(master_csv)
    
    # 2. Critical: Filter only embryos we successfully processed/stacked
    processed_path = Path(processed_dir)
    available_embryos = {d.name for d in processed_path.iterdir() if d.is_dir()}
    
    # Only keep labels for embryos that have image folders
    df = df[df['EmbryoID'].isin(available_embryos)].copy()
    unique_ids = df['EmbryoID'].unique()
    
    # 3. First split: 70% Train, 30% for Val+Test
    train_ids, temp_ids = train_test_split(
        unique_ids, 
        test_size=0.30, 
        random_state=42
    )
    
    # 4. Second split: Split the 30% into exactly half (15% each)
    val_ids, test_ids = train_test_split(
        temp_ids, 
        test_size=0.50, 
        random_state=42
    )
    
    # 5. Save results
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    train_df = df[df['EmbryoID'].isin(train_ids)]
    val_df = df[df['EmbryoID'].isin(val_ids)]
    test_df = df[df['EmbryoID'].isin(test_ids)]
    
    train_df.to_csv(f"{output_dir}/train.csv", index=False)
    val_df.to_csv(f"{output_dir}/val.csv", index=False)
    test_df.to_csv(f"{output_dir}/test.csv", index=False)
    
    print("--- 70/15/15 Split Complete ---")
    print(f"Total Processed Embryos: {len(unique_ids)}")
    print(f"Train: {len(train_ids)} embryos ({len(train_df)} frames)")
    print(f"Val:   {len(val_ids)} embryos ({len(val_df)} frames)")
    print(f"Test:  {len(test_ids)} embryos ({len(test_df)} frames)")

if __name__ == "__main__":
    create_final_splits(
        master_csv="data/processed/master_labels.csv",
        processed_dir="data/processed/stacked_frames",
        output_dir="data/splits"
    )