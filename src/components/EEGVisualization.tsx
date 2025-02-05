import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WaveSurfer from 'wavesurfer.js'; // Import wavesurfer.js

// Define types for EEG data
type EEGData = {
  time: number;
  value: number;
};

const EEGVisualization = () => {
  const [activeTab, setActiveTab] = useState<'timeSeries' | 'spectrogram'>('timeSeries');
  const [eegData, setEegData] = useState<EEGData[]>([]); // Set state type to EEGData[]
  const wavesurferRef = useRef<WaveSurfer | null>(null); // Type the wavesurferRef

  useEffect(() => {
    const loadEEGData = async () => {
      try {
        const response = await fetch('files/sub-88000313_ses-1_task-restEO_eeg.vhdr'); // Correct file path
        const text = await response.text();
        const parsedData = parseVHDR(text);
        setEegData(parsedData);
      } catch (error) {
        console.error('Error loading EEG data:', error);
      }
    };

    loadEEGData();
  }, []);

  useEffect(() => {
    if (eegData.length > 0 && activeTab === 'spectrogram') {
      // Initialize WaveSurfer when EEG data is loaded and spectrogram tab is active
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy(); // Destroy previous instance if any
      }

      const wavesurfer = WaveSurfer.create({
        container: '#spectrogramContainer',
        waveColor: '#6366f1',
        progressColor: '#4e73df',
        height: 150,
        responsive: true,
        plugins: [
          WaveSurfer.plugins.spectrogram.create({
            container: '#spectrogramContainer', // Container for the spectrogram
            labels: true, // Show labels
          }),
        ],
      });

      // Convert EEG data to audio buffer (simulating sound waveform for visualization)
      const audioBuffer = createAudioBufferFromEEGData(eegData);
      wavesurfer.loadDecodedBuffer(audioBuffer); // Load the audio buffer into WaveSurfer
      wavesurferRef.current = wavesurfer; // Save the instance for cleanup
    }
  }, [eegData, activeTab]);

  // Convert EEG data to an audio buffer (mock conversion, real conversion depends on your EEG data format)
  const createAudioBufferFromEEGData = (data: EEGData[]) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Get AudioContext
    const sampleRate = 256; // Sampling rate for EEG data, adjust as needed
    const length = data.length;
    const buffer = audioContext.createBuffer(1, length, sampleRate); // Single channel audio buffer
    const channelData = buffer.getChannelData(0);

    data.forEach((point, index) => {
      channelData[index] = point.value; // Assuming `value` is the amplitude of the EEG signal
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

    // Generate mock EEG data since raw EEG is in a separate .eeg file
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
      <LineChart data={eegData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'bottom' }} />
        <YAxis label={{ value: 'Amplitude (µV)', angle: -90, position: 'left' }} />
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
        {/* <button
          className={`px-6 py-3 rounded-lg ${activeTab === 'spectrogram' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setActiveTab('spectrogram')}
        >
          Spectrogram
        </button> */}
      </div>

      <div className="h-[500px]">{activeTab === 'timeSeries' ? renderTimeSeries() : renderSpectrogram()}</div>
    </div>
  );
};

export default EEGVisualization;
