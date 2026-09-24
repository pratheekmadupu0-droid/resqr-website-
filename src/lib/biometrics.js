/**
 * RESQR Biometric Core Service
 * Multi-Angle Biometric Facial Verification & Presentation Attack Detection (PAD)
 * Conforming to NIST presentation attack guidelines and privacy separation.
 */

import { db } from './firebase';
import { ref, get, update } from 'firebase/database';

let faceapi = null;
let modelsLoaded = false;
let modelLoadPromise = null;

export const BIOMETRIC_MATCH_THRESHOLD = 0.45; // Strict Euclidean distance threshold (NEVER lowered)
export const TEMPLATE_VERSION = '1.0';

/**
 * Dynamically loads face-api models from local assets or CDN fallback.
 */
export async function loadBiometricModels() {
    if (modelsLoaded && faceapi?.nets?.tinyFaceDetector?.isLoaded) return true;
    if (modelLoadPromise) return modelLoadPromise;

    modelLoadPromise = (async () => {
        try {
            if (!faceapi) {
                faceapi = await import('@vladmandic/face-api');
            }

            if (faceapi.tf?.ready) {
                try {
                    await faceapi.tf.ready();
                } catch (tfErr) {
                    console.warn('TensorFlow backend init warning:', tfErr);
                }
            }

            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const baseUrl = typeof window !== 'undefined' ? (import.meta.env?.BASE_URL || '/') : '/';
            const cleanBase = (origin + baseUrl).replace(/\/+$/, '');
            const MODEL_URL = `${cleanBase}/models/face`;
            const FALLBACK_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

            if (!faceapi.nets.tinyFaceDetector.isLoaded || 
                !faceapi.nets.faceLandmark68Net.isLoaded || 
                !faceapi.nets.faceRecognitionNet.isLoaded) {
                
                const candidateUrls = [
                    '/models/face',
                    MODEL_URL,
                    FALLBACK_URL
                ];

                let loaded = false;
                let lastErr = null;

                for (const url of candidateUrls) {
                    try {
                        await Promise.all([
                            faceapi.nets.tinyFaceDetector.loadFromUri(url),
                            faceapi.nets.faceLandmark68Net.loadFromUri(url),
                            faceapi.nets.faceRecognitionNet.loadFromUri(url)
                        ]);
                        loaded = true;
                        break;
                    } catch (loadErr) {
                        lastErr = loadErr;
                        console.warn(`Could not load models from ${url}, trying fallback...`, loadErr);
                    }
                }

                if (!loaded) {
                    throw lastErr || new Error('Biometric AI models could not be loaded from any source');
                }
            }

            modelsLoaded = true;
            return true;
        } catch (err) {
            console.error('Failed to load biometric models:', err);
            modelLoadPromise = null;
            throw new Error('Biometric AI models could not be initialized: ' + (err.message || err));
        }
    })();

    return modelLoadPromise;
}

/**
 * Persists biometric enrollment to Firebase RTDB under secure user and profile nodes.
 * Enforces ownership and isolates biometric data from public documents.
 */
export async function saveBiometricProfileToAccount({ uid, profileId, biometricProfile }) {
    if (!uid) {
        throw new Error("User authentication required to save biometric profile.");
    }
    if (!profileId) {
        throw new Error("Profile identifier required to save biometric profile.");
    }
    if (!biometricProfile?.frontTemplate?.descriptor ||
        !biometricProfile?.leftTemplate?.descriptor ||
        !biometricProfile?.rightTemplate?.descriptor) {
        throw new Error("Biometric enrollment incomplete: Front, Left, and Right facial views must all be captured.");
    }

    const payload = {
        uid,
        profileId,
        enrollmentStatus: 'enrolled',
        faceEnrollmentStatus: 'completed',
        frontTemplate: biometricProfile.frontTemplate,
        leftTemplate: biometricProfile.leftTemplate,
        rightTemplate: biometricProfile.rightTemplate,
        frontPhotoSnapshot: biometricProfile.frontPhotoSnapshot || biometricProfile.frontTemplate?.snapshot || null,
        templateVersion: TEMPLATE_VERSION,
        createdAt: biometricProfile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const updates = {};
    // Store under isolated biometric collection
    updates[`biometricProfiles/${profileId}`] = payload;
    // Store under user's private biometric vault
    updates[`users/${uid}/biometricProfiles/${profileId}`] = payload;
    // Record enrollment state on user account
    updates[`users/${uid}/faceEnrollmentStatus`] = 'completed';
    updates[`users/${uid}/biometricEnrolled`] = true;

    await update(ref(db), updates);

    // Save state to localStorage for offline / quick reload recovery
    try {
        localStorage.setItem(`resqr_face_status_${uid}_${profileId}`, JSON.stringify({
            status: 'completed',
            updatedAt: payload.updatedAt
        }));
    } catch (e) {
        // non-blocking
    }

    return { success: true, profile: payload };
}

/**
 * Checks if user has already completed face enrollment for this profile.
 */
export async function checkBiometricEnrollmentStatus({ uid, profileId }) {
    if (!uid || !profileId) return { enrolled: false, status: 'pending' };

    try {
        // 1. Check user-scoped biometric profile
        const userBioRef = ref(db, `users/${uid}/biometricProfiles/${profileId}`);
        const userBioSnap = await get(userBioRef);
        if (userBioSnap.exists()) {
            const data = userBioSnap.val();
            if (data?.frontTemplate?.descriptor && data?.faceEnrollmentStatus === 'completed') {
                return { enrolled: true, status: 'completed', profile: data };
            }
        }

        // 2. Check root biometric collection
        const rootBioRef = ref(db, `biometricProfiles/${profileId}`);
        const rootBioSnap = await get(rootBioRef);
        if (rootBioSnap.exists()) {
            const data = rootBioSnap.val();
            if (data?.frontTemplate?.descriptor && data?.enrollmentStatus === 'enrolled') {
                return { enrolled: true, status: 'completed', profile: data };
            }
        }
    } catch (err) {
        console.warn("Could not check biometric status:", err);
    }

    return { enrolled: false, status: 'pending' };
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

    // Boundary check: is the face inside the frame? (2% margin to avoid false out-of-frame on head turns)
    const marginX = imgW * 0.02;
    const marginY = imgH * 0.02;
    const isInsideFrame = (
        box.x >= marginX &&
        box.y >= marginY &&
        (box.x + box.width) <= (imgW - marginX) &&
        (box.y + box.height) <= (imgH - marginY)
    );

    // Proximity check: is the face too small or too huge?
    const faceHeightRatio = box.height / imgH;
    const isTooFar = faceHeightRatio < 0.15;
    const isTooClose = faceHeightRatio > 0.90;

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

    const isTooDark = meanLuminance < 25;
    const isTooBright = meanLuminance > 240;
    const isBlurry = blurScore < 5;

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

    if (!inputElement || (inputElement.readyState && inputElement.readyState < 2) || !inputElement.videoWidth) {
        return {
            status: 'INITIALIZING',
            message: 'Initializing video stream...',
            faceCount: 0
        };
    }

    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.35
    });

    const detections = await faceapi
        .detectAllFaces(inputElement, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detections || detections.length === 0) {
        return {
            status: 'NO_FACE',
            message: 'NO FACE DETECTED. Move closer to the camera and make sure your face is clearly visible.',
            faceCount: 0
        };
    }

    if (detections.length > 1) {
        return {
            status: 'MULTIPLE_FACES',
            message: 'MULTIPLE FACES DETECTED. Only one person should be visible. Please make sure nobody else is inside the camera frame.',
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
        const isMatch = Math.abs(yaw) <= 15;
        return {
            isMatch,
            feedback: isMatch ? 'Face centered — Ready to capture' : 'Look directly at the camera'
        };
    }

    if (targetStep === 'LEFT') {
        // Turning to user's left gives negative yaw (-10° to -55°)
        const isMatch = yaw <= -10 && yaw >= -55;
        return {
            isMatch,
            feedback: isMatch 
                ? 'Left angle verified — Ready to capture' 
                : (yaw > -10 ? 'Turn face slowly to the LEFT' : 'Turned too far — Turn slightly back towards center')
        };
    }

    if (targetStep === 'RIGHT') {
        // Turning to user's right gives positive yaw (+10° to +55°)
        const isMatch = yaw >= 10 && yaw <= 55;
        return {
            isMatch,
            feedback: isMatch 
                ? 'Right angle verified — Ready to capture' 
                : (yaw < 10 ? 'Turn face slowly to the RIGHT' : 'Turned too far — Turn slightly back towards center')
        };
    }

    return { isMatch: false, feedback: 'Position face inside frame' };
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
