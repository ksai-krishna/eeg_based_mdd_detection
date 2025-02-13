import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import EEGVisualization from './EEGVisualization';
import { usePrediction } from '../context/PredictionContext';

const PredictionResults = () => {
  const [activeTab, setActiveTab] = useState('timeSeries');
  const { prediction, delta, theta, alpha, beta } = usePrediction();
  
  // Load stored values from localStorage on component mount
  const [storedPrediction, setStoredPrediction] = useState<string | null>(
    localStorage.getItem("prediction")
  );
  const [eegFeatures, setEegFeatures] = useState(
    JSON.parse(localStorage.getItem("eegFeatures") || "null") || {
      alpha: null,
      beta: null,
      theta: null,
      delta: null,
    }
  );

  // Save new prediction and EEG feature values to localStorage
  useEffect(() => {
    if (prediction) {
      localStorage.setItem("prediction", prediction);
      setStoredPrediction(prediction);
    }
    if (alpha || beta || theta || delta) {
      const newFeatures = { alpha, beta, theta, delta };
      localStorage.setItem("eegFeatures", JSON.stringify(newFeatures));
      setEegFeatures(newFeatures);
    }
  }, [prediction, alpha, beta, theta, delta]);

  // Function to clear stored data
  const clearStoredData = () => {
    localStorage.removeItem("prediction");
    localStorage.removeItem("eegFeatures");
    setStoredPrediction(null);
    setEegFeatures({ alpha: null, beta: null, theta: null, delta: null });
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h2 className="text-4xl font-bold mb-10">EEG Analysis Results</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Prediction Result Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-semibold mb-6">Prediction Result</h3>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <Brain className="h-20 w-20 text-white" />
            </div>
            <div className="text-4xl font-bold text-white mb-3">
              {storedPrediction || "No Prediction Yet"}
            </div>
          </div>
          <p className="mt-6 text-gray-700 text-lg text-center">
            {storedPrediction
              ? `Based on the analyzed EEG signals, the predicted condition is ${storedPrediction}.`
              : "Awaiting EEG analysis results."}
          </p>
        </div>

        {/* Key EEG Features Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-semibold mb-6">Key EEG Features</h3>
          <div className="space-y-5">
            {Object.entries(eegFeatures).map(([key, value], index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-700 text-lg capitalize">{key} Power</span>
                <span className="font-semibold text-lg">
                  {value ? `${value} µV²` : "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      

      {/* EEG Signal Visualization */}
      <EEGVisualization />
    </div>
  );
};

export default PredictionResults;
