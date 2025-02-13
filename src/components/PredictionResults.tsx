import React, { useRef } from 'react';
import { Brain, Download } from 'lucide-react';
import { usePrediction } from '../context/PredictionContext';
import EEGVisualization from './EEGVisualization';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PredictionResults = () => {
  const { prediction, delta, theta, alpha, beta } = usePrediction();
  const reportRef = useRef(null);

  const eegFeatures = [
    { name: 'Alpha Power', value: `${alpha} µV²` },
    { name: 'Beta Power', value: `${beta} µV²` },
    { name: 'Theta Power', value: `${theta} µV²` },
    { name: 'Delta Power', value: `${delta} µV²` },
  ];

  const downloadReport = async () => {
    const pdf = new jsPDF();
    if (reportRef.current) {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
      pdf.save('EEG_Report.pdf');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h2 className="text-4xl font-bold mb-10">EEG Analysis Results</h2>
      <div ref={reportRef} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        <EEGVisualization />
      </div>
      <button onClick={downloadReport} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-700">
        <Download className="w-5 h-5" />
        <span>Download Report</span>
      </button>
    </div>
  );
};

export default PredictionResults;
