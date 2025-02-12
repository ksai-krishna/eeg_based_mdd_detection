import React, { useState, useEffect } from "react";

const EEGVisualization = () => {

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEEGImagePath = async () => {
      try {
        // Step 1: Get the latest EEG file path
        const fileResponse = await fetch("http://localhost:5000/get_latest_vhdr_file");
        if (!fileResponse.ok) {
          throw new Error("Failed to fetch latest EEG file path");
        }
        const fileData = await fileResponse.json();
        const vhdr_path = fileData.latest_vhdr_path;
        console.log("Latest EEG file path:", vhdr_path);
        // Step 2: Get the image path for the EEG visualization
        // const plot_path = vhdr_path.replace(".vhdr", "_plot.png");
        // Step 3: Set the image URL (assuming the image is served statically)
        const imageUrl = "http://localhost:5000/static/plot.png"; // Updated path
        setImageUrl(imageUrl);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEEGImagePath();
  }, []);

  if (loading) return <div>Loading EEG visualization...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 relative">
      <h3 className="text-lg font-semibold mb-4">EEG Signal Visualization </h3>
      {imageUrl ? (
        <img src={imageUrl} alt={imageUrl} className="w-full rounded-md shadow-md" />
      ) : (
        <div>No EEG image available</div>
      )}
    </div>
  );
};

export default EEGVisualization;
