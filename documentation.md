# Documentation
# Project name : MDD classfication using Traditional ML algorithms
## here we load the raw data Clean it then extract the important features and then train then ml model with features. So when a new EEG samples given it extracts the features and predicts the output mdd or healthy based on these features

## Project Structure
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

