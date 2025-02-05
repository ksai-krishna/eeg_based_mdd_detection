// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import PredictionResults from './components/PredictionResults';
import { UploadProvider } from './context/UploadContext';
import { PredictionProvider } from './context/PredictionContext'; // Import the PredictionProvider

function App() {
  return (
    <Router>
      <UploadProvider>
        <PredictionProvider> {/* Wrap with PredictionProvider */}
          <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <h1 className="text-2xl font-semibold text-gray-900">EEG Signal Analysis Platform</h1>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<FileUpload />} />
                <Route path="/prediction" element={<PredictionResults />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </PredictionProvider>
      </UploadProvider>
    </Router>
  );
}

export default App;
