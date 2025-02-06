import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain } from 'lucide-react';
import EEGVisualization from './EEGVisualization';
import { usePrediction } from '../context/PredictionContext';


const PredictionResults = () => {
  const [activeTab, setActiveTab] = useState('timeSeries');
  const { prediction,delta, theta, alpha, beta } = usePrediction(); 
console.log("Extracted Prediction:", prediction);
console.log("Type of Prediction:", typeof prediction); 
  
  const eegFeatures = [
    { name: 'Alpha Power', value: `${alpha} µV²` },
    { name: 'Beta Power', value: `${beta} µV²` },
    { name: 'Theta Power', value: `${theta} µV²` },
    { name: 'Delta Power', value: `${delta} µV²` },
  ];


  console.log("pred",prediction);
  console.log("delta",delta);
  console.log("beta",beta);
  console.log("alpha",alpha);
  console.log("theta",theta);
  
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
            <div className="text-4xl font-bold text-white mb-3">{prediction}</div>
          </div>
          <p className="mt-6 text-gray-700 text-lg text-center">
            Based on the analyzed EEG signals, the predicted condition is {prediction}.
          </p>
        </div>

        {/* Key Features Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-semibold mb-6">Key EEG Features</h3>
          <div className="space-y-5">
            {eegFeatures.map((feature, index) => (
              <div key={index} className="flex justify-between items-center p-4 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-gray-700 text-lg">{feature.name}</span>
                <span className="font-semibold text-lg">{feature.value}</span>
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
