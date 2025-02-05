import joblib


MODEL_PATH = "mw/svm_model.pkl"
# Load the trained model from the .pkl file
model = joblib.load(MODEL_PATH)
