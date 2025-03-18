import React, { useState, useEffect, useCallback } from 'react';
import './Classification.css';
import * as tf from '@tensorflow/tfjs';
import { ESSENTIAL_SQUAT_LANDMARKS } from './Utils';
import { POSE_LANDMARKS } from '@mediapipe/pose';

const Classification = ({ poseResults, videoRef, canvasRef }) => {
    const [model, setModel] = useState(null);

    /* eslint-disable no-unused-vars */
    const [predictionBuffer, setPredictionBuffer] = useState([]);
    const [bufferSize, setBufferSize] = useState(30);
    /* eslint-enable no-unused-vars */

    const [displayedClass, setDisplayedClass] = useState("");

    useEffect(() => {
        tf.loadLayersModel('/tfjs_model/model.json')
            .then(loadedModel => {
                setModel(loadedModel);
                console.log("Model loaded successfully");
            })
            .catch(error => {
                console.error("Failed to load the model", error);
            });
    }, []);

    const updatePredictionBuffer = useCallback((newPrediction) => {
        setPredictionBuffer(prevBuffer => {
            const buffer = prevBuffer.length >= bufferSize ? prevBuffer.slice(1) : prevBuffer;
            const newBuffer = [...buffer, newPrediction];
            const classCounts = newBuffer.reduce((acc, pred) => {
                acc[pred] = (acc[pred] || 0) + 1;
                return acc;
            }, {});
            const mostCommonClass = Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b);
            setDisplayedClass(mostCommonClass);
            return newBuffer;
        });
    }, [bufferSize]);

    useEffect(() => {
        if (!poseResults || !model || !poseResults.poseLandmarks) return;

        const minVisibleCount = Math.ceil(ESSENTIAL_SQUAT_LANDMARKS.length * 0.6);
        const visibleCount = ESSENTIAL_SQUAT_LANDMARKS.reduce((count, index) =>
            poseResults.poseLandmarks[index] && poseResults.poseLandmarks[index].visibility > 0.3 ? count + 1 : count, 0
        );

        if (visibleCount >= minVisibleCount) {
            const landmarks = poseResults.poseLandmarks.map((lm, index) => ({
                ...lm, // retain original coordinates for all landmarks
                visibility: lm.visibility
            }));

            const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
            const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
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
                lm.z / max_distance,
                lm.visibility
            ]);

            const inputTensor = tf.tensor2d(normalizedLandmarks).flatten();
            const prediction = model.predict(inputTensor.reshape([1, normalizedLandmarks.length * 4]));
            prediction.data().then((data) => {
                const maxConfidence = Math.max(...data);
                if (maxConfidence < 0.95) {
                    updatePredictionBuffer("Low Confidence");
                } else {
                    const predictedIndex = data.indexOf(maxConfidence);
                    const class_names = [
                        'BackSquat', 'BentOverRowing', 'BulgarianSquat', 'Deadlift', 'GobletSquat',
                        'HipThrust', 'PushUp'
                    ];
                    updatePredictionBuffer(class_names[predictedIndex]);
                }
            });
        } else {
            setDisplayedClass("Insufficient visible landmarks");
        }
    }, [poseResults, model, updatePredictionBuffer]);

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

export default Classification;
