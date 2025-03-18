import React from 'react';
import Plot from 'react-plotly.js';

export const CoMPlot = ({ comXHistory }) => {
    if (comXHistory.length === 0) {
        return null; // Avoid rendering an empty plot
    }

    // Squat cycle numbers as y-axis values
    const yValues = comXHistory.map((_, index) => index + 1);

    // CoM X Component values, formatted to two decimal places
    const xValues = comXHistory.map(value => parseFloat(value.toFixed(2)));

    // Plot data
    const data = [{
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines',
        marker: { color: 'blue' },
        name: 'CoM X Component'
    }];

    // Plot layout configuration, adjusted for vertical orientation
    const layout = {
        title: 'Side Lean during descent',
        xaxis: {
            title: 'CoM X (m)',
            range: [-0.4, 0.4], // Range for CoM X Component
            autorange: false
        },
        yaxis: {
            title: 'Detection Count',
            autorange: true
        },
        plot_bgcolor: 'rgba(255,255,255,0.5)',
        paper_bgcolor: 'rgba(255,255,255,0.5)',
        showlegend: true,
        legend: { "orientation": "h" },
    };

    return <Plot data={data} layout={layout} />;
};

export default CoMPlot;
