import { Thresholds } from "../../thresholds/Squat";

export class SquatMetrics {
    constructor() {
        this.squatDepth = null;
        this.ascentTime = null;
        this.descentTime = null;
        this.kneeAlignmentDepthPercentage = null;
        this.com = null; // Center of Mass deviation to evaluate limb loading
        this.ankleDistance = null; // Distance between ankles
        this.hipDistance = null; // Distance between hips
        this.trunkAngle = null;
    }

    updateSquatDepth(depth) {
        this.squatDepth = depth;
    }

    updateAscentTime(time) {
        this.ascentTime = time;
    }

    updateDescentTime(time) {
        this.descentTime = time;
    }

    updateKneeAlignmentDepthPercentage(depthPercentage) {
        this.kneeAlignmentDepthPercentage = depthPercentage;
    }

    updateCOM(com) {
        this.com = com;
    }

    updateAnkleDistance(distance) {
        this.ankleDistance = distance;
    }

    updateHipDistance(distance) {
        this.hipDistance = distance;
    }

    updateTrunkAngle(angle) {
        this.trunkAngle = angle;
    }

    calculateStance() {
        if (this.ankleDistance && this.hipDistance) {
            const ratio = this.ankleDistance / this.hipDistance;
            return ratio >= 1.5 && ratio <= 2.3;
        }
        else {
            return false;
        }
    }

    getSquatType() {
        const depthFeedback = "It seems you performed a squat, specifically a %s.";
        if (this.squatDepth <= 45) return depthFeedback.replace("%s", "full squat");
        else if (this.squatDepth <= 70) return depthFeedback.replace("%s", "half squat");
        else return depthFeedback.replace("%s", "quarter squat");
    }

    getMovementRhythm() {
        const rhythmFeedback = "The rhythm of your movement was %s.";
        if (this.ascentTime < 600) return rhythmFeedback.replace("%s", "quite reactive");
        else if (this.ascentTime <= 700) return rhythmFeedback.replace("%s", "dynamic");
        else if (this.ascentTime <= 1000) return rhythmFeedback.replace("%s", "controlled");
        else return rhythmFeedback.replace("%s", "Slow");
    }

    getDescentPhase() {
        const descentFeedback = "On the other hand, the descent phase was %s.";
        return this.descentTime < 500 ?
            descentFeedback.replace("%s", "with good eccentric load") :
            descentFeedback.replace("%s", "not significantly loading eccentric contraction regime");
    }

    getKneeAlignment() {
        const alignmentFeedback = "Your knee alignment during the movement was %s.";
        return this.kneeAlignmentDepthPercentage > 150 ?
            alignmentFeedback.replace("%s", "fair, allowing good hip rhythm") :
            alignmentFeedback.replace("%s", "quite narrow, potentially not hitting optimal depth");
    }

    getLimbLoading() {
        const loadingFeedback = "In regards to symmetrical limb loading, this was a %s.";
        if (this.com >= -0.034 && this.com <= 0.034) return loadingFeedback.replace("%s", "well-aligned squat");
        else if (this.com >= 0.035 && this.com <= 0.045) return loadingFeedback.replace("%s", "slightly left leg dominant squat");
        else if (this.com <= -0.035 && this.com >= -0.045) return loadingFeedback.replace("%s", "slightly right leg dominant squat");
        else if (this.com > 0.046) return loadingFeedback.replace("%s", "heavily left leg dominant squat");
        else return loadingFeedback.replace("%s", "heavily right leg dominant squat");
    }

    getBooleanFeedback() {
        return {
            depth: this.squatDepth <= 50, // true for full squat and half squat, false for quarter squat
            stance: this.calculateStance(), // Always true for now, as there's no data for this metric
            descent: this.descentTime > 700, // true if descent time is more than 700ms
            ascent: this.ascentTime < 700, // true if ascent time is less than 700ms
            symmetry: Math.abs(this.com) < 0.05, // true if COM deviation is less than 0.05
            coordination: this.trunkAngle < Thresholds.TRUNK_VERTICAL_THRESH
        };
    }

}
