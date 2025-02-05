import React, { useState, useCallback } from "react";
import axios from "axios";  // Import axios for making HTTP requests
import { Upload, File, AlertCircle, X, Trash2, Loader2 } from "lucide-react";
import { useUploadContext } from "../context/UploadContext";
import { useNavigate } from "react-router-dom"; 
import { usePrediction } from '../context/PredictionContext';






const FileUpload = () => {
  const { setFiles } = useUploadContext();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFileTypeError, setShowFileTypeError] = useState(false);
  const navigate = useNavigate();
  const { setPrediction } = usePrediction();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFileLimit = (files: File[]) => {
    if (files.length > 3) {
      setError("Please remove some files in the queue. Only 3 files are allowed.");
      setTimeout(() => setError(null), 5000);
      return false;
    }
    return true;
  };

  const validateFiles = (files: File[]) => {
    const requiredExtensions = ['.vhdr', '.vmrk', '.eeg'];
    const uploadedExtensions = files.map(file => 
      '.' + file.name.split('.').pop()?.toLowerCase()
    );

    const missingExtensions = requiredExtensions.filter(
      ext => !uploadedExtensions.includes(ext)
    );

    if (missingExtensions.length > 0) {
      return missingExtensions;
    }
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (!validateFileLimit(files)) return;

    setUploadedFiles(prevFiles => [...prevFiles, ...files]);
    setFiles([...uploadedFiles, ...files]);
  }, [uploadedFiles, setFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const files = Array.from(e.target.files);

      if (!validateFileLimit([...uploadedFiles, ...files])) return;

      setUploadedFiles(prevFiles => {
        const newFiles = [...prevFiles, ...files];
        setFiles(newFiles);
        return newFiles;
      });
    }
  };

  


  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsUploading(true);
    // const navigate = useNavigate();
    // Validate if the uploaded files are the correct ones
    const missingExtensions = validateFiles(uploadedFiles);
    var vhdr = ""
    var vmrk = ""
    var eeg = ""
    if (missingExtensions) {
      setError(`Missing required files: ${missingExtensions.join(', ')}`);
      setShowFileTypeError(true);
      setTimeout(() => {
        setError(null);
        setShowFileTypeError(false);
      }, 5000);
      setIsUploading(false);
      return;
    }

    try {
      // Prepare FormData to send files to backend
      const formData = new FormData();

      // Map the files to the correct names ('vhdr', 'vmrk', 'eeg')
      uploadedFiles.forEach(file => {
        if (file.name.includes('.vhdr')) {
          formData.append('vhdr', file);  // Attach the .vhdr file under 'vhdr'
          vhdr=file.name
        } else if (file.name.includes('.vmrk')) {
          formData.append('vmrk', file);  // Attach the .vmrk file under 'vmrk'
          vmrk = file.name
        } else if (file.name.includes('.eeg')) {
          formData.append('eeg', file);  // Attach the .eeg file under 'eeg'
          eeg = file.name
        }
      });

      // Call the FastAPI /upload endpoint
      const response = await axios.post("http://localhost:5000/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",  // Ensure proper content type for file uploads
        },
      });
      
      // Handle response from backend
      // console.log
      
      if (response.data) {
        console.log("Files uploaded successfully:", response.data.file_paths);
        // Optionally you can trigger another API call to process prediction
        // After the upload, handle prediction logic here...

        const pred_response = await axios.get("http://localhost:5000/predict", {
                params: { vhdr: vhdr,vmrk:vmrk,eeg:eeg },  // Send file path as a query parameter
              });
              console.log("Prediction Response:", pred_response.data);
        setPrediction(String(pred_response.data.prediction));
        navigate("/prediction")
      } else {
        throw new Error("Failed to upload files.");
      }
    } catch (error) {
      setError("An error occurred while uploading files. Please try again.");
    } finally {
      setIsUploading(false);
    }

    //  catch (error) {
    //   try {
    //     const response = await axios.get("http://localhost:5000/run_prediction", {
    //       params: { path: "uploads/sub-87974973_ses-1_task-restEC_eeg.vhdr" },  // Send file path as a query parameter
    //     });
    //     navigate(response.data)
    //     console.log("Prediction Response:", response.data);
    //     return response.data;
    //   } catch (error) {
    //     console.error("Error getting prediction:", error);
    //   }
    //   navigate("/prediction")
    // } finally {
    //   setIsUploading(false);
    // }
};



  const removeFile = (indexToRemove: number) => {
    const newFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(newFiles);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setError(null);
    } else {
      const missingExtensions = validateFiles(newFiles);
      if (missingExtensions) {
        setError(`Missing required files: ${missingExtensions.join(', ')}`);
        setShowFileTypeError(true);
        setTimeout(() => {
          setError(null);
          setShowFileTypeError(false);
        }, 5000);
      }
    }
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setFiles([]);
    setError(null);
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-4xl font-semibold mb-8">Upload EEG Files</h2>
      <p className="text-gray-600 text-2xl mb-12">
        Please upload the required EEG files (.vhdr, .vmrk, .eeg) to begin the analysis.
      </p>

      <div
        className={`relative border-4 border-dashed rounded-lg p-12 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".vhdr,.vmrk,.eeg"
          onChange={handleChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        
        <label
          htmlFor="file-upload"
          className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isUploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <Upload className="h-18 w-18 text-gray-400" />
          <div className="text-gray-600 text-2xl">
            Drag and drop your EEG files here, or click to select files
          </div>
          <div className="text-md text-gray-500 text-xl">
            (Only .vhdr, .vmrk, and .eeg files are accepted)
          </div>
        </label>
      </div>

      {error && !showFileTypeError && (
        <div className="mt-8 p-6 bg-red-50 rounded-lg flex items-center gap-4 text-red-700">
          <AlertCircle className="h-8 w-8" />
          <span className="text-xl">{error}</span>
        </div>
      )}

      {showFileTypeError && error && (
        <div className="mt-8 p-6 bg-yellow-50 rounded-lg flex items-center gap-4 text-yellow-700">
          <AlertCircle className="h-8 w-8" />
          <span className="text-xl">{error}</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-3xl font-medium">Selected Files:</h3>
            <button
              onClick={clearAllFiles}
              className="flex items-center gap-3 px-6 py-2 text-xl text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              disabled={isUploading}
            >
              <Trash2 className="h-5 w-5" />
              Clear All
            </button>
          </div>
          <div className="space-y-6">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg group"
              >
                <div className="flex items-center gap-3">
                  <File className="h-6 w-6 text-gray-400" />
                  <span className="text-2xl text-gray-700">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors"
                  aria-label="Remove file"
                  disabled={isUploading}
                >
                  <X className="h-6 w-6" />
                </button>
                <button
                  onClick={() => downloadFile(file)}
                  className="flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-blue-500 hover:bg-white transition-colors"
                  aria-label="Download file"
                  disabled={isUploading}
                >
                  <span className="text-xl">↓</span>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="text-2xl mt-8 w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isUploading ? <Loader2 className="animate-spin h-6 w-6" /> : "Upload Files"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
