
export interface FLResponse {
  status: string;
  fl_round: number;
  node_id: string;
  results: {
    viability_score: number;
    confidence: number;
    frames_processed: number;
    predictions: number[];
  };
}

export const executeFLTask = async (
  images: File[], 
  clinicalData: File
): Promise<FLResponse> => {
  const formData = new FormData();
  
  // Append all image files
  images.forEach((image) => {
    formData.append("images", image);
  });

  // Append clinical data CSV
  formData.append("clinical_data", clinicalData);

  try {
    const response = await fetch("/fl/execute", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`FL Task failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Federated Learning Protocol Error:", error);
    throw error;
  }
};
