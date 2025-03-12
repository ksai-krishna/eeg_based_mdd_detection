import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Activity, LineChart, Waves, ChevronDown } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const overviewRef = useRef(null);

  const scrollToOverview = () => {
    overviewRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-24 lg:py-32">
        <div className="text-center max-w-6xl mx-auto">
          <div className="inline-block p-8 lg:p-10 rounded-full bg-blue-100 mb-10 lg:mb-16">
            <Brain className="h-24 w-24 lg:h-32 lg:w-32 text-blue-600" />
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 lg:mb-10 leading-tight">
            EEG-Based Detection of Major Depressive Disorder
          </h1>
          <p className="text-2xl lg:text-3xl text-gray-600 mb-12 lg:mb-16 max-w-4xl mx-auto leading-relaxed">
            Advanced machine learning system for detecting MDD using EEG signals
          </p>
          <div className="flex flex-row items-center justify-center gap-6">
  <button
    onClick={() => navigate('/upload')}
    className="px-12 py-6 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
  >
    Start Analysis
  </button>
  <button
    onClick={scrollToOverview}
    className="flex items-center gap-2 px-6 py-3 rounded-lg text-gray-600 hover:text-blue-600 transition-colors text-lg group"
  >
    Learn More
    <ChevronDown className="h-5 w-5 animate-bounce group-hover:text-blue-600" />
  </button>
</div>

        </div>
      </div>

      {/* Overview Section */}
      <div
        ref={overviewRef}
        className="bg-gradient-to-br from-purple-50 to-white p-10 lg:p-12 rounded-3xl shadow-xl transform hover:scale-105 transition-transform lg:col-span-2 scroll-mt-8"
      >
        <div className="inline-flex items-center justify-center p-4 bg-purple-100 rounded-2xl mb-8">
          <LineChart className="h-12 w-12 text-purple-600" />
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Overview</h2>
        <p className="text-xl text-gray-700 leading-relaxed max-w-4xl">
          This project aims to develop a machine learning-based system for detecting Major Depressive Disorder (MDD) using electroencephalography (EEG) data. By leveraging Extreme Gradient Boosting (XGBoost), the system analyzes EEG signals to identify subtle abnormalities associated with MDD. The approach involves data preprocessing, feature extraction using wavelet transforms, and model training, with performance evaluated through metrics like accuracy, precision, and recall. Challenges such as signal noise and limited data are addressed through data augmentation and feature engineering. This research enhances diagnostic accuracy, enabling early intervention and contributing to improved mental health care accessibility.
        </p>
      </div>

      {/* Information Sections */}
      <div className="py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-16 lg:mb-24">
            {/* Key Facts */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-10 lg:p-12 rounded-3xl shadow-xl transform hover:scale-105 transition-transform">
              <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-2xl mb-8">
                <Activity className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Key Facts</h2>
              <ul className="space-y-6 text-xl text-gray-700">
                <li className="flex items-start">• Depression is a common mental disorder</li>
                <li className="flex items-start">• MDD affects over 5% of people globally</li>
                <li className="flex items-start">• Early detection crucial for effective treatment</li>
              </ul>
            </div>

            {/* Symptoms and Patterns */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-10 lg:p-12 rounded-3xl shadow-xl transform hover:scale-105 transition-transform">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-2xl mb-8">
                <Waves className="h-12 w-12 text-indigo-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Symptoms & Patterns</h2>
              <ul className="space-y-6 text-xl text-gray-700">
                <li className="flex items-start">• Altered brain wave patterns in frontal regions</li>
                <li className="flex items-start">• Changes in alpha and theta wave activity</li>
                <li className="flex items-start">• Distinctive EEG signatures during rest state</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-gray-600">
          © {new Date().getFullYear()} EEG Signal Analysis Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
