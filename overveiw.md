# EEG-Based MDD Classification – AI Full Stack Project

## Overview

This project is focused on using EEG (Electroencephalogram) data to detect signs of **Major Depressive Disorder (MDD)** through machine learning. The system takes raw EEG files as input, processes them end-to-end, and returns a classification: **MDD** or **Healthy**.

---

## Project Components

### 📁 Input
- `.vhdr`, `.vmrk`, `.eeg` files collected from EEG machines

### ⚙️ Preprocessing
- Applied **Notch filter** and **Bandpass filter**
- Removed **eye blink** and **muscle noise artifacts**

### 📊 Feature Extraction
- Extracted features from:
  - Time domain
  - Frequency domain
  - Time-frequency domain
  - Connectivity measures
- Combined features across EEG channels

### 🔍 Feature Selection
- Used **SHAP analysis** to understand the importance of each feature and select only those that contributed to model performance

### 📈 Model Training
- Trained classification models using scikit-learn
- Tuned hyperparameters for optimal performance
- Applied **MinMaxScaler** and **StandardScaler** for normalization

### 🧠 Inference API
- Developed a **FastAPI** backend that:
  - Accepts EEG files
  - Processes and classifies data
  - Returns prediction results with probability scores

### 💻 Frontend
- Built a **React.js** interface to:
  - Upload EEG files
  - Display the prediction (MDD or Healthy)
  - Show prediction history

---

## Key Learnings

- Understanding EEG data and dealing with noise/artifacts  
- Preprocessing and feature extraction techniques  
- Importance of selecting the right features using SHAP  
- Hyperparameter tuning and model optimization  
- End-to-end development and integration of AI models into real applications  
- Applying feature scaling techniques like MinMaxScaler and StandardScaler  
- Building APIs and connecting machine learning models to a frontend interface  

---

## Tools & Technologies
- Python, NumPy, MNE, Scikit-learn, SHAP  
- FastAPI, React.js, Axios  
- EEG domain knowledge and signal processing techniques

---

## Duration
**9th Feb 2024 – 1st May 2025**  
Internship at **iBrains Centre for Precision Neuropsychiatry**

---

## Mentorship & Guidance
Special thanks to:
- Prof. Geetha R and Prof. Syed Hayath  
- Dr. Varalatchoumy M (HOD of AIML)  
- Dr. Nagaraj Halemani and Dr. Selvam
