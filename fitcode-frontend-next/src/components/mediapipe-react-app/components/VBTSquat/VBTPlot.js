import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

// Statistical functions
const mean = (records) => records.reduce((a, b) => a + b, 0) / records.length;
const variance = (records, m) => mean(records.map(record => (record - m) ** 2));
const covariance = (records1, mean1, records2, mean2) => mean(records1.map((_, i) => (records1[i] - mean1) * (records2[i] - mean2)));
const coEfficient = (x, y) => {
    const meanX = mean(x);
    const meanY = mean(y);
    const slope = covariance(x, meanX, y, meanY) / variance(x, meanX);
    const intercept = meanY - slope * meanX;
    return { intercept, slope };
};

export const VBTPlot = ({ upTimesHistory, downTimesHistory, isometricTimesHistory }) => {
    const [plotData, setPlotData] = useState([]);
    const [fatigueIndex, setFatigueIndex] = useState(0);
    const numBars = upTimesHistory.length; // Set numBars to the length of the history arrays

    useEffect(() => {
        const xValues = upTimesHistory.map((_, index) => `Squat ${index + 1}`);
        const { slope, intercept } = coEfficient(xValues.map((_, index) => index + 1), upTimesHistory);
        setFatigueIndex(slope);
        const regressionLineY = xValues.map((_, index) => slope * (index + 1) + intercept);

        const eccentricTimesTrace = {
            x: xValues,
            y: downTimesHistory,
            type: 'bar',
            name: 'Eccentric Time',
            marker: { color: '#0000FF' },  // Blue color for eccentric times
            width: 0.2  // Standard width for eccentric times
        };

        const isometricTimesTrace = {
            x: xValues,
            y: isometricTimesHistory,
            type: 'bar',
            name: 'Isometric Time',
            marker: { color: '#FFCC00' },  // Yellow color for isometric times
            width: 0.2  // Standard width for isometric times
        };

        const concentricTimesTrace = {
            x: xValues,
            y: upTimesHistory,
            type: 'bar',
            name: 'Concentric Time',
            marker: { color: '#FF0000' },  // Red color for concentric times
            width: 0.2  // Standard width for concentric times
        };

        const regressionLineTrace = {
            x: xValues,
            y: regressionLineY,
            mode: 'lines+markers',
            type: 'scatter',
            name: 'Fatigue Index',
            line: { color: '#FF6859' },
        };

        setPlotData([eccentricTimesTrace, isometricTimesTrace, concentricTimesTrace, regressionLineTrace]);
    }, [upTimesHistory, downTimesHistory, isometricTimesHistory]);

    return (
        <Plot
            data={plotData}
            layout={{
                title: 'VBT Analysis with Fatigue Index',
                barmode: 'group', // Grouped mode to place bars next to each other
                paper_bgcolor: 'rgba(30, 30, 30, 0.3)',
                plot_bgcolor: 'rgba(230, 242, 255, 0.0)',
                xaxis: {
                    title: 'Squat Number',
                    range: [-0.5, numBars - 0.5],
                    color: "black"
                },
                yaxis: {
                    title: 'Time (ms)',
                    linecolor: 'white',
                    titlefont: {
                        color: 'white'
                    },
                    tickfont: {
                        color: 'white',
                        size: 30
                    },
                    tickformat: ",.2s",  // Adjust tick labels to show seconds with suffix "s"
                    gridcolor: 'white'
                },
                width: 900,
                height: 750,
                barcornerradius: 15,
                legend: { orientation: 'h', y: -0.2 },
                annotations: [
                    {
                        xref: 'paper',
                        yref: 'paper',
                        x: 0.95,
                        xanchor: 'center',
                        y: -0.2,
                        yanchor: 'top',
                        text: `Fatigue Index: ${fatigueIndex.toFixed(2)}`,
                        showarrow: false,
                        font: {
                            size: 14,
                            color: 'black'
                        }
                    }
                ]
            }}
        />
    );
};
