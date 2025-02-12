# Documentation
## Project name : MDD classfication using Traditional ML algorithms
## here we load the raw data Clean it then extract the important features and then train then ml model with features. So when a new EEG samples given it extracts the features and predicts the output mdd or healthy based on these features
---
# Project file Structure
```
final_year_project
├── app.py   # Backend Code (api service)
├── eslint.config.js
├── index.html # Index page
├── model_weights # Model Weights
│   └── svm_model.pkl
├── npm_run_dev
├── package.json
├── package-lock.json
├── postcss.config.js
├── __pycache__
│   └── app.cpython-313.pyc
├── Readme.md
├── requirements.txt
├── src
│   ├── App.tsx # Main App file for react app
│   ├── components # Components
│   │   ├── EEGVisualization.tsx # Visualization render page code
│   │   ├── FileUpload.tsx # File Upload page code
│   │   └── PredictionResults.tsx # Prediction page code
│   ├── context # To store session variables or context
│   │   ├── PredictionContext.tsx # To store the Prediction in session 
│   │   └── UploadContext.tsx # To handle fileupload context 
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── uploads
```
---
# Project Workflow
## **Front end**
### We have used react js framework to build our application
### It has 3 main components 
- FileUpload.tsx : This will be used for rendering the upload page
- PredictionResults.tsx : This is the prediction page which shows the prediction and visulization
- EEGVisualization.tsx : This page is used inside the predictionresults page in this file all the visulization code is present 
## Now we have the App.tsx which uses all these components to render a final page
## Main.tsx This is the entry point of the application, and it loads App.tsx. Typically, it is where ReactDOM.createRoot function is called.

## **Backend**
### Here we have fastapi with flask backend framework
### fastapi : Main backend framework for handling API requests
### mne : To load / clean the eeg data or all eeg data handling.
### joblib - To load saved models,matploitlib - for eeg visulization (plots)
### uvicorn : its a ASGI server where we can run the FastAPI application

## **How they both are interconnected (FastApi and React)**
## **1. Uploading Files (Triggering `/upload/`)**  
- In the **Upload Page**, when the user clicks the "Upload Files" button, a **POST** request is sent to **`/upload/`** with `.vhdr`, `.vmrk`, and `.eeg` files.  
- The backend **stores the uploaded files** in the `uploads/` directory.  
- The backend responds with:  
  ```json
  {
    "file_paths": {
      "vhdr": "uploads/file.vhdr",
      "vmrk": "uploads/file.vmrk",
      "eeg": "uploads/file.eeg"
    }
  }
- The frontend stores these file paths using React Context API for later use.


## **Triggering EEG Processing & Prediction (`/predict`)**
-- Once files are uploaded, the frontend sends a GET request to /predict?vhdr=<path>&vmrk=<path>&eeg=<path>
-- The backend:
    -- Loads the EEG files.
    -- Cleans the data using MNE (ICA, filtering, artifact removal).
    -- Extracts features (delta, theta, alpha, beta).
    -- Passes the features to the machine learning model (random_forest_model.pkl).
    -- Returns a prediction (Healthy / MDD) along with EEG feature values.
## **Rendering the EEG Visualization**
-- After prediction, the backend saves the cleaned EEG plot as an image:
```
static/<vhdr_filename>.png
```
-- The frontend requests this image and displays it in the PredictionResults.tsx page.

## **Retrieving Past Predictions (`/prediction/`)
-- The frontend calls `/prediction` api endpoint to fetch past predictions and display them in the UI.
-- The response might look like this:
```
{
  "predictions": [
    {
      "files": ["file.vhdr", "file.vmrk", "file.eeg"],
      "prediction": "Healthy"
    }
  ]
}
```
-- This allows users to see their history of analyzed EEG files.
