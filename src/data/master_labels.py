import pandas as pd
import os
from pathlib import Path
from tqdm import tqdm

def merge_range_context(anno_dir, time_dir, output_file):
    anno_path = Path(anno_dir)
    time_path = Path(time_dir)
    all_data = []

    # Get phase files (e.g., AA83-7_phases.csv)
    anno_files = [f for f in os.listdir(anno_path) if f.endswith('_phases.csv')]

    for file in tqdm(anno_files, desc="Unpacking Ranges"):
        embryo_id = file.replace('_phases.csv', '')
        
        try:
            # 1. Load Range Annotations (Stage, Start, End)
            # Since your example doesn't have headers, we assign them
            df_anno = pd.read_csv(anno_path / file, names=['Event', 'Start', 'End'])
            
            # 2. Unpack ranges into a frame-by-frame list
            unpacked_frames = []
            for _, row in df_anno.iterrows():
                for f_num in range(int(row['Start']), int(row['End']) + 1):
                    unpacked_frames.append({'Frame': f_num, 'Event': row['Event']})
            
            df_unpacked = pd.DataFrame(unpacked_frames)

            # 3. Match with Time Elapsed (frame_index, time)
            time_file = time_path / f"{embryo_id}_timeElapsed.csv"
            if time_file.exists():
                df_time = pd.read_csv(time_file)
                # Standardize column name to 'Frame'
                time_col = next((c for c in df_time.columns if 'index' in c.lower() or 'frame' in c.lower()), None)
                if time_col:
                    df_time = df_time.rename(columns={time_col: 'Frame'})
                
                # Merge: Frame-by-Frame labels + Time data
                combined = pd.merge(df_unpacked, df_time, on='Frame', how='inner')
            else:
                combined = df_unpacked
                combined['time'] = 0 

            combined['EmbryoID'] = embryo_id
            all_data.append(combined)
            
        except Exception as e:
            print(f"Error processing {embryo_id}: {e}")

    if all_data:
        final_df = pd.concat(all_data, ignore_index=True)
        final_df.to_csv(output_file, index=False)
        print(f"\nSuccessfully created: {output_file}")
        print(f"Total labeled frames: {len(final_df)}")
        print(f"Sample row:\n{final_df.iloc[0]}")
    else:
        print("Critical Error: No files matched.")

if __name__ == "__main__":
    merge_range_context(
        "data/raw/embryo_dataset_annotations",
        "data/raw/embryo_dataset_time_elapsed",
        "data/processed/master_labels.csv"
    )