import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

const HomePage = () => {
  const [showAbstract, setShowAbstract] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col items-center justify-center py-16 lg:py-24">
        <div className="text-center max-w-5xl w-full">
          <div className="inline-block p-6 lg:p-8 rounded-full bg-blue-100 mb-8 lg:mb-12">
            <Brain className="h-20 w-20 lg:h-24 lg:w-24 text-blue-600" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 lg:mb-8 leading-tight">
            EEG-Based Detection of Major Depressive Disorder
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Advanced machine learning system for detecting MDD using EEG signals
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => setShowAbstract(!showAbstract)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-lg"
            >
              {showAbstract ? 'Hide Abstract' : 'Show Abstract'}
              {showAbstract ? (
                <ChevronUp className="ml-2 h-6 w-6" />
              ) : (
                <ChevronDown className="ml-2 h-6 w-6" />
              )}
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Start Analysis
            </button>
          </div>
        </div>

        {showAbstract && (
          <div className="w-full max-w-5xl mt-12 animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-8 lg:p-12">
              <h2 className="text-2xl lg:text-3xl font-semibold mb-6">Abstract</h2>
              <p className="text-gray-700 text-lg lg:text-xl leading-relaxed">
                Major Depressive Disorder (MDD) is a common and serious mental health condition, 
                yet its diagnosis remains largely subjective and relies on clinical assessments, 
                leading to inconsistent outcomes and delayed treatment. This research project aims 
                to address this gap by developing a sophisticated machine learning system for MDD 
                detection using electroencephalography (EEG) data. The proposed system leverages 
                advanced algorithms like Convolutional and Recurrent Neural Networks to analyze EEG 
                signals, capturing Minor anomalies in brain activity linked with MDD. The methodology 
                involves data collection and preprocessing, followed by feature extraction using 
                techniques like wavelet transforms, and model training. The performance is evaluated 
                using metrics such as accuracy, precision, and recall. This approach tackles challenges 
                like signal noise and limited data availability through innovative techniques such as 
                data augmentation and feature engineering.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;