import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WaveSurfer from 'wavesurfer.js';

type EEGData = {
  time: number;
  value: number;
};

const EEGVisualization = () => {
  const [activeTab, setActiveTab] = useState<'timeSeries' | 'spectrogram'>('timeSeries');
  const [eegData, setEegData] = useState<EEGData[]>([]);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const fetchFilePath = async () => {
      try {
        const response = await fetch('http://localhost:5000/get_latest_file');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.latest_vhdr_path;
      } catch (err) {
        console.error("Error fetching file path:", err);
        setError("Error fetching file path from server.");
        return null;
      }
    };

    const loadEEGData = async (filePath: string | null) => {
      if (!filePath) return; // Don't proceed if file path is null

      const fullPath = `uploads/${filePath}`;
      try {
        const response = await fetch(fullPath);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`File not found: ${fullPath}`);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        const text = await response.text();
        const parsedData = parseVHDR(text);
        setEegData(parsedData);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error loading EEG data:', error);
        setEegData([]);
        setError("File was not found or corrupted."); // Set the error message
      }
    };

    fetchFilePath().then(loadEEGData); // Chain promises
  }, []);



  useEffect(() => {
    if (eegData.length > 0 && activeTab === 'spectrogram') {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      const wavesurfer = WaveSurfer.create({
        container: '#spectrogramContainer',
        waveColor: '#6366f1',
        progressColor: '#4e73df',
        height: 150,
        responsive: true,
        plugins: [
          WaveSurfer.plugins.spectrogram.create({
            container: '#spectrogramContainer',
            labels: true,
          }),
        ],
      });

      const audioBuffer = createAudioBufferFromEEGData(eegData);
      wavesurfer.loadDecodedBuffer(audioBuffer);
      wavesurferRef.current = wavesurfer;
    }
  }, [eegData, activeTab]);


  const createAudioBufferFromEEGData = (data: EEGData[]) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = 256;
    const length = data.length;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);

    data.forEach((point, index) => {
      channelData[index] = point.value;
    });

    return buffer;
  };

  const parseVHDR = (text: string): EEGData[] => {
    const lines = text.split('\n');
    let samplingInterval = 1;
    let data: EEGData[] = [];

    lines.forEach((line) => {
      if (line.startsWith('SamplingInterval=')) {
        samplingInterval = parseFloat(line.split('=')[1]) / 1000;
      }
    });

    // Placeholder for actual data parsing.  This is where you'd parse the .vhdr
    // and .eeg files.  For now, generating mock data.  You'll need to
    // implement the real parsing logic here.
    for (let i = 0; i < 1000; i++) {
      data.push({
        time: i * samplingInterval,
        value: Math.sin(i * 0.1) * Math.cos(i * 0.05) + Math.random() * 5,
      });
    }

    return data;
  };

  const renderTimeSeries = () => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={eegData} margin={{ top: 20, right: 30, bottom: 20, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'bottom', offset: 0 }} />
        <YAxis label={{ value: 'Amplitude (µV)', angle: -90, position: 'left', offset: 0 }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#6366f1" dot={false} strokeWidth={2} />
        </LineChart>
    </ResponsiveContainer>
  );

  const renderSpectrogram = () => (
    <div id="spectrogramContainer" className="h-full w-full flex items-center justify-center"></div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-xl font-semibold mb-6">EEG Signal Visualization</h3>

      <div className="flex gap-4 mb-6">
        <button
          className={`px-6 py-3 rounded-lg ${activeTab === 'timeSeries' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setActiveTab('timeSeries')}
        >
          Time Series
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
      <div className="h-[500px]">
        {eegData.length > 0 ? (
          activeTab === 'timeSeries' ? renderTimeSeries() : renderSpectrogram()
        ) : !error ? (
          <p>Loading EEG Data...</p> // Show loading message if no error and no data
        ) : null}
      </div>
    </div>
  );
};

export default EEGVisualization;