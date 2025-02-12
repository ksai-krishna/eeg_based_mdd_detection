import mne
import plotly.graph_objects as go
import numpy as np

# Load EEG file
vhdr_file = f"uploads/sub-87974709_ses-1_task-restEC_eeg.vhdr"  # Replace with your actual file path
raw = mne.io.read_raw_brainvision(vhdr_file, preload=True)
data, times = raw[:]

# Create an interactive plot using Plotly
fig = go.Figure()
for i, ch_name in enumerate(raw.ch_names):
    fig.add_trace(go.Scatter(x=times, y=data[i] + i * 10, mode='lines', name=ch_name))

fig.update_layout(
    title="EEG Signal",
    xaxis_title="Time (s)",
    yaxis_title="Amplitude (µV)",
    template="plotly_white"
)

# Save as an HTML file
fig.write_html("eeg_plot.html")

# Show the plot
fig.show()
