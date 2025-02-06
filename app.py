import os
import joblib
import numpy as np
import mne
import pickle
from fastapi import FastAPI, File, UploadFile, HTTPException, Form,Request
from fastapi.responses import JSONResponse
from typing import List
from scipy.stats import skew, kurtosis
from mne.preprocessing import ICA
from mne.time_frequency import psd_array_welch
import shutil
from flask_cors import CORS
from fastapi.middleware.cors import CORSMiddleware




# Initialize FastAPI app
app = FastAPI()


# Add CORS middleware
origins = [
    "http://localhost:5173",  # Allow React frontend (change if your frontend runs on a different port)
    "http://localhost:5000",  # (optional) Add other frontend URLs here if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# CORS(app)
# Directory for storing uploaded files
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load trained model
MODEL_PATH = "mw/svm_model.pkl"
try:
    model = joblib.load(MODEL_PATH)  # Load .pkl model
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")

# Store predictions
predictions = []

def preprocess_and_extract_features(vhdr_path, vmrk_path, eeg_path):
    """Preprocess EEG files and extract features."""
    print(f"Processing file: {vhdr_path}")
    raw = mne.io.read_raw_brainvision(vhdr_path, preload=True)

    start_t = 30
    total_time = raw.times[-1]
    max_time = total_time - start_t
    raw = raw.crop(start_t, max_time)

    non_eeg_channels = ['VPVA', 'VNVB', 'HPHL', 'HNHR', 'Erbs', 'OrbOcc', 'Mass']
    raw.drop_channels([ch for ch in non_eeg_channels if ch in raw.info['ch_names']])

    montage = mne.channels.make_standard_montage('standard_1020')
    raw.set_montage(montage)

    raw.filter(l_freq=1.0, h_freq=40.0)

    ica = ICA(n_components=20, random_state=97, max_iter=800)
    ica.fit(raw)
    sources = ica.get_sources(raw).get_data()

    variances = np.var(sources, axis=1)
    kurtoses = np.apply_along_axis(lambda x: kurtosis(x, fisher=False), 1, sources)

    high_variance = np.where(variances > np.percentile(variances, 95))[0]
    high_kurtosis = np.where(kurtoses > np.percentile(kurtoses, 95))[0]
    artifact_components = np.unique(np.concatenate([high_variance, high_kurtosis]))

    ica.exclude = list(artifact_components)
    raw_clean = ica.apply(raw)

    events = mne.make_fixed_length_events(raw_clean, duration=2.0)
    epochs = mne.Epochs(raw_clean, events, tmin=0, tmax=2.0, baseline=None, preload=True)
    
    return epochs





def freq_domain_features(epochs):
    """Extract features from EEG epochs."""
    data = epochs.get_data()

    mean = np.mean(data, axis=2)
    variance = np.var(data, axis=2)
    skewness = skew(data, axis=2)
    kurtosis_values = kurtosis(data, axis=2)
    time_features = np.concatenate([mean, variance, skewness, kurtosis_values], axis=1)

    psd, freqs = psd_array_welch(data, sfreq=epochs.info['sfreq'], fmin=1, fmax=40, n_fft=256)
    delta = np.mean(psd[:, :, (freqs >= 1) & (freqs < 4)], axis=2)
    theta = np.mean(psd[:, :, (freqs >= 4) & (freqs < 8)], axis=2)
    alpha = np.mean(psd[:, :, (freqs >= 8) & (freqs < 13)], axis=2)
    beta = np.mean(psd[:, :, (freqs >= 13) & (freqs < 30)], axis=2)
    delta_mean = np.mean(delta)
    theta_mean = np.mean(theta)
    alpha_mean = np.mean(alpha)
    beta_mean = np.mean(beta)

    # freq_features = np.concatenate([delta, theta, alpha, beta], axis=1)
    # print("*****************freq feature ***************************",freq_features)
    # print("*****************time feature ***************************",time_features)
    return delta_mean,theta_mean,alpha_mean,beta_mean


def extract_features_from_epochs(epochs):
    """Extract features from EEG epochs."""
    data = epochs.get_data()

    mean = np.mean(data, axis=2)
    variance = np.var(data, axis=2)
    skewness = skew(data, axis=2)
    kurtosis_values = kurtosis(data, axis=2)
    time_features = np.concatenate([mean, variance, skewness, kurtosis_values], axis=1)

    psd, freqs = psd_array_welch(data, sfreq=epochs.info['sfreq'], fmin=1, fmax=40, n_fft=256)
    delta = np.mean(psd[:, :, (freqs >= 1) & (freqs < 4)], axis=2)
    theta = np.mean(psd[:, :, (freqs >= 4) & (freqs < 8)], axis=2)
    alpha = np.mean(psd[:, :, (freqs >= 8) & (freqs < 13)], axis=2)
    beta = np.mean(psd[:, :, (freqs >= 13) & (freqs < 30)], axis=2)
    freq_features = np.concatenate([delta, theta, alpha, beta], axis=1)
    # print("*****************freq feature ***************************",freq_features)
    # print("*****************time feature ***************************",time_features)
    return np.concatenate([time_features, freq_features], axis=1)

@app.post("/upload/")
async def upload_files(
    vhdr: UploadFile = File(...), vmrk: UploadFile = File(...), eeg: UploadFile = File(...)
):
    """Handle file uploads and store them with original names."""
    file_paths = {}
    
    for file in [vhdr, vmrk, eeg]:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_paths[file.filename] = file_path  # Store file paths
    print("Files uploaded successfully",file_paths)
    return {"message": "Files uploaded successfully", "file_paths": file_paths}

@app.get("/predict")
async def predict(request: Request):
    """Process EEG files, extract features, and predict."""
    # Get the file paths from the query parameters
    vhdr_path = request.query_params.get('vhdr')
    vmrk_path = request.query_params.get('vmrk')
    eeg_path = request.query_params.get('eeg')

    if not vhdr_path or not vmrk_path or not eeg_path:
        raise HTTPException(status_code=400, detail="Missing file paths!")

    vhdr_full_path = os.path.join(UPLOAD_FOLDER, vhdr_path)
    vmrk_full_path = os.path.join(UPLOAD_FOLDER, vmrk_path)
    eeg_full_path = os.path.join(UPLOAD_FOLDER, eeg_path)

    # Check if the provided paths exist
    if not os.path.exists(vhdr_full_path) or not os.path.exists(vmrk_full_path) or not os.path.exists(eeg_full_path):
        raise HTTPException(status_code=400, detail="Uploaded files not found!")

    # Process the EEG files (replace with your own function)
    
    epochs = preprocess_and_extract_features(vhdr_full_path, vmrk_full_path, eeg_full_path)
    features = extract_features_from_epochs(epochs)
    delta,theta,alpha,beta = freq_domain_features(epochs)
    # Make prediction (replace with your model logic)
    prediction = model.predict(features)

    result = "Healthy" if prediction[0] == 0 else "MDD"

    # Append prediction result to the list (optional)
    predictions.append({"files": [vhdr_path, vmrk_path, eeg_path], "prediction": result})

    # Return the prediction as a JSON response
    print(delta,theta,alpha,beta)
    print("************************************")



    return {"prediction": result,"delta": f"{delta:.5e}","theta": f"{theta:.5e}","alpha": f"{alpha:.5e}","beta": f"{beta:5e}"}

@app.get("/prediction/")
async def get_predictions():
    """Retrieve all past predictions."""
    return {"predictions": predictions}


##### uvicorn app:app --host 0.0.0.0 --port 5000