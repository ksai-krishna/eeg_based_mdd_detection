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
from fastapi.staticfiles import StaticFiles
import matplotlib.pyplot as plt
import pandas as pd
from scipy.fftpack import fft
import pywt






# Initialize FastAPI app
app = FastAPI()


# Add CORS middleware
origins = [
    "http://localhost:5173",  # Allow React frontend (change if your frontend runs on a different port)
    "http://localhost:5000",  # (optional) Add other frontend URLs here if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (or specify allowed origins)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)





# CORS(app)


app.mount("/static", StaticFiles(directory="static"), name="static")
# Directory for storing uploaded files
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
vhdr_path=""

# Load trained model
# MODEL_PATH = "mw/svm_model.pkl"

MODEL_PATH = "model_weights/rf.pkl"
Scaler_PATH = "scaler/scaler.pkl"
try:
    model = joblib.load(MODEL_PATH)  # Load .pkl model
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")


scaler = joblib.load(Scaler_PATH)  # Only keeping scaler for feature scaling


# Store predictions
predictions = []
plot_paths = []




def preprocess_eeg_data(vhdr_file_path, l_freq=1.0, h_freq=40.0, notch_freq=50):
    """Preprocess EEG data."""
    raw = mne.io.read_raw_brainvision(vhdr_file_path, preload=True)
    eog_channels = ['VPVA', 'VNVB', 'HPHL', 'HNHR']
    raw.set_channel_types({ch: 'eog' for ch in eog_channels if ch in raw.ch_names})
    raw.notch_filter(freqs=[notch_freq], picks='eeg')
    raw.filter(l_freq=l_freq, h_freq=h_freq, picks='eeg')
    raw.set_eeg_reference('average', projection=True)
    
    # ICA for artifact removal
    ica = mne.preprocessing.ICA(n_components=20, random_state=97, max_iter=800)
    ica.fit(raw)
    eog_indices, _ = ica.find_bads_eog(raw)
    ica.exclude = eog_indices
    raw = ica.apply(raw)
    file_path = os.path.splitext(os.path.basename(vhdr_file_path))[0]
    print("**********************************************file_path*****************************************",file_path)
    plot_path=f"static/{file_path}.png"
    print("**********************************************plot_path*****************************************",plot_path)
    fig = raw.plot(scalings={"eeg": 75e-6}, n_channels=32, title="EEG Data", show=True)
    fig.savefig(plot_path, dpi=300)
    plt.close(fig)
    return raw

def extract_features(raw, condition):
    """Extract EEG features."""
    raw.pick_types(eeg=True)
    data = raw.get_data()
    channel_names = raw.ch_names
    feature_list = []

    for i, ch in enumerate(channel_names):
        mean_val = np.mean(data[i])
        variance = np.var(data[i])
        skewness = skew(data[i])
        kurtosis_val = kurtosis(data[i])
        peak_to_peak = np.ptp(data[i])

        # FFT Features
        fft_values = np.abs(fft(data[i]))
        fft_mean = np.mean(fft_values)
        fft_std = np.std(fft_values)
        fft_max = np.max(fft_values)

        # Wavelet Transform (DWT)
        coeffs = pywt.wavedec(data[i], 'db4', level=4)
        wavelet_energy = sum(np.sum(np.square(c)) for c in coeffs)
        wavelet_entropy = sum(-np.sum((c / np.sum(np.abs(c) + 1e-10)) * np.log2(c / np.sum(np.abs(c) + 1e-10) + 1e-10)) for c in coeffs)

        # Power Spectral Density (PSD)
        psd = raw.compute_psd(method='welch', fmin=0.5, fmax=50, n_fft=2048)
        psd_data = psd.get_data()
        freqs = psd.freqs
        psd_df = pd.DataFrame(psd_data, columns=freqs, index=channel_names)

        # Extract power in specific frequency bands
        bands = {
            "delta": (0.5, 4), "theta": (4, 8), "slow_alpha": (6, 9),
            "alpha": (8, 12), "beta": (12, 30), "gamma": (30, 50)
        }
        band_powers = {band: psd_df.loc[ch, (freqs >= low) & (freqs <= high)].mean() for band, (low, high) in bands.items()}

        # Store extracted features in a list
        feature_list.append([condition, ch, mean_val, variance, skewness, kurtosis_val, peak_to_peak,
                             fft_mean, fft_std, fft_max, wavelet_energy, wavelet_entropy,
                             band_powers['delta'], band_powers['theta'], band_powers['slow_alpha'],
                             band_powers['alpha'], band_powers['beta'], band_powers['gamma']])

    # Convert to DataFrame
    columns = ["condition", "channel", "mean", "variance", "skewness", "kurtosis", "peak_to_peak",
               "fft_mean", "fft_std", "fft_max", "wavelet_energy", "wavelet_entropy",
               "delta_power", "theta_power", "slow_alpha_power", "alpha_power", "beta_power", "gamma_power"]
    
    df = pd.DataFrame(feature_list, columns=columns)

    return df

def predict_eeg(vhdr_file_eo, vhdr_file_ec):
    """Predict EEG data using trained model."""
    # Process EO and EC files
    raw_eo = preprocess_eeg_data(vhdr_file_eo)
    raw_ec = preprocess_eeg_data(vhdr_file_ec)

    features_eo = extract_features(raw_eo, "EO")
    features_ec = extract_features(raw_ec, "EC")


    # Combine EO and EC features
    combined_features = pd.concat([features_eo, features_ec])

    # Save original columns
    original_columns = combined_features.columns

    # Drop non-numeric columns (condition, channel) before scaling
    X = combined_features.drop(columns=["condition", "channel"])

    # Ensure correct feature order (match training order)
    expected_features = scaler.feature_names_in_  # Get features used during training
    missing_features = [col for col in expected_features if col not in X.columns]
    extra_features = [col for col in X.columns if col not in expected_features]

    # Fill missing features with 0
    for col in missing_features:
        X[col] = 0

    # Drop extra features (to match training)
    X = X[expected_features]

    # Normalize using training scaler
    X_scaled = scaler.transform(X)

    # Predict using the trained model
    predictions = model.predict(X_scaled)
    probabilities = model.predict_proba(X_scaled)

    # Aggregate predictions
    final_prediction = round(np.mean(predictions))  # Majority voting across channels
    final_prob = np.mean(probabilities, axis=0)

    print(f"Final Prediction: {'MDD' if final_prediction == 1 else 'Healthy'}")
    print(f"Probabilities: {final_prob}")

    # Reattach non-numeric columns
    combined_features["prediction"] = predictions
    alpha_power = combined_features["alpha_power"].mean()
    beta_power = combined_features["beta_power"].mean()
    delta_power = combined_features["delta_power"].mean()
    theta_power = combined_features["theta_power"].mean()
    final_prediction = "MDD" if final_prediction == 1 else "Healthy"
    return final_prediction, final_prob, alpha_power, beta_power, delta_power, theta_power


def visualize_eeg_data(vhdr_path):
    """Visualize EEG data."""
# Convert to Pandas DataFrame
    raw = preprocess_eeg_data(vhdr_path)
    df = raw.to_data_frame()

    # Save as JSON for React
    df.to_json("eeg_data.json", orient="records")
    return df

@app.post("/upload/")
async def upload_files(
    vhdrEO: UploadFile = File(...), vmrkEO: UploadFile = File(...), eegEO: UploadFile = File(...),
    vhdrEC: UploadFile = File(...), vmrkEC: UploadFile = File(...), eegEC: UploadFile = File(...)
):
    """Handle file uploads and store them with original names."""
    
    file_paths = {}
    
    # Save files to the upload folder
    for file in [vhdrEO, vmrkEO, eegEO, vhdrEC, vmrkEC, eegEC]:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_paths[file.filename] = file_path  # Store file paths
    
    print("Files uploaded successfully:", file_paths)
    
    return {"message": "Files uploaded successfully", "file_paths": file_paths}



@app.get("/predict")
async def predict(request: Request):
    """Process EEG files, extract features, and predict."""
    # Get the file paths from the query parameters
    vhdr_eo_path = request.query_params.get('vhdrEO')
    vmrk_eo_path = request.query_params.get('vmrkEO')
    eeg_eo_path = request.query_params.get('eegEO')

    vhdr_ec_path = request.query_params.get('vhdrEC')
    vmrk_ec_path = request.query_params.get('vmrkEC')
    eeg_ec_path = request.query_params.get('eegEC')

    # Check if the provided paths exist
    if not vhdr_eo_path or not vmrk_eo_path or not eeg_eo_path or not vhdr_ec_path or not vmrk_ec_path or not eeg_ec_path:
        raise HTTPException(status_code=400, detail="Missing file paths!")

    vhdr_eo_full_path = os.path.join(UPLOAD_FOLDER, vhdr_eo_path)
    vmrk_eo_full_path = os.path.join(UPLOAD_FOLDER, vmrk_eo_path)
    eeg_eo_full_path = os.path.join(UPLOAD_FOLDER, eeg_eo_path)
    vhdr_ec_full_path = os.path.join(UPLOAD_FOLDER, vhdr_eo_path)
    vmrk_ec_full_path = os.path.join(UPLOAD_FOLDER, vmrk_eo_path)
    eeg_ec_full_path = os.path.join(UPLOAD_FOLDER, eeg_eo_path)

    
    # Process the EEG files (replace with your own function)
    
    
    # Make prediction (replace with your model logic)
    result, probabilities, alpha, beta, delta, theta = predict_eeg(vhdr_eo_full_path, vhdr_ec_full_path)

    # Append prediction result to the list (optional)
    predictions.append({"files_eo": [vhdr_eo_path, vmrk_eo_path, eeg_eo_path],"files_eo": [vhdr_ec_path, vmrk_ec_path, eeg_ec_path], "prediction": result})
    # Return the prediction as a JSON response
    print(delta,theta,alpha,beta)
    print("************************************")


    return {"prediction": result,"delta": f"{delta:.5e}","theta": f"{theta:.5e}","alpha": f"{alpha:.5e}","beta": f"{beta:5e}","probabilities": probabilities.tolist()}

@app.get("/prediction/")
async def get_predictions():
    """Retrieve all past predictions."""
    return {"predictions": predictions}

@app.get("/get_latest_vhdr_file")
async def get_latest_vhdr_file():
    """Retrieve the latest uploaded vhdr file path from the predictions."""
    if not predictions:
        raise HTTPException(status_code=404, detail="No predictions available")

    latest_prediction = predictions[-1]  # Get the latest prediction
    latest_vhdr_path = latest_prediction["files_eo"][0]  # The first file in the list is the vhdr file

    return {"latest_vhdr_path": latest_vhdr_path}

##### uvicorn app:app --host 0.0.0.0 --port 5000  ## Command to run the api server/app