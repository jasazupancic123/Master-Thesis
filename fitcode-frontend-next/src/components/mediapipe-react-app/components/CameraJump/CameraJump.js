import React, { useEffect, useState, useCallback, useRef } from 'react';
import { POSE_LANDMARKS } from '@mediapipe/pose';
import { ESSENTIAL_JUMP_LANDMARKS, JUMP_PHASE } from './Utils';
import { Thresholds } from '../../thresholds/Jump';
import { calculateCmPerPixel, calculateHipMidpointY, calculateAngles, calculateStandardDeviation } from '../../utils/Calculations';

import './CameraJump.css';

const CameraJump = ({ poseResults, videoRef, canvasRef }) => {
    const [feedbackMessages, setFeedbackMessages] = useState([]);
    const [isInJump, setIsInJump] = useState(false);
    const [jumpHeightCm, setJumpHeightCm] = useState(0);
    const [jumpHeightPx, setJumpHeightPx] = useState(0);
    const [jumpPhase, setJumpPhase] = useState(JUMP_PHASE.CALIBRATION);
    const [jumpActive, setJumpActive] = useState(false);
    // landmarks
    const [currentHipY, setCurrentHipY] = useState(0);
    const [referenceHipY, setReferenceHipY] = useState(Infinity);
    const [highestHipY, setHighestHipY] = useState(0);
    const leftAnklePositions = useRef([]);
    const rightAnklePositions = useRef([]);
    const ANKLE_BUFFER_SIZE = 20;
    const ANKLE_Y_THRESH = 0.01;
    const MOVEMENT_THRESHOLD = 0.003;

    // calibration 
    /* eslint-disable no-unused-vars */
    const [isCalibrated, setIsCalibrated] = useState(false);
    const [isStill, setIsStill] = useState(false);
    const [isInSquat, setIsInSquat] = useState(false);
    /* eslint-enable no-unused-vars */

    const [cmPerPixel, setCmPerPixel] = useState(0);
    const userHeightRef = useRef(null);
    const adjustmentConstantRef = useRef(null);
    // capture frame
    const [capturedImage, setCapturedImage] = useState(null);

    const updateAnklePositions = (newLeftPosition, newRightPosition) => {
        leftAnklePositions.current = [...leftAnklePositions.current.slice(-ANKLE_BUFFER_SIZE + 1), newLeftPosition];
        rightAnklePositions.current = [...rightAnklePositions.current.slice(-ANKLE_BUFFER_SIZE + 1), newRightPosition];
    };

    const detectTPose = useCallback(() => {
        if (!poseResults || !poseResults.poseLandmarks) return false;

        // Landmarks for T-pose detection
        const leftShoulder = poseResults.poseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
        const rightShoulder = poseResults.poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
        const leftWrist = poseResults.poseLandmarks[POSE_LANDMARKS.LEFT_WRIST];
        const rightWrist = poseResults.poseLandmarks[POSE_LANDMARKS.RIGHT_WRIST];

        // Check if shoulders and wrists are horizontally aligned for T-pose
        const shouldersApproxEqualY = Math.abs(leftShoulder.y - rightShoulder.y) < 0.05;
        const wristsApproxEqualY = Math.abs(leftWrist.y - rightWrist.y) < 0.05;
        const handsAboveShoulders = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;

        // check if upright
        const { newLeftKneeAngle, newRightKneeAngle, newLeftHipAngle, newRightHipAngle } = calculateAngles(poseResults);
        const isUpright = newLeftHipAngle > Thresholds.STANDING_HIP_ANGLE_THRESH &&
            newRightHipAngle > Thresholds.STANDING_HIP_ANGLE_THRESH &&
            newLeftKneeAngle > Thresholds.STANDING_KNEE_ANGLE_THRESH &&
            newRightKneeAngle > Thresholds.STANDING_KNEE_ANGLE_THRESH;

        return shouldersApproxEqualY && wristsApproxEqualY && handsAboveShoulders && isUpright;
    }, [poseResults]);

    const captureAndSaveFrame = useCallback(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        // Draw the video frame to the canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to an image (DataURL)
        const imageUrl = canvas.toDataURL('image/png');
        setCapturedImage(imageUrl);

        // download
        const downloadLink = document.createElement('a'); // Create a link
        downloadLink.href = imageUrl; // Set the href to the image URL
        downloadLink.download = 'jump_start.png'; // Set the download attribute with a filename
        document.body.appendChild(downloadLink); // Append the link to the document
        downloadLink.click(); // Trigger the download
        document.body.removeChild(downloadLink);

    }, [videoRef, canvasRef]);

    const checkAnklesLiftOff = useCallback(() => {
        if (leftAnklePositions.current.length < 2 || rightAnklePositions.current.length < 2) {
            // Not enough data to compare
            return false;
        }

        const leftAnkleDiff = leftAnklePositions.current[leftAnklePositions.current.length - 1].y - leftAnklePositions.current[leftAnklePositions.current.length - 2].y;
        const rightAnkleDiff = rightAnklePositions.current[rightAnklePositions.current.length - 1].y - rightAnklePositions.current[rightAnklePositions.current.length - 2].y;

        // Check if both ankles have a decrease in y value of 0.01 or more
        return leftAnkleDiff <= -ANKLE_Y_THRESH && rightAnkleDiff <= -ANKLE_Y_THRESH;
    }, []);

    useEffect(() => {
        if (!poseResults || !poseResults.poseLandmarks) return;

        if (poseResults.poseLandmarks) {
            const allLandmarksVisible = ESSENTIAL_JUMP_LANDMARKS.every(index =>
                poseResults.poseLandmarks[index] && poseResults.poseLandmarks[index].visibility > 0.5
            );
            if (allLandmarksVisible) {
                // ankle positions and movement
                const leftAnklePosition = { x: poseResults.poseLandmarks[POSE_LANDMARKS.LEFT_ANKLE].x, y: poseResults.poseLandmarks[POSE_LANDMARKS.LEFT_ANKLE].y };
                const rightAnklePosition = { x: poseResults.poseLandmarks[POSE_LANDMARKS.RIGHT_ANKLE].x, y: poseResults.poseLandmarks[POSE_LANDMARKS.RIGHT_ANKLE].y };
                updateAnklePositions(leftAnklePosition, rightAnklePosition);
                const stdDevLeft = calculateStandardDeviation(leftAnklePositions.current);
                const stdDevRight = calculateStandardDeviation(rightAnklePositions.current);
                const isCurrentlyStill = stdDevLeft < MOVEMENT_THRESHOLD && stdDevRight < MOVEMENT_THRESHOLD;
                setIsStill(isCurrentlyStill);
                // check if in squat
                const { newLeftKneeAngle, newRightKneeAngle, newLeftHipAngle, newRightHipAngle } = calculateAngles(poseResults);
                const isCurrentlyInSquat = newLeftHipAngle < Thresholds.STANDING_HIP_ANGLE_THRESH ||
                    newRightHipAngle < Thresholds.STANDING_HIP_ANGLE_THRESH ||
                    newLeftKneeAngle < Thresholds.STANDING_KNEE_ANGLE_THRESH ||
                    newRightKneeAngle < Thresholds.STANDING_KNEE_ANGLE_THRESH;
                setIsInSquat(isCurrentlyInSquat);
                // update hip y value
                const leftHipPosition = poseResults.poseLandmarks[POSE_LANDMARKS.LEFT_HIP];
                const rightHipPosition = poseResults.poseLandmarks[POSE_LANDMARKS.RIGHT_HIP];
                const currentHipY = calculateHipMidpointY(leftHipPosition, rightHipPosition, videoRef.current.videoHeight);
                setCurrentHipY(currentHipY);

                if (!jumpActive) {
                    // kalibracija ali ready
                    if (isCurrentlyStill) {
                        // oseba je pri miru
                        if (!isCurrentlyInSquat && (currentHipY < referenceHipY)) {
                            // posodobi referenco
                            setReferenceHipY(currentHipY);
                            const scalingFactor = calculateCmPerPixel(userHeightRef.current.value, poseResults.poseLandmarks, videoRef.current.videoHeight);
                            setCmPerPixel(scalingFactor);
                            setIsCalibrated(true);
                            setJumpPhase(JUMP_PHASE.READY);
                        }
                    }
                    else {
                        // oseba se je premaknila
                        setReferenceHipY(Infinity);
                        setIsCalibrated(false);
                        setJumpPhase(JUMP_PHASE.CALIBRATION);
                    }
                    // izpis opozoril
                    if (!isCalibrated) {
                        setFeedbackMessages(['Please stand still for calibration.']);
                    } else {
                        // calibrated
                        setFeedbackMessages([]);
                        if (isCurrentlyInSquat) {
                            // start
                            setJumpPhase(JUMP_PHASE.SQUAT);
                            setJumpActive(true);
                        }
                    }
                }
                else {
                    if (jumpPhase === JUMP_PHASE.LANDING) {
                        // testiram če stoji vzravnano in pri miru
                        if (isCurrentlyStill && !isCurrentlyInSquat) {
                            // novi izračun cm / pixel
                            const newScalingFactor = calculateCmPerPixel(userHeightRef.current.value, poseResults.poseLandmarks, videoRef.current.videoHeight);
                            const avgScalingFactor = (cmPerPixel + newScalingFactor) / 2;
                            const cmYDiff = (jumpHeightPx * avgScalingFactor) - adjustmentConstantRef.current.value;
                            // const cmYDiff = (jumpHeightPx * avgScalingFactor);
                            setJumpHeightCm(cmYDiff);
                            setJumpActive(false);
                            setJumpPhase(JUMP_PHASE.CALIBRATION);
                        }

                    }
                    // skok v teku
                    if (isInJump) {
                        // Update the highest hipY during the jump
                        if (currentHipY < highestHipY) {
                            setHighestHipY(currentHipY);
                        }
                    } else {
                        // Check if a jump is starting
                        if (!isInJump && checkAnklesLiftOff()) {
                            setIsInJump(true);
                            setHighestHipY(currentHipY);
                            setJumpPhase(JUMP_PHASE.IN_AIR);
                            // captureAndSaveFrame();
                        }
                    }

                    // Check if the jump has ended
                    if (isInJump && Math.abs(currentHipY - referenceHipY) <= 10) {
                        const pixelYDiff = referenceHipY - highestHipY;
                        setJumpHeightPx(pixelYDiff);
                        setIsInJump(false);
                        setJumpPhase(JUMP_PHASE.LANDING);
                    }
                }
            }
            else {
                setIsInJump(false);
                setJumpActive(false);
                setJumpPhase(JUMP_PHASE.CALIBRATION);
                setCurrentHipY(0); // Update the current y-coordinate state
                setFeedbackMessages(['Not all landmarks are visible.']);
            }
        }

    }, [poseResults, currentHipY, detectTPose, isInJump, isCalibrated, referenceHipY, cmPerPixel, highestHipY, videoRef, canvasRef, captureAndSaveFrame, checkAnklesLiftOff, jumpActive, jumpHeightCm, jumpHeightPx, jumpPhase]);

    return (
        <div>
            <div className='live-data-container'>
                {/* {isStill ? <p>STILL</p> : <p>MOVING</p>}
                {isInSquat ? <p>IN SQUAT</p> : <p>UPRIGHT</p>}
                {isInJump ? 'IN AIR' : 'ON FLOOR'} */}
                {/* <p>Current Hip Y: {currentHipY.toFixed(0)}</p>
                <p>Reference Hip Y: {referenceHipY.toFixed(0)}</p>
                <p>Highest Hip Y: {highestHipY.toFixed(0)}</p> */}
                <p>Phase: {jumpPhase}</p>
                <p>Jump height: {jumpHeightCm.toFixed(0)} cm</p>

            </div>
            <div className="feedback-messages-container">
                {feedbackMessages.map((message, index) => (
                    <div key={index}>{message}</div>
                ))}
            </div>
            {/* User height input */}
            <div className="user-height-input-container">
                <label htmlFor="userHeight">Your height (cm): </label>
                <input
                    type="number"
                    id="userHeight"
                    ref={userHeightRef} // Attach the ref to the input
                    defaultValue={185} // Set default value instead of using value for a controlled component
                    min="0"
                />
                <label htmlFor="adjustmentConstant" style={{ marginLeft: '10px' }}>Adjustment (cm): </label>
                <input
                    type="number"
                    id="adjustmentConstant"
                    ref={adjustmentConstantRef}
                    defaultValue={15}
                    min="0"
                />
            </div>
            {capturedImage && (
                <img src={capturedImage} alt="Captured Jump" className="captured-image" />
            )}        </div>
    );
};

export default CameraJump;
