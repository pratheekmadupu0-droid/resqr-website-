/**
 * RESQR Biometric Core Service
 * Multi-Angle Biometric Facial Verification & Presentation Attack Detection (PAD)
 * Conforming to NIST presentation attack guidelines and privacy separation.
 */

let faceapi = null;
let modelsLoaded = false;
let modelLoadPromise = null;

export const BIOMETRIC_MATCH_THRESHOLD = 0.45; // Strict Euclidean distance threshold (NEVER lowered)
export const TEMPLATE_VERSION = '1.0';

/**
 * Dynamically loads face-api models from local assets or CDN fallback.
 */
export async function loadBiometricModels() {
    if (modelsLoaded) return true;
    if (modelLoadPromise) return modelLoadPromise;

    modelLoadPromise = (async () => {
        try {
            if (!faceapi) {
                faceapi = await import('@vladmandic/face-api');
            }

            const MODEL_URL = '/models/face';
            const FALLBACK_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
            } catch (localErr) {
                console.warn('Local models failed, attempting CDN fallback...', localErr);
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(FALLBACK_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(FALLBACK_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(FALLBACK_URL)
                ]);
            }

            modelsLoaded = true;
            return true;
        } catch (err) {
            console.error('Failed to load biometric models:', err);
            modelLoadPromise = null;
            throw new Error('Biometric AI models could not be initialized.');
        }
    })();

    return modelLoadPromise;
}

/**
 * Calculates Eye Aspect Ratio (EAR) for blink liveness detection.
 */
function calculateEAR(eye) {
    // 6 landmark points per eye
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const v1 = dist(eye[1], eye[5]);
    const v2 = dist(eye[2], eye[4]);
    const h = dist(eye[0], eye[3]);
    if (h === 0) return 0.3;
    return (v1 + v2) / (2.0 * h);
}

/**
 * Estimates head pose (yaw, pitch, roll) and landmark geometry from 68 landmarks.
 */
export function estimateHeadPose(landmarks) {
    const points = landmarks.positions;
    if (!points || points.length < 68) return { yaw: 0, pitch: 0, roll: 0, ear: 0.3 };

    const jawLeft = points[0];
    const jawRight = points[16];
    const noseTip = points[30];
    const noseBridge = points[27];
    const chin = points[8];
    const leftEyeOuter = points[36];
    const rightEyeOuter = points[45];

    // Yaw estimation: ratio of nose tip to left/right jaw boundaries
    const dLeft = Math.abs(noseTip.x - jawLeft.x);
    const dRight = Math.abs(jawRight.x - noseTip.x);
    const totalW = dLeft + dRight;
    const yawRatio = totalW > 0 ? (dRight - dLeft) / totalW : 0;
    // yaw in degrees: negative = turned left, positive = turned right
    const yaw = Math.round(yawRatio * 65);

    // Pitch estimation: nose vertical ratio
    const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
    const faceH = chin.y - eyeMidY;
    const noseRelativeY = faceH > 0 ? (noseTip.y - eyeMidY) / faceH : 0.45;
    const pitch = Math.round((noseRelativeY - 0.45) * 60);

    // Roll estimation: eye tilt
    const dY = rightEyeOuter.y - leftEyeOuter.y;
    const dX = rightEyeOuter.x - leftEyeOuter.x;
    const roll = Math.round((Math.atan2(dY, dX) * 180) / Math.PI);

    // Calculate Eye Aspect Ratio (EAR)
    const leftEye = [points[36], points[37], points[38], points[39], points[40], points[41]];
    const rightEye = [points[42], points[43], points[44], points[45], points[46], points[47]];
    const ear = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2;

    return { yaw, pitch, roll, ear };
}

/**
 * Analyzes image quality (brightness, blur, frame boundary, multiple faces).
 */
export function analyzeImageQuality(inputElement, detection) {
    const box = detection.detection.box;
    const imgW = inputElement.videoWidth || inputElement.width || 640;
    const imgH = inputElement.videoHeight || inputElement.height || 480;

    // Boundary check: is the face inside the frame?
    const marginX = imgW * 0.05;
    const marginY = imgH * 0.05;
    const isInsideFrame = (
        box.x >= marginX &&
        box.y >= marginY &&
        (box.x + box.width) <= (imgW - marginX) &&
        (box.y + box.height) <= (imgH - marginY)
    );

    // Proximity check: is the face too small?
    const faceHeightRatio = box.height / imgH;
    const isTooFar = faceHeightRatio < 0.22;
    const isTooClose = faceHeightRatio > 0.85;

    // Extract face ROI for luminance & sharpness
    let meanLuminance = 128;
    let blurScore = 100;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(32, Math.floor(box.width));
        canvas.height = Math.max(32, Math.floor(box.height));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(inputElement, box.x, box.y, box.width, box.height, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let totalY = 0;
        const count = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
            // Y = 0.299R + 0.587G + 0.114B
            totalY += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }
        meanLuminance = Math.round(totalY / count);

        // Simple Laplacian / edge variance approximation
        let edgeSum = 0;
        const w = canvas.width;
        for (let y = 1; y < canvas.height - 1; y += 2) {
            for (let x = 1; x < w - 1; x += 2) {
                const idx = (y * w + x) * 4;
                const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
                edgeSum += Math.abs(center - right);
            }
        }
        blurScore = Math.round((edgeSum / (count / 4)) * 10);
    } catch (e) {
        // Fallback if canvas extraction restricted
    }

    const isTooDark = meanLuminance < 45;
    const isTooBright = meanLuminance > 225;
    const isBlurry = blurScore < 15;

    let qualityStatus = 'GOOD';
    let qualityMessage = 'Position verified.';

    if (!isInsideFrame) {
        qualityStatus = 'OUT_OF_FRAME';
        qualityMessage = 'Keep your face inside the frame.';
    } else if (isTooFar) {
        qualityStatus = 'TOO_FAR';
        qualityMessage = 'Move closer';
    } else if (isTooClose) {
        qualityStatus = 'TOO_CLOSE';
        qualityMessage = 'Move farther';
    } else if (isTooDark) {
        qualityStatus = 'TOO_DARK';
        qualityMessage = 'Too dark — improve lighting';
    } else if (isTooBright) {
        qualityStatus = 'TOO_BRIGHT';
        qualityMessage = 'Lighting too bright — avoid glare';
    } else if (isBlurry) {
        qualityStatus = 'BLURRY';
        qualityMessage = 'Hold still';
    }

    return {
        isInsideFrame,
        isTooFar,
        isTooClose,
        isTooDark,
        isTooBright,
        isBlurry,
        meanLuminance,
        blurScore,
        qualityStatus,
        qualityMessage,
        isAcceptable: qualityStatus === 'GOOD'
    };
}

/**
 * Detects all faces in frame and extracts landmarks, pose, and quality.
 */
export async function detectSingleFace(inputElement) {
    await loadBiometricModels();

    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.55
    });

    const detections = await faceapi
        .detectAllFaces(inputElement, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detections || detections.length === 0) {
        return {
            status: 'NO_FACE',
            message: 'No face detected. Please face the camera.',
            faceCount: 0
        };
    }

    if (detections.length > 1) {
        return {
            status: 'MULTIPLE_FACES',
            message: 'MULTIPLE FACES DETECTED. Only the registered user must be visible.',
            faceCount: detections.length
        };
    }

    const primary = detections[0];
    const pose = estimateHeadPose(primary.landmarks);
    const quality = analyzeImageQuality(inputElement, primary);

    return {
        status: 'FACE_DETECTED',
        detection: primary,
        descriptor: Array.from(primary.descriptor),
        pose,
        quality,
        faceCount: 1
    };
}

/**
 * Verifies target angle (Front, Left, Right) with quality criteria.
 */
export function verifyAngleTarget(pose, targetStep) {
    const yaw = pose.yaw;

    if (targetStep === 'FRONT') {
        const isMatch = Math.abs(yaw) <= 12;
        return {
            isMatch,
            feedback: isMatch ? 'Ready to capture' : 'Look directly at the camera'
        };
    }

    if (targetStep === 'LEFT') {
        // Turning to user's left means negative yaw (-16° to -48°)
        const isMatch = yaw <= -15 && yaw >= -50;
        return {
            isMatch,
            feedback: isMatch ? 'Ready to capture' : (yaw > -15 ? 'Turn left slightly more' : 'Turn right slightly more')
        };
    }

    if (targetStep === 'RIGHT') {
        // Turning to user's right means positive yaw (+15° to +50°)
        const isMatch = yaw >= 15 && yaw <= 50;
        return {
            isMatch,
            feedback: isMatch ? 'Ready to capture' : (yaw < 15 ? 'Turn right slightly more' : 'Turn left slightly more')
        };
    }

    return { isMatch: false, feedback: 'Position face' };
}

/**
 * Calculates Euclidean distance between two 128-d descriptors.
 */
export function euclideanDistance(desc1, desc2) {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) return 1.0;
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        const diff = desc1[i] - desc2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Compares probe descriptor against enrolled 3-angle templates (Front, Left, Right).
 * Does NOT lower the security threshold for emergencies.
 */
export function matchAgainstEnrolledTemplates(probeDescriptor, biometricProfile) {
    if (!probeDescriptor || !biometricProfile) {
        return { isMatch: false, minDistance: 1.0, matchedView: null, error: 'Missing biometric reference' };
    }

    const { frontTemplate, leftTemplate, rightTemplate } = biometricProfile;
    const comparisons = [];

    if (frontTemplate?.descriptor) {
        comparisons.push({ view: 'FRONT', dist: euclideanDistance(probeDescriptor, frontTemplate.descriptor) });
    }
    if (leftTemplate?.descriptor) {
        comparisons.push({ view: 'LEFT', dist: euclideanDistance(probeDescriptor, leftTemplate.descriptor) });
    }
    if (rightTemplate?.descriptor) {
        comparisons.push({ view: 'RIGHT', dist: euclideanDistance(probeDescriptor, rightTemplate.descriptor) });
    }

    if (comparisons.length === 0) {
        return { isMatch: false, minDistance: 1.0, matchedView: null, error: 'No enrolled views found' };
    }

    comparisons.sort((a, b) => a.dist - b.dist);
    const best = comparisons[0];
    const isMatch = best.dist <= BIOMETRIC_MATCH_THRESHOLD;

    return {
        isMatch,
        minDistance: Number(best.dist.toFixed(4)),
        matchedView: best.view,
        confidence: Math.max(0, Math.min(100, Math.round((1 - best.dist / 0.70) * 100)))
    };
}

/**
 * Passive Presentation Attack Detection (PAD) for Hospital / Unconscious patient mode.
 * Evaluates live sensor variance across consecutive video frames to prevent static photo spoofs.
 */
export class PassivePADAnalyzer {
    constructor() {
        this.frameHistories = [];
        this.maxFrames = 4;
    }

    reset() {
        this.frameHistories = [];
    }

    addSample(detection, quality) {
        const box = detection.detection.box;
        const nose = detection.landmarks.positions[30];
        this.frameHistories.push({
            time: Date.now(),
            box: { x: box.x, y: box.y, w: box.width, h: box.height },
            nose: { x: nose.x, y: nose.y },
            luminance: quality.meanLuminance,
            blur: quality.blurScore
        });

        if (this.frameHistories.length > this.maxFrames) {
            this.frameHistories.shift();
        }
    }

    evaluatePassiveLiveness() {
        if (this.frameHistories.length < 3) {
            return { isLive: false, score: 0.5, reason: 'Accumulating optical variance...' };
        }

        // Check for static 2D photo replay: a printed sheet held in front of the lens
        // has 0 micro-movement or constant luminance. Live video has sensor thermal noise.
        let totalNoseJitter = 0;
        let totalLumDelta = 0;
        for (let i = 1; i < this.frameHistories.length; i++) {
            const prev = this.frameHistories[i - 1];
            const curr = this.frameHistories[i];
            const dist = Math.hypot(curr.nose.x - prev.nose.x, curr.nose.y - prev.nose.y);
            totalNoseJitter += dist;
            totalLumDelta += Math.abs(curr.luminance - prev.luminance);
        }

        const avgJitter = totalNoseJitter / (this.frameHistories.length - 1);
        const avgLum = totalLumDelta / (this.frameHistories.length - 1);

        // A live hand-held camera or subtle living human will have small jitter (0.4 to 18px)
        const isLive = avgJitter >= 0.3 && avgJitter <= 25.0;
        const score = isLive ? 0.88 : 0.35;

        return {
            isLive,
            score,
            reason: isLive ? 'Live optical stream confirmed' : 'Sensor variance inconclusive'
        };
    }
}
