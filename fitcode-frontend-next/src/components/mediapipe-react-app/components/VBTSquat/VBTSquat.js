import { POSE_LANDMARKS } from '@mediapipe/pose';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import './VBTSquat.css';

import { Thresholds } from '../../thresholds/Squat';
import {
  calculate2DDistance,
  calculate3DDistance,
  calculateAngles,
  calculateStandardDeviation,
  calculateStandardDeviation1D,
} from '../../utils/Calculations';
import { FeedbackGenerator } from '../FeedbackGenerator/FeedbackGenerator';
import { ESSENTIAL_SQUAT_LANDMARKS } from './Utils';
import { VBTPlot } from './VBTPlot'; // Import VBTPlot

const VBTSquat = ({ poseResults, videoRef, canvasRef }) => {
  const feedbackGenerator = useMemo(() => new FeedbackGenerator(), []);
  const [feedbackMessages, setFeedbackMessages] = useState([]);

  const hipAnkleDistances = useRef([]);
  const BUFFER_SIZE = 5; // Number of frames to consider for movement detection
  const MOVEMENT_THRESHOLD = 0.005;
  const ISOMETRIC_MOVEMENT_THRESHOLD = 0.01; // Adjusted to make isometric detection more sensitive

  const prevIsInSquatRef = useRef(false);
  const movementDetectedRef = useRef(false);

  const [isStill, setIsStill] = useState(false);
  const isReadyRef = useRef(false);
  const [countdown, setCountdown] = useState(3); // Countdown state for display
  const [isInSquat, setIsInSquat] = useState(false);
  const [squatPhase, setSquatPhase] = useState('standing'); // State to store the current phase

  const maxStandingDistanceRef = useRef(0);
  const standingKneeDistanceRef = useRef(0);
  const [leftKneeAngle, setLeftKneeAngle] = useState(0);
  const [rightKneeAngle, setRightKneeAngle] = useState(0);
  const [leftHipAngle, setLeftHipAngle] = useState(0);
  const [rightHipAngle, setRightHipAngle] = useState(0);
  const [squatCounter, setSquatCounter] = useState(0);
  const [isLowestPointDetected, setIsLowestPointDetected] = useState(false);

  const squatStartTimestampRef = useRef(0);
  const squatLowestTimestampRef = useRef(0);
  const squatEndTimestampRef = useRef(0);
  const isometricStartTimestampRef = useRef(0);
  const isometricTotalTimeRef = useRef(0);
  const shortestDistanceRef = useRef(Infinity);
  const [downTime, setDownTime] = useState(0);
  const [upTime, setUpTime] = useState(0);
  const [isometricTime, setIsometricTime] = useState(0);
  const [upTimesHistory, setUpTimesHistory] = useState([]);
  const [downTimesHistory, setDownTimesHistory] = useState([]);
  const [isometricTimesHistory, setIsometricTimesHistory] = useState([]);
  const [phaseDurations, setPhaseDurations] = useState({
    eccentric: 0,
    isometric: 0,
    concentric: 0,
  });
  const [currentStdDev, setCurrentStdDev] = useState(0); // State to store the current standard deviation

  const leftAnklePositions = useRef([]);
  const rightAnklePositions = useRef([]);
  const ANKLE_BUFFER_SIZE = 10; // Number of frames to consider for movement detection

  const updateAnklePositions = (newLeftPosition, newRightPosition) => {
    leftAnklePositions.current = [
      ...leftAnklePositions.current.slice(-ANKLE_BUFFER_SIZE + 1),
      newLeftPosition,
    ];
    rightAnklePositions.current = [
      ...rightAnklePositions.current.slice(-ANKLE_BUFFER_SIZE + 1),
      newRightPosition,
    ];
  };

  const updateHipAnkleDistances = (newDistance) => {
    hipAnkleDistances.current = [
      ...hipAnkleDistances.current.slice(-BUFFER_SIZE + 1),
      newDistance,
    ];
    setCurrentStdDev(calculateStandardDeviation1D(hipAnkleDistances.current)); // Update the current standard deviation
  };

  const handleSquatCompletion = useCallback(() => {
    if (
      !squatStartTimestampRef.current ||
      !squatLowestTimestampRef.current ||
      !squatEndTimestampRef.current
    ) {
      console.error('Error: One or more squat timestamps are undefined.');
      return;
    }

    const totalTime =
      squatEndTimestampRef.current - squatStartTimestampRef.current;
    const eccentricTime =
      squatLowestTimestampRef.current - squatStartTimestampRef.current;
    const concentricTime =
      squatEndTimestampRef.current - squatLowestTimestampRef.current;
    const totalIsometricTime = isometricTotalTimeRef.current;

    if (totalTime <= 300 || eccentricTime <= 0 || concentricTime <= 0) {
      console.error(
        'Error: Squat times are not valid. Total time or phase times are not within valid ranges.'
      );
      return;
    }

    const eccentricProportion = eccentricTime / totalTime;
    const concentricProportion = concentricTime / totalTime;

    const adjustedEccentricTime =
      eccentricTime - totalIsometricTime * eccentricProportion;
    const adjustedConcentricTime =
      concentricTime - totalIsometricTime * concentricProportion;

    if (adjustedEccentricTime < 0 || adjustedConcentricTime < 0) {
      console.error('Error: Adjusted phase times are not valid.');
      return;
    }

    setSquatCounter((prevCounter) => prevCounter + 1);
    setDownTime(eccentricTime);
    setUpTime(concentricTime);
    setIsometricTime(totalIsometricTime);

    setUpTimesHistory((prev) => [...prev, adjustedConcentricTime]);
    setDownTimesHistory((prev) => [...prev, adjustedEccentricTime]);
    setIsometricTimesHistory((prev) => [...prev, totalIsometricTime]);

    setPhaseDurations({
      eccentric: (adjustedEccentricTime / totalTime) * 100,
      isometric: (totalIsometricTime / totalTime) * 100,
      concentric: (adjustedConcentricTime / totalTime) * 100,
    });

    // Reset accumulated times after squat completion
    isometricTotalTimeRef.current = 0;
  }, [
    setSquatCounter,
    setDownTime,
    setUpTime,
    setIsometricTime,
    setPhaseDurations,
    setUpTimesHistory,
    setDownTimesHistory,
    setIsometricTimesHistory,
    squatStartTimestampRef,
    squatLowestTimestampRef,
    squatEndTimestampRef,
    isometricTotalTimeRef,
  ]);

  const resetCounter = () => {
    setSquatCounter(0);
    setDownTime(0);
    setUpTime(0);
    setIsometricTime(0);
    setUpTimesHistory([]);
    setDownTimesHistory([]);
    setIsometricTimesHistory([]);
    setPhaseDurations({ eccentric: 0, isometric: 0, concentric: 0 });
  };

  const resetDisplayStates = () => {
    setFeedbackMessages(['STEP BACK']);
    setLeftKneeAngle(0);
    setRightKneeAngle(0);
    setLeftHipAngle(0);
    setRightHipAngle(0);
    hipAnkleDistances.current = [];
    setIsInSquat(false);
    setIsStill(false);
    setIsLowestPointDetected(false);
    movementDetectedRef.current = false;
  };

  const updateStandingReferences = (
    isCurrentlyStill,
    leftHipAnkleDistance,
    rightHipAnkleDistance,
    results
  ) => {
    if (isCurrentlyStill) {
      const standingDistance = Math.max(
        leftHipAnkleDistance,
        rightHipAnkleDistance
      );
      if (standingDistance > maxStandingDistanceRef.current) {
        maxStandingDistanceRef.current = standingDistance;
      }
      const kneeDistance = calculate2DDistance(
        results.poseLandmarks[POSE_LANDMARKS.LEFT_KNEE],
        results.poseLandmarks[POSE_LANDMARKS.RIGHT_KNEE]
      );
      standingKneeDistanceRef.current = kneeDistance;
    } else {
      maxStandingDistanceRef.current = 0;
      standingKneeDistanceRef.current = 0;
    }
  };

  useEffect(() => {
    let timer; // This will hold our timeout for isReady
    let countdownTimer; // This will hold our interval for the countdown display

    if (isStill) {
      // Start the countdown when isStill is true
      setCountdown(3); // Reset countdown when isStill becomes true
      timer = setTimeout(() => {
        isReadyRef.current = true; // Set isReady to true after 3 seconds
      }, 3000);

      // Update countdown for display
      countdownTimer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown > 1) return prevCountdown - 1;
          clearInterval(countdownTimer);
          return 0;
        });
      }, 1000);
    } else {
      clearTimeout(timer); // Clear the timeout if isStill becomes false before 3 seconds
      isReadyRef.current = false;
      setCountdown(3); // Reset countdown
    }

    return () => {
      clearTimeout(timer); // Ensure we clean up on unmount or when isStill changes
      clearInterval(countdownTimer); // Clear the countdown timer
    };
  }, [isStill]); // This effect depends on the isStill state

  useEffect(() => {
    if (!poseResults) return;

    const updateSquatStatus = (isCurrentlyStill, results, currentTime) => {
      const {
        newLeftKneeAngle,
        newRightKneeAngle,
        newLeftHipAngle,
        newRightHipAngle,
      } = calculateAngles(results);

      const isCurrentlyInSquat =
        newLeftHipAngle < Thresholds.STANDING_HIP_ANGLE_THRESH ||
        newRightHipAngle < Thresholds.STANDING_HIP_ANGLE_THRESH ||
        newLeftKneeAngle < Thresholds.STANDING_KNEE_ANGLE_THRESH ||
        newRightKneeAngle < Thresholds.STANDING_KNEE_ANGLE_THRESH;

      const leftHipAnkleDistance = calculate3DDistance(
        results.poseWorldLandmarks[POSE_LANDMARKS.LEFT_HIP],
        results.poseWorldLandmarks[POSE_LANDMARKS.LEFT_ANKLE]
      );
      const rightHipAnkleDistance = calculate3DDistance(
        results.poseWorldLandmarks[POSE_LANDMARKS.RIGHT_HIP],
        results.poseWorldLandmarks[POSE_LANDMARKS.RIGHT_ANKLE]
      );

      const currentShortestDistance = Math.min(
        leftHipAnkleDistance,
        rightHipAnkleDistance
      );
      updateHipAnkleDistances(currentShortestDistance);

      if (
        isCurrentlyInSquat &&
        !prevIsInSquatRef.current &&
        isReadyRef.current
      ) {
        // START
        squatStartTimestampRef.current = currentTime;
        shortestDistanceRef.current = Infinity;
        movementDetectedRef.current = false;
        setIsLowestPointDetected(false);
        setSquatPhase('squat'); // Initial phase is squat when squat starts
      } else if (
        !isCurrentlyInSquat &&
        prevIsInSquatRef.current &&
        isReadyRef.current
      ) {
        // END
        if (!movementDetectedRef.current) {
          squatEndTimestampRef.current = currentTime;
          handleSquatCompletion();
        }
        movementDetectedRef.current = false;
        setSquatPhase('standing'); // Clear phase when squat ends
      }

      if (!isCurrentlyStill && isCurrentlyInSquat) {
        movementDetectedRef.current = true;
      }

      if (isCurrentlyInSquat && isReadyRef.current) {
        if (currentShortestDistance < shortestDistanceRef.current) {
          // Detected new lowest point
          shortestDistanceRef.current = currentShortestDistance;
          squatLowestTimestampRef.current = currentTime;
          setIsLowestPointDetected(true);
        } else {
          // Only detect isometric phase
          const stdDev = calculateStandardDeviation1D(
            hipAnkleDistances.current
          );
          if (stdDev < ISOMETRIC_MOVEMENT_THRESHOLD) {
            if (squatPhase !== 'isometry') {
              isometricStartTimestampRef.current = currentTime;
              setSquatPhase('isometry');
            } else {
              isometricTotalTimeRef.current +=
                currentTime - isometricStartTimestampRef.current;
              isometricStartTimestampRef.current = currentTime;
            }
          } else {
            if (squatPhase === 'isometry') {
              isometricTotalTimeRef.current +=
                currentTime - isometricStartTimestampRef.current;
            }
            setSquatPhase('squat');
          }
        }
      } else if (!isCurrentlyInSquat) {
        // Update standing reference distances if not in squat and still
        updateStandingReferences(
          isCurrentlyStill,
          leftHipAnkleDistance,
          rightHipAnkleDistance,
          results
        );
        setSquatPhase('standing');
      }

      setIsInSquat(isCurrentlyInSquat);
      prevIsInSquatRef.current = isCurrentlyInSquat;
    };

    if (poseResults.poseLandmarks) {
      const allLandmarksVisible = ESSENTIAL_SQUAT_LANDMARKS.every(
        (index) =>
          poseResults.poseLandmarks[index] &&
          poseResults.poseLandmarks[index].visibility > 0.5
      );
      if (allLandmarksVisible) {
        const currentTime = Date.now();
        // ankle positions
        const leftAnklePosition = {
          x: poseResults.poseLandmarks[POSE_LANDMARKS.LEFT_ANKLE].x,
          y: poseResults.poseLandmarks[POSE_LANDMARKS.LEFT_ANKLE].y,
        };
        const rightAnklePosition = {
          x: poseResults.poseLandmarks[POSE_LANDMARKS.RIGHT_ANKLE].x,
          y: poseResults.poseLandmarks[POSE_LANDMARKS.RIGHT_ANKLE].y,
        };
        updateAnklePositions(leftAnklePosition, rightAnklePosition);
        // check if still
        const stdDevLeft = calculateStandardDeviation(
          leftAnklePositions.current
        );
        const stdDevRight = calculateStandardDeviation(
          rightAnklePositions.current
        );
        const averageStdDev = (stdDevLeft + stdDevRight) / 2;
        const isCurrentlyStill = averageStdDev < MOVEMENT_THRESHOLD;
        setIsStill(isCurrentlyStill);
        updateSquatStatus(isCurrentlyStill, poseResults, currentTime);
        // Calculate and update angles
        const {
          newLeftKneeAngle,
          newRightKneeAngle,
          newLeftHipAngle,
          newRightHipAngle,
        } = calculateAngles(poseResults);
        setLeftKneeAngle(newLeftKneeAngle);
        setRightKneeAngle(newRightKneeAngle);
        setLeftHipAngle(newLeftHipAngle);
        setRightHipAngle(newRightHipAngle);

        // const feedbackMessages = feedbackGenerator.analyzePose(poseResults.poseWorldLandmarks, prevIsInSquatRef.current);
        // setFeedbackMessages(feedbackMessages);
        setFeedbackMessages([]);
      } else {
        resetDisplayStates();
      }
    }
  }, [
    poseResults,
    feedbackGenerator,
    handleSquatCompletion,
    isLowestPointDetected,
    isInSquat,
    squatPhase,
  ]);

  return (
    <div>
      <div className="vbt-live-data-container">
        Squat Counter: {squatCounter}
        <br />
        {/* Current Phase: {squatPhase}<br />
                Eccentric Phase: {downTime.toFixed(0)} ms<br />
                Isometric Phase: {isometricTime.toFixed(0)} ms<br />
                Concentric Phase: {upTime.toFixed(0)} ms<br /> */}
        {/* Current Std Dev: {currentStdDev.toFixed(5)}<br /> */}
        <button onClick={resetCounter} className="reset-controls">
          Reset Counter
        </button>
      </div>
      {feedbackMessages.length > 0 && (
        <div className="feedback-messages-container">
          {feedbackMessages.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
        </div>
      )}
      <div
        style={{
          position: 'fixed', // Using fixed to ensure it stays in the center regardless of scrolling
          top: '50%', // Center vertically
          left: '50%', // Center horizontally
          transform: 'translate(-50%, -50%)', // Adjust to perfectly center the div
          fontSize: '5em', // Large font size for the whole container, adjust if necessary for the light
          textAlign: 'center', // Ensures text alignment is centered
          width: '100%', // Full width to center content properly
          zIndex: 1000, // High z-index to ensure it is above other content
        }}
      >
        <div>
          {isStill && !isReadyRef.current ? (
            <p
              style={{
                fontSize: '6em', // Making font size larger for the countdown specifically
                color: 'white', // Making the text color white for visibility
                margin: 0, // Remove default margin
              }}
            >
              {countdown}
            </p>
          ) : (
            <p></p>
          )}
        </div>
      </div>
      <VBTPlot
        upTimesHistory={upTimesHistory}
        downTimesHistory={downTimesHistory}
        isometricTimesHistory={isometricTimesHistory}
      />
    </div>
  );
};

export default VBTSquat;
