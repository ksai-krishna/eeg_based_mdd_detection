import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";

const sampleRate = 256; // EEG Sampling rate in Hz
const totalTime = 120; // 120s recording
const totalSamples = totalTime * sampleRate;

// Generate Simulated EEG Data (Replace with real EEG data)
const generateEEGData = () => {
  const channels = ["FP1", "FP2", "C3", "C4"];
  let data: Record<string, { time: number; value: number }[]> = {};
  channels.forEach((channel) => (data[channel] = []));

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    data["FP1"].push({ time, value: Math.sin(time * 2) * 5 });
    data["FP2"].push({ time, value: Math.cos(time * 2) * 5 });
    data["C3"].push({ time, value: Math.sin(time) * 8 });
    data["C4"].push({ time, value: Math.cos(time) * 8 });
  }
  return data;
};

const EEGVisualization = () => {
  const eegData = generateEEGData();
  const [viewWindow, setViewWindow] = useState<[number, number]>([0, 10]); // View 10s window

  const moveTime = (direction: "left" | "right") => {
    setViewWindow(([start, end]) => {
      const shift = 5; // Move by 5 seconds
      return direction === "left"
        ? [Math.max(0, start - shift), Math.max(10, end - shift)]
        : [start + shift, end + shift];
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 relative">
      <h3 className="text-lg font-semibold mb-4">EEG Signal Visualization</h3>

      {/* EEG Plots for Each Channel */}
      {Object.keys(eegData).map((channel, index) => (
        <div key={channel} className="mb-4">
          <h4 className="text-md font-semibold text-gray-600">{channel}</h4>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={eegData[channel]} margin={{ top: 10, right: 30, bottom: 10, left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" domain={viewWindow} type="number" hide={index !== 3} />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6366f1" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}

      {/* Brush for Zooming */}
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={eegData["FP1"]}
            margin={{ top: 10, right: 30, bottom: 40, left: 50 }}
          >

            <XAxis dataKey="time" domain={viewWindow} type="number" />
            <Brush
              dataKey="time"
              height={30}
              stroke="#6366f1"
              startIndex={viewWindow[0] * 256}
              endIndex={viewWindow[1] * 256}
              onChange={(range) => {
                if (range) setViewWindow([range.startIndex / 256, range.endIndex / 256]);
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time Navigation Buttons */}
      <div className="mt-6 flex justify-center gap-4">
        <button onClick={() => moveTime("left")} className="px-4 py-2 bg-gray-300 rounded-md">◀ Left</button>
        <button onClick={() => moveTime("right")} className="px-4 py-2 bg-gray-300 rounded-md">Right ▶</button>
      </div>
    </div>
  );
};

export default EEGVisualization;
