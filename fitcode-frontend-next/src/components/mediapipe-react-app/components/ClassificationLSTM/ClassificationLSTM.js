import React, { useState, useEffect, useCallback } from 'react';
import './ClassificationLSTM.css';
import * as tf from '@tensorflow/tfjs';
import { ESSENTIAL_LANDMARKS } from './Utils';
import { POSE_LANDMARKS } from '@mediapipe/pose';

const ClassificationLSTM = ({ poseResults, videoRef, canvasRef }) => {
    const [model, setModel] = useState(null);
    const [landmarkBuffer, setLandmarkBuffer] = useState([]); // Buffer to store landmarks
    const bufferSize = 32; // Buffer size should be 32 for LSTM

    const [displayedClass, setDisplayedClass] = useState("");

    useEffect(() => {
        tf.loadLayersModel('/tfjs_model_lstm/model.json')
            .then(loadedModel => {
                setModel(loadedModel);
                console.log("Model loaded successfully");
            })
            .catch(error => {
                console.error("Failed to load the model", error);
            });
    }, []);

    const updateLandmarkBuffer = useCallback((newLandmarks) => {
        setLandmarkBuffer(prevBuffer => {
            const buffer = [...prevBuffer, newLandmarks];
            if (buffer.length > bufferSize) {
                buffer.shift();
            }
            console.log("Updated Buffer:", buffer); // Debugging statement
            return buffer;
        });
    }, [bufferSize]);

    const processLandmarks = useCallback((landmarks) => {
        const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
        const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];

        if (!rightHip || !leftHip) {
            return null;
        }

        const center_x = (rightHip.x + leftHip.x) / 2;
        const center_y = (rightHip.y + leftHip.y) / 2;

        let max_distance = 0;
        landmarks.forEach(lm => {
            const distance = Math.sqrt((lm.x - center_x) ** 2 + (lm.y - center_y) ** 2);
            if (distance > max_distance) max_distance = distance;
        });

        const normalizedLandmarks = landmarks.map(lm => [
            (lm.x - center_x) / max_distance,
            (lm.y - center_y) / max_distance,
            lm.z / max_distance
        ]);

        console.log("Normalized Landmarks:", normalizedLandmarks); // Debugging statement

        return normalizedLandmarks;
    }, []);

    useEffect(() => {
        if (!poseResults || !model || !poseResults.poseLandmarks) return;

        console.log("Processing poseResults.poseLandmarks:", poseResults.poseLandmarks); // Debugging statement

        const landmarks = ESSENTIAL_LANDMARKS.map(index => poseResults.poseLandmarks[index] || { x: 0, y: 0, z: 0 });
        console.log("Extracted Landmarks:", landmarks); // Debugging statement

        const normalizedLandmarks = processLandmarks(landmarks);

        if (normalizedLandmarks) {
            updateLandmarkBuffer(normalizedLandmarks);

            if (landmarkBuffer.length === bufferSize) {
                const inputBuffer = [landmarkBuffer.flat()];
                console.log("Input Buffer for Prediction:", inputBuffer); // Debugging statement
                const inputTensor = tf.tensor3d(inputBuffer, [1, bufferSize, ESSENTIAL_LANDMARKS.length * 3]);
                console.log("Input Tensor Shape:", inputTensor.shape); // Debugging statement
                model.predict(inputTensor).data().then((data) => {
                    console.log("Prediction Data:", data); // Debugging statement
                    const maxConfidence = Math.max(...data);
                    if (maxConfidence < 0.95) {
                        setDisplayedClass("Low Confidence");
                    } else {
                        const predictedIndex = data.indexOf(maxConfidence);
                        const class_names = [
                            'BackSquat', 'BentOverRowing', 'BulgarianSquat', 'Deadlift', 'GobletSquat',
                            'HipThrust', 'PushUp'
                        ];
                        setDisplayedClass(class_names[predictedIndex]);
                    }
                });
            }
        }
    }, [poseResults, model, updateLandmarkBuffer, bufferSize, landmarkBuffer, processLandmarks]);

    useEffect(() => {
        console.log("Landmark Buffer Length:", landmarkBuffer.length);
        console.log("Landmark Buffer:", landmarkBuffer);
    }, [landmarkBuffer]);

    return (
        <div className="classification-container">
            {displayedClass && (
                <div className="prediction-overlay">
                    Predicted Pose: {displayedClass}
                </div>
            )}
        </div>
    );
};

export default ClassificationLSTM;
