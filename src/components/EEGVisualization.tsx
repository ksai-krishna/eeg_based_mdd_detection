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
  ReferenceLine,
} from "recharts";

type EEGData = {
  time: number;
  value: number;
};

const EEGVisualization = () => {
  const [eegData, setEegData] = useState<EEGData[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const [viewWindow, setViewWindow] = useState<[number, number]>([0, 10]); // Visible time range (default: first 10s)

  useEffect(() => {
    const fetchEEGData = async () => {
      // Simulated fetch - replace with actual EEG data loading
      const sampleRate = 256;
      const totalTime = 120; // 120s recording
      const totalSamples = totalTime * sampleRate;
      let generatedData: Record<string, EEGData[]> = {
        FP1: [],
        FP2: [],
        C3: [],
        C4: [],
      };

      for (let i = 0; i < totalSamples; i++) {
        const time = i / sampleRate;
        generatedData["FP1"].push({ time, value: Math.sin(time * 2) * 5 });
        generatedData["FP2"].push({ time, value: Math.cos(time * 2) * 5 });
        generatedData["C3"].push({ time, value: Math.sin(time) * 8 });
        generatedData["C4"].push({ time, value: Math.cos(time) * 8 });
      }

      setChannels(Object.keys(generatedData));
      setSelectedChannel("FP1");
      setEegData(generatedData["FP1"]);
    };

    fetchEEGData();
  }, []);

  const handleChannelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    setSelectedChannel(selected);
    setEegData(eegData);
  };

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

      {error && <p className="text-red-500">{error}</p>}

      <div className="relative w-full h-[500px]">
        {/* Controls (Top Right) */}
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <select
            className="px-3 py-1 text-xl border rounded-md bg-white shadow"
            value={selectedChannel || ""}
            onChange={handleChannelChange}
          >
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>

          <button
            className={`px-2 py-1 text-lg rounded-md ${
              autoScale ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => setAutoScale(!autoScale)}
          >
            Auto-Scale: {autoScale ? "ON" : "OFF"}
          </button>
        </div>

        {/* Time Navigation Buttons */}
        {/* <div className="absolute bottom-2 left-2 z-10 flex gap-2"> */}

        {/* <div style={{ marginTop: "30px", textAlign: "center", display: "flex", justifyContent: "center", gap: "20px" }}>
          <button onClick={() => moveTime("left")} className="px-4 py-2 bg-gray-300 rounded-md">◀ Left</button>
          <button onClick={() => moveTime("right")} className="px-4 py-2 bg-gray-300 rounded-md">Right ▶</button>
        </div> */}


        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={eegData}
            margin={{ top: 20, right: 30, bottom: 80, left: 50 }} // ⬅ Increases bottom margin
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              domain={viewWindow}
              type="number"
              label={{
                value: "Time (s)",
                position: "insideBottom",
                offset: -10, // Moves label slightly up
              }}
              tickMargin={40} // ⬅ Adds space between ticks & Brush
            />

            <YAxis
              label={{ value: "Amplitude (µV)", angle: -90, position: "insideLeft", offset: -10 }}
              domain={autoScale ? ["auto", "auto"] : [-10, 10]} // Auto or fixed scale
            />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#6366f1" dot={false} strokeWidth={2} />

            {/* Zoomable Brush */}
            {/* <div style={{ paddingTop: 10 }}> ⬅ Pushes Brush down */}
              
            <Brush
    dataKey="time"
    height={25} // ⬅ Adjust brush size if needed
    stroke="#6366f1"
    startIndex={viewWindow[0] * 256}
    endIndex={viewWindow[1] * 256}
    y={435} // ⬅ Moves brush DOWN
    onChange={(range) => {
      if (range) setViewWindow([range.startIndex / 256, range.endIndex / 256]);
    }}
  />



            {/* </div> */}




            {/* Zero Reference Line */}
            <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EEGVisualization;
