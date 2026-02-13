import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Upload,
  FileImage,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Server
} from "lucide-react";
import { executeFLTask } from "../services/fl_client";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [clinicalFile, setClinicalFile] = useState<File | null>(null);
  const [embryoId, setEmbryoId] = useState("");
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(e.target.files ?? [])]);
      setUploadStatus('idle');
    }
  };

  const handleClinicalSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setClinicalFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (imageFiles.length === 0 || !clinicalFile) {
      setErrorMessage("Both Image Sequence and Clinical Data are required for Multimodal Analysis.");
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    setErrorMessage("");

    try {
      // Execute Federated Learning Protocol
      const result = await executeFLTask(imageFiles, clinicalFile);
      console.log("FL Result:", result);

      setUploadStatus('success');
      setTimeout(() => {
        handleReset();
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      setErrorMessage("Federated Learning Protocol failed. Ensure the FL Node is running.");
      setUploadStatus('error');
    }
  };

  const handleReset = () => {
    setImageFiles([]);
    setClinicalFile(null);
    setEmbryoId("");
    setUploadStatus('idle');
    setErrorMessage("");
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Federated Learning Protocol (Multimodal)
          </DialogTitle>
          <DialogDescription>
            Upload multimodal data (Image Sequence + Clinical CSV) to execute local training/inference on the Federated Node.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">

          {/* Embryo ID Input */}
          <div className="space-y-2">
            <Label htmlFor="embryo-id">Embryo ID (Optional)</Label>
            <Input
              id="embryo-id"
              placeholder="e.g., EMB-FL-NODE-01"
              value={embryoId}
              onChange={(e) => setEmbryoId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload Application */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                Time-Lapse Images
                <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <div className="text-sm font-medium text-slate-900">
                    Upload Frames
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {imageFiles.length} files selected
                  </div>
                </label>
              </div>
            </div>

            {/* Clinical Data Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Clinical Data (CSV)
                <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleClinicalSelect}
                  className="hidden"
                  id="clinical-upload"
                />
                <label htmlFor="clinical-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <div className="text-sm font-medium text-slate-900">
                    Upload CSV
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {clinicalFile ? clinicalFile.name : "No file selected"}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Validation / Requirements Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Multimodal Requirement:</strong> Both image sequences and clinical data must be provided to initiate the protocol.
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="font-semibold">Protocol Executed Successfully</span>
                <p className="text-xs mt-1">Local model updated. Weights synchronized with Federated Server.</p>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <span className="font-semibold">Protocol Execution Failed</span>
                <p className="text-xs mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={uploadStatus === 'uploading'}
            >
              Reset
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={uploadStatus === 'uploading'}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading'}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Executing Protocol...
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 mr-2" />
                    Run FL Protocol
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
