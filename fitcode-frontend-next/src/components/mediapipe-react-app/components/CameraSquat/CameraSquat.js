// TestSquat.js
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  calculate3DDistance,
  calculate2DDistance,
  calculateStandardDeviation,
  calculateAngles,
  calculate3DCoM,
  calculateTrunkAngle,
} from '../../utils/Calculations';
import { Thresholds } from '../../thresholds/Squat';
// import { SquatTimesBar } from '../Charts/SquatTimesBar/SquatTimesBar'
// import { SquatUpTimeGraph } from '../Charts/SquatUpTimes/SquatUpTimes';
import { FeedbackGenerator } from '../FeedbackGenerator/FeedbackGenerator';
import { SquatMetrics } from './SquatMetrics';
import './CameraSquat.css';

const CameraSquat = ({ poseResults, videoRef, canvasRef, poseLandmarks }) => {
  const POSE_LANDMARKS = poseLandmarks;

  const ESSENTIAL_SQUAT_LANDMARKS = [
    poseLandmarks.LEFT_HIP,
    poseLandmarks.RIGHT_HIP,
    poseLandmarks.LEFT_KNEE,
    poseLandmarks.RIGHT_KNEE,
    poseLandmarks.LEFT_ANKLE,
    poseLandmarks.RIGHT_ANKLE,
    poseLandmarks.LEFT_SHOULDER,
    poseLandmarks.RIGHT_SHOULDER,
  ];
  const feedbackGenerator = useMemo(() => new FeedbackGenerator(), []);
  const [feedbackMessages, setFeedbackMessages] = useState([]);

  const leftAnklePositions = useRef([]);
  const rightAnklePositions = useRef([]);
  const ANKLE_BUFFER_SIZE = 10; // Number of frames to consider for movement detection
  const MOVEMENT_THRESHOLD = 0.01; // Adjust based on testing to find a suitable threshold
  const prevIsInSquatRef = useRef(false);
  const movementDetectedRef = useRef(false);

  /* eslint-disable no-unused-vars */

  const [isStill, setIsStill] = useState(false);
  const isReadyRef = useRef(false);
  const [countdown, setCountdown] = useState(3); // Countdown state for display
  const [isInSquat, setIsInSquat] = useState(false);

  const [squatDepthPercentage, setSquatDepthPercentage] = useState(0);
  const maxStandingDistanceRef = useRef(0);
  const [kneeDistPercentage, setKneeDistPercentage] = useState(0);
  const standingKneeDistanceRef = useRef(0);
  const [leftKneeAngle, setLeftKneeAngle] = useState(0);
  const [rightKneeAngle, setRightKneeAngle] = useState(0);
  const [leftHipAngle, setLeftHipAngle] = useState(0);
  const [rightHipAngle, setRightHipAngle] = useState(0);
  const [squatCounter, setSquatCounter] = useState(0);
  const [CoM, setCoM] = useState({ x: 0, y: 0, z: 0 });
  const [ankleMidpoint, setAnkleMidpoint] = useState({ x: 0, y: 0, z: 0 });
  const [CoMVector, setCoMVector] = useState({ x: 0, y: 0, z: 0 });

  const squatStartTimestampRef = useRef(0);
  const squatLowestTimestampRef = useRef(0);
  const squatEndTimestampRef = useRef(0);
  const shortestDistanceRef = useRef(Infinity);
  const [downTime, setDownTime] = useState(0);
  const [upTime, setUpTime] = useState(0);
  const [upTimesHistory, setUpTimesHistory] = useState([]);
  const [showGraph, setShowGraph] = useState(true);

  // capture frame
  const [squatFrames, setSquatFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [viewingSquatIndex, setViewingSquatIndex] = useState(null); // Index of the squat being viewed, null if none
  const [tempLowestFrame, setTempLowestFrame] = useState(null);
  const latestSquatFramesRef = useRef([]); // Initialize the ref with an empty array
  const [tempLowestFrames, setTempLowestFrames] = useState(null);
  const [isLowestPointDetected, setIsLowestPointDetected] = useState(false);

  // squat metrics
  const [squatMetricsInstances, setSquatMetricsInstances] = useState([]);
  const squatMetricsRef = useRef(null);
  const [latestSquatFeedback, setLatestSquatFeedback] = useState([]);
  const comExtremeRef = useRef(0);
  const kneeDistExtremeRef = useRef(0);
  const [feedbackType, setFeedbackType] = useState('Boolean');

  /* eslint-enable no-unused-vars */

  // Navigate to the previous frame within the current squat
  const showPreviousFrame = () => {
    setCurrentFrameIndex((current) => Math.max(current - 1, 0));
  };

  // Navigate to the next frame within the current squat
  const showNextFrame = () => {
    if (viewingSquatIndex !== null) {
      setCurrentFrameIndex((current) =>
        Math.min(current + 1, squatFrames[viewingSquatIndex].length - 1)
      );
    }
  };

  const downloadCurrentImage = () => {
    if (
      viewingSquatIndex !== null &&
      squatFrames[viewingSquatIndex] &&
      squatFrames[viewingSquatIndex][currentFrameIndex]
    ) {
      const imageUrl = squatFrames[viewingSquatIndex][currentFrameIndex];
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `SquatFrame-${viewingSquatIndex + 1}-${currentFrameIndex + 1}.png`; // Naming the file with squat and frame indices
      document.body.appendChild(link); // Append to body to make it "clickable"
      link.click(); // Simulate click to trigger download
      document.body.removeChild(link); // Clean up
    }
  };

  const captureFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Draw the video frame to the canvas
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Convert the canvas to an image (DataURL) and return it
    return canvas.toDataURL('image/png');
  }, [videoRef, canvasRef]);

  const captureAndUpdateBuffer = useCallback(() => {
    const currentFrame = captureFrame(); // Assuming this synchronously captures the frame
    const newBuffer =
      latestSquatFramesRef.current.length < 3
        ? [...latestSquatFramesRef.current, currentFrame]
        : [...latestSquatFramesRef.current.slice(1), currentFrame];

    latestSquatFramesRef.current = newBuffer;
  }, [captureFrame]);

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

  const handleSquatCompletion = useCallback(() => {
    console.log(
      `tempLowestFrames length: ${tempLowestFrames ? tempLowestFrames.length : 'Not set'}`
    );

    // Ensure all timestamps are defined and non-zero
    if (
      !squatStartTimestampRef.current ||
      !squatLowestTimestampRef.current ||
      !squatEndTimestampRef.current
    ) {
      console.error('Error: One or more squat timestamps are undefined.');
      return;
    }

    // Calculate downTime and upTime
    const downTime =
      squatLowestTimestampRef.current - squatStartTimestampRef.current;
    const upTime =
      squatEndTimestampRef.current - squatLowestTimestampRef.current;
    squatMetricsRef.current.updateAscentTime(upTime);
    squatMetricsRef.current.updateDescentTime(downTime);

    // For scenarios when standing state is toggled by mistake
    if (downTime <= 100 || upTime <= 100) {
      console.error(
        'Error: Squat times are not valid. downTime or upTime is less than or equal to 100ms.'
      );
      return;
    }

    // All checks passed, safe to update state
    setSquatCounter((prevCounter) => prevCounter + 1);
    setDownTime(downTime);
    setUpTime(upTime);
    setUpTimesHistory((prev) => [...prev, upTime]);
    // save frames
    setSquatFrames((prevSquatFrames) => {
      // Clone the previous state to avoid direct mutations
      const updatedSquatFrames = [...prevSquatFrames];

      // Ensure the array for the current squat exists and is correctly positioned
      while (updatedSquatFrames.length <= squatCounter) {
        updatedSquatFrames.push([]);
      }

      // Directly assign the frames from tempLowestFrames to the current squat, ensuring non-null frames
      updatedSquatFrames[squatCounter] = tempLowestFrames.filter(
        (frame) => frame !== null
      );

      return updatedSquatFrames;
    });

    // update the com extreme
    squatMetricsRef.current.updateCOM(comExtremeRef.current);
    squatMetricsRef.current.updateKneeAlignmentDepthPercentage(
      kneeDistExtremeRef.current
    );

    // append to metrics list
    if (squatMetricsRef.current) {
      if (feedbackType === 'Descriptive') {
        const feedbackLines = [
          `${squatMetricsRef.current.getSquatType()}`,
          `${squatMetricsRef.current.getMovementRhythm()}`,
          `${squatMetricsRef.current.getDescentPhase()}`,
          `${squatMetricsRef.current.getKneeAlignment()}`,
          `${squatMetricsRef.current.getLimbLoading()}`,
        ];

        setLatestSquatFeedback(feedbackLines); // Store feedback as an array of lines
      } else if (feedbackType === 'Boolean') {
        const ratio =
          squatMetricsRef.current.ankleDistance /
          squatMetricsRef.current.hipDistance;
        let stanceDescription = '';
        if (ratio < Thresholds.FEET_SPACING[0]) {
          stanceDescription = ' (too narrow)';
        } else if (ratio > Thresholds.FEET_SPACING[1]) {
          stanceDescription = ' (too wide)';
        }

        // If feedback type is set to Boolean, use the getBooleanFeedback method
        const booleanFeedback = squatMetricsRef.current.getBooleanFeedback();
        const feedbackLines = [
          <div>
            Depth:{' '}
            {booleanFeedback.depth ? (
              <span style={{ color: '#00c9a7' }}>✔</span>
            ) : (
              <span style={{ color: '#FF5550' }}>✘ (too shallow)</span>
            )}
          </div>,
          <div>
            Stance:{' '}
            {booleanFeedback.stance ? (
              <span style={{ color: '#00c9a7' }}>✔</span>
            ) : (
              <span style={{ color: '#FF5550' }}>✘{stanceDescription}</span>
            )}
          </div>,
          <div>
            Descent:{' '}
            {booleanFeedback.descent ? (
              <span style={{ color: '#00c9a7' }}>✔</span>
            ) : (
              <span style={{ color: '#FF5550' }}>✘ (too fast)</span>
            )}
          </div>,
          <div>
            Ascent:{' '}
            {booleanFeedback.ascent ? (
              <span style={{ color: '#00c9a7' }}>✔</span>
            ) : (
              <span style={{ color: '#FF5550' }}>✘ (too slow)</span>
            )}
          </div>,
          <div>
            Symmetry:{' '}
            {booleanFeedback.symmetry ? (
              <span style={{ color: '#00c9a7' }}>✔</span>
            ) : (
              <span style={{ color: '#FF5550' }}>✘</span>
            )}
          </div>,
          <div>
            Coordination:{' '}
            {booleanFeedback.coordination ? (
              <span style={{ color: '#00c9a7' }}>✔</span>
            ) : (
              <span style={{ color: '#FF5550' }}>✘ (trunk tilt)</span>
            )}
          </div>,
        ];

        setLatestSquatFeedback(feedbackLines); // Store boolean feedback as an array of lines
      }

      // Append the current squat metrics instance to the list, then reset for the next squat
      setSquatMetricsInstances((prevInstances) => [
        ...prevInstances,
        squatMetricsRef.current,
      ]);
      squatMetricsRef.current = null;
    }
  }, [
    squatCounter,
    setSquatCounter,
    setDownTime,
    setUpTime,
    setUpTimesHistory,
    setSquatFrames,
    feedbackType,
    squatStartTimestampRef,
    squatLowestTimestampRef,
    squatEndTimestampRef,
    tempLowestFrames,
  ]);

  const resetCounter = () => {
    setSquatCounter(0);
    setUpTimesHistory([]);
    setSquatFrames([]);
  };

  const resetDisplayStates = () => {
    setFeedbackMessages(['STEP BACK']);
    setLeftKneeAngle(0);
    setRightKneeAngle(0);
    setLeftHipAngle(0);
    setRightHipAngle(0);
    setCoMVector({ x: 0, y: 0, z: 0 });
    leftAnklePositions.current = [];
    rightAnklePositions.current = [];
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
      // if (validFeetSpacing(results.poseWorldLandmarks)) {
      const kneeDistance = calculate2DDistance(
        results.poseLandmarks[POSE_LANDMARKS.LEFT_KNEE],
        results.poseLandmarks[POSE_LANDMARKS.RIGHT_KNEE]
      );
      standingKneeDistanceRef.current = kneeDistance;
      // }
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
      } = calculateAngles(results, POSE_LANDMARKS);

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
        squatMetricsRef.current = new SquatMetrics(); // new metrics instance
        kneeDistExtremeRef.current = 100;
        comExtremeRef.current = 0;

        // save stance distances
        const hipDist = calculate2DDistance(
          results.poseLandmarks[POSE_LANDMARKS.LEFT_HIP],
          results.poseLandmarks[POSE_LANDMARKS.RIGHT_HIP]
        );
        const ankleDist = calculate2DDistance(
          results.poseLandmarks[POSE_LANDMARKS.LEFT_ANKLE],
          results.poseLandmarks[POSE_LANDMARKS.RIGHT_ANKLE]
        );
        squatMetricsRef.current.updateAnkleDistance(ankleDist);
        squatMetricsRef.current.updateHipDistance(hipDist);
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
      }

      if (!isCurrentlyStill && isCurrentlyInSquat) {
        movementDetectedRef.current = true;
      }

      if (isCurrentlyInSquat && isReadyRef.current) {
        captureAndUpdateBuffer(); // Continuously update your frame buffer
        if (currentShortestDistance < shortestDistanceRef.current) {
          // Detected new lowest point
          shortestDistanceRef.current = currentShortestDistance;
          squatLowestTimestampRef.current = currentTime;
          setIsLowestPointDetected(true);
          // Save the buffer as it currently stands (this should have the lowest frame as the last one)
          setTempLowestFrames([...latestSquatFramesRef.current]);
          const depth =
            (currentShortestDistance / maxStandingDistanceRef.current) * 100;
          squatMetricsRef.current.updateSquatDepth(depth);
          // calculate and update trunk angle
          const trunkAngle = calculateTrunkAngle(results.poseWorldLandmarks);
          squatMetricsRef.current.updateTrunkAngle(trunkAngle);
        }
        if (
          isLowestPointDetected &&
          currentShortestDistance >= shortestDistanceRef.current
        ) {
          // The condition above is important: it ensures we're past the lowest point
          // Now, the person is still in squat but we're past the lowest point,
          // so we update the buffer to include one frame after the lowest point
          setTempLowestFrames([...latestSquatFramesRef.current]);
          setIsLowestPointDetected(false); // Reset for the next detection
        }

        if (maxStandingDistanceRef.current > 0) {
          const currentDistance = Math.min(
            leftHipAnkleDistance,
            rightHipAnkleDistance
          );
          const depthPercentage =
            (currentDistance / maxStandingDistanceRef.current) * 100;
          setSquatDepthPercentage(depthPercentage);
        }

        if (standingKneeDistanceRef.current > 0) {
          const kneeDistance = calculate2DDistance(
            results.poseLandmarks[POSE_LANDMARKS.LEFT_KNEE],
            results.poseLandmarks[POSE_LANDMARKS.RIGHT_KNEE]
          );
          const kneeDistPercentage =
            (kneeDistance / standingKneeDistanceRef.current) * 100;
          setKneeDistPercentage(kneeDistPercentage);
          if (kneeDistPercentage > kneeDistExtremeRef.current) {
            kneeDistExtremeRef.current = kneeDistPercentage;
          }
        }
      } else {
        // Update standing reference distances if not in squat and still
        updateStandingReferences(
          isCurrentlyStill,
          leftHipAnkleDistance,
          rightHipAnkleDistance,
          results
        );
        setSquatDepthPercentage(0);
        setKneeDistPercentage(0);
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
        } = calculateAngles(poseResults, POSE_LANDMARKS);
        setLeftKneeAngle(newLeftKneeAngle);
        setRightKneeAngle(newRightKneeAngle);
        setLeftHipAngle(newLeftHipAngle);
        setRightHipAngle(newRightHipAngle);
        // Calculate CoM
        const currentCoM = calculate3DCoM(poseResults.poseWorldLandmarks, POSE_LANDMARKS);
        setCoM(currentCoM);

        // Calculate the midpoint of the ankles in 3D
        const leftAnkle =
          poseResults.poseWorldLandmarks[POSE_LANDMARKS.LEFT_ANKLE];
        const rightAnkle =
          poseResults.poseWorldLandmarks[POSE_LANDMARKS.RIGHT_ANKLE];
        const midpoint = {
          x: (leftAnkle.x + rightAnkle.x) / 2,
          y: (leftAnkle.y + rightAnkle.y) / 2,
          z: (leftAnkle.z + rightAnkle.z) / 2,
        };
        setAnkleMidpoint(midpoint);

        // Update CoMVector
        const vector = {
          x: currentCoM.x - midpoint.x,
          y: currentCoM.y - midpoint.y,
          z: currentCoM.z - midpoint.z,
        };
        setCoMVector(vector);
        if (isInSquat) {
          // Check if the absolute value of the current CoM is greater than the stored extreme
          if (Math.abs(vector.x) > Math.abs(comExtremeRef.current)) {
            // Update the extreme value
            comExtremeRef.current = vector.x;
          }
        }

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
    captureFrame,
    captureAndUpdateBuffer,
    isLowestPointDetected,
    isInSquat,
  ]);

  const handleFeedbackTypeChange = (event) => {
    setFeedbackType(event.target.value);
  };

  return (
    <div>
      <div className="live-data-container">
        {/* {isStill ? <p>STILL</p> : <p>MOVING</p>}
                {isInSquat ? <p>IN SQUAT</p> : <p>UPRIGHT</p>} 

                Squat Depth: {squatDepthPercentage.toFixed(1)}%<br />
                Knee Distance: {kneeDistPercentage.toFixed(1)}%<br />
                Left Knee Angle: {leftKneeAngle.toFixed(0)}°<br />
                Right Knee Angle: {rightKneeAngle.toFixed(0)}°<br />
                Left Hip Angle: {leftHipAngle.toFixed(0)}°<br />
                Right Hip Angle: {rightHipAngle.toFixed(0)}°<br />
                <div>
                    CoM:
                    {` ${CoMVector.x.toFixed(2)}`}
                </div>*/}
        Squat Counter: {squatCounter}
        <br />
        <button onClick={resetCounter} className="reset-controls">
          RESET
        </button>
      </div>
      {/* {squatCounter > 0 && (
                <SquatTimesBar downTime={downTime} upTime={upTime} />
            )} */}
      {/* {squatCounter > 1 && (
                <>
                    <div className="up-times-container">
                        {showGraph && (
                            <SquatUpTimeGraph upTimesHistory={upTimesHistory} />
                        )}
                    </div>
                    <div className="toggle-button-container">
                        <button onClick={() => setShowGraph(!showGraph)}>
                            {showGraph ? 'Hide Squat Times Graph' : 'Show Squat Times Graph'}
                        </button>
                    </div>
                </>
            )} */}
      {feedbackMessages.length > 0 && (
        <div className="feedback-messages-container">
          {feedbackMessages.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
        </div>
      )}
      {viewingSquatIndex !== null && squatFrames[viewingSquatIndex] && (
        <div className="frame-viewer-container">
          <img
            src={squatFrames[viewingSquatIndex][currentFrameIndex]}
            alt={`Frame ${currentFrameIndex + 1}`}
            className="important-frame"
          />
          <div className="button-group">
            <button
              onClick={showPreviousFrame}
              disabled={currentFrameIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={showNextFrame}
              disabled={
                currentFrameIndex === squatFrames[viewingSquatIndex].length - 1
              }
            >
              Next
            </button>
            <button onClick={downloadCurrentImage}>Download Image</button>
            <button onClick={() => setViewingSquatIndex(null)}>
              Close Viewer
            </button>
          </div>
        </div>
      )}

      <div className="squat-selection-container">
        {squatFrames.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setViewingSquatIndex(index);
              setCurrentFrameIndex(0); // Start viewing from the first frame of this squat
            }}
          >
            REP {index + 1}
          </button>
        ))}
      </div>

      {/*  <div style={{ position: 'absolute', top: 70, right: 20 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: isStill ? 'green' : 'red' }} />
            </div>
            */}

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
        {/* Light indicator with specific positioning if needed *
                <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '25px',
                    backgroundColor: isReadyRef.current ? 'green' : 'red',
                    position: 'absolute', // Positioning absolutely within the parent
                    top: '20px', // Position from top of the viewport
                    left: '10%', // Center horizontally within the parent
                    transform: 'translateX(-50%)', // Center the light indicator
                    marginBottom: '10px' // Adjust the bottom margin if needed
                }} />/}
                {/* Countdown display with enhanced visibility */}
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

      <div className="squat-feedback-container">
        {latestSquatFeedback.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
        {/* Container for label and dropdown*/}
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <select
            id="feedbackType"
            onChange={handleFeedbackTypeChange}
            value={feedbackType}
          >
            <option value="Descriptive">Descriptive</option>
            <option value="Boolean">Boolean</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CameraSquat;
