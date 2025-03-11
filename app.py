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
from sklearn.preprocessing import LabelEncoder
import uvicorn





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

MODEL_PATH = "model_weights/xgb_model.pkl"
SCALER_PATH = "scaler/xgb_scaler.pkl"
try:
    model = joblib.load(MODEL_PATH)  # Load .pkl model
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")


scaler = joblib.load(SCALER_PATH)  # Only keeping scaler for feature scaling


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

def extract_channel_features(raw, fmin=0.5, fmax=50):
    # Select only EEG channels
    raw.pick_types(eeg=True)  # This removes non-EEG channels
    data = raw.get_data()
    channel_names = raw.ch_names
    features = {ch: {} for ch in channel_names}

    # Time-domain features
    for i, ch in enumerate(channel_names):
        features[ch]['mean'] = np.mean(data[i])
        features[ch]['variance'] = np.var(data[i])
        features[ch]['skewness'] = skew(data[i])
        features[ch]['kurtosis'] = kurtosis(data[i])
        features[ch]['peak_to_peak'] = np.ptp(data[i])

        # Fourier Transform (FFT)
        fft_values = np.abs(fft(data[i]))
        features[ch]['fft_mean'] = np.mean(fft_values)
        features[ch]['fft_std'] = np.std(fft_values)
        features[ch]['fft_max'] = np.max(fft_values)

        # Wavelet Transform (DWT) using Daubechies wavelet (db4) #morle
        coeffs = pywt.wavedec(data[i], 'db4', level=4)
        features[ch]['wavelet_energy'] = sum(np.sum(np.square(c)) for c in coeffs)
        features[ch]['wavelet_entropy'] = 0  # Initialize wavelet_entropy
        
        for c in coeffs:
            c = c[np.isfinite(c)]
            c_norm = c / (np.sum(np.abs(c)) + 1e-10)
            features[ch]['wavelet_entropy'] += -np.sum(c_norm * np.log2(c_norm + 1e-10))

    # Frequency-domain features using PSD
    psd = raw.compute_psd(method='welch', fmin=fmin, fmax=fmax, n_fft=2048)
    psd_data = psd.get_data()
    freqs = psd.freqs
    psd_df = pd.DataFrame(psd_data, columns=freqs, index=channel_names)

    bands = {'delta': (0.5, 4), 'theta': (4, 8), 'slow_alpha': (6, 9), 'alpha': (8, 12),
             'beta': (12, 30), 'gamma': (30, 50)}

    for band, (low, high) in bands.items():
        band_power = psd_df.loc[:, (freqs >= low) & (freqs <= high)].mean(axis=1)
        for ch in channel_names:
            features[ch][f'{band}_power'] = band_power[ch]

    # Frontal Alpha Asymmetry (F3-F4)
    if 'F3' in channel_names and 'F4' in channel_names:
        features['F3_F4_alpha_asymmetry'] = features['F4']['alpha_power'] - features['F3']['alpha_power']

    # Convert features to DataFrame
    features_df = pd.DataFrame(features).T

    return features_df

def process_and_combine(eo_file_path, ec_file_path, output_file):
    all_features = []

    # Process EO file
    raw_eo = preprocess_eeg_data(eo_file_path)
    features_eo = extract_channel_features(raw_eo)
    #features_eo['condition'] = 'EO'
    all_features.append(features_eo)

    # Process EC file
    raw_ec = preprocess_eeg_data(ec_file_path)
    features_ec = extract_channel_features(raw_ec)
    #features_ec['condition'] = 'EC'
    all_features.append(features_ec)

    # Combine EO and EC features
    combined_features = pd.concat(all_features, keys=['EO', 'EC'], names=['condition', 'channel'])
    
    # Save combined features to a single CSV file
    combined_features.to_csv(output_file)
    print(f"Features successfully saved to {output_file}")
    # return combined_features


# Modified Function to Load and Preprocess a Single CSV File
def load_and_preprocess_single_csv(df):
    """
    Loads and preprocesses a single CSV file for prediction.

    Args:
        file_path (str): The path to the CSV file.

    Returns:
        pandas.DataFrame: Preprocessed DataFrame.
    """

    # Handle categorical data
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = LabelEncoder().fit_transform(df[col])

    # Handle missing values
    df.fillna(df.median(), inplace=True)

    return df

def predict_eeg(eo_path, ec_path):
    # Load and Preprocess the Single CSV File
    outut_file = "preprocessed.csv"
    process_and_combine(eo_path, ec_path, outut_file)
    combined_features = pd.read_csv(outut_file)
    X_predict = load_and_preprocess_single_csv(combined_features)
    # Load Pre-trained Model and Scaler
    
    best_model = joblib.load(MODEL_PATH)
    # Apply Same Scaling as Training Data
    X_predict_scaled = scaler.transform(X_predict)

    # Predict on the Single CSV Data
    prediction = best_model.predict(X_predict_scaled)
    final_prediction = prediction[0]

    try:
        probability = best_model.predict_proba(X_predict_scaled)[0] # Probabilities for both classes
        probability_healthy = probability[0] * 100
        probability_mdd = probability[1] * 100
        print(f"Probability of being Healthy: {probability_healthy:.2f}%")
        print(f"Probability of having MDD: {probability_mdd:.2f}%")
    except AttributeError:
        print("Prediction probabilities are not available for this model.")
    except Exception as e:
        print(f"Error getting prediction probabilities: {e}")

    alpha_power = combined_features["alpha_power"].mean()
    beta_power = combined_features["beta_power"].mean()
    delta_power = combined_features["delta_power"].mean()
    theta_power = combined_features["theta_power"].mean()
    final_prediction = "MDD" if final_prediction == 1 else "Healthy"
    final_prob = probability_mdd if final_prediction == "MDD" else probability_healthy
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

if '__name__' == '__main__':
    
    uvicorn.run(app, host="0.0.0.0", port=5000)
##### uvicorn app:app --host 0.0.0.0 --port 5000  ## Command to run the api server/app
##### OR python app.py  ## Command to run the api server/app