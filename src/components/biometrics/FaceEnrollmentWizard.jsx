import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, CheckCircle2, ShieldCheck, AlertTriangle, RefreshCw,
    X, Sparkles, Loader2, ArrowRight, Eye, ShieldAlert, SwitchCamera,
    Lock, Check, AlertCircle
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { 
    detectSingleFace, 
    verifyAngleTarget, 
    loadBiometricModels, 
    saveBiometricProfileToAccount,
    checkBiometricEnrollmentStatus,
    isPseudoEmbedding,
    TEMPLATE_VERSION 
} from '../../lib/biometrics';
import toast from 'react-hot-toast';

export default function FaceEnrollmentWizard({
    uid,
    profileId,
    onComplete,
    onCancel,
    stepNumber = 1,
    totalSteps = 5
}) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Permission and camera lifecycle states:
    // 'CHECKING_SAVED' | 'PERMISSION_PROMPT' | 'CAMERA_ACTIVE' | 'CAMERA_ERROR' | 'SAVE_READY' | 'SAVING' | 'ALREADY_COMPLETED'
    const [uiStage, setUiStage] = useState('CHECKING_SAVED');
    const [cameraErrorType, setCameraErrorType] = useState(null); // 'NO_CAMERA' | 'PERMISSION_DENIED' | 'IN_USE' | 'NOT_SUPPORTED' | 'STREAM_FAILURE'
    const [modelLoading, setModelLoading] = useState(false);
    const [modelReady, setModelReady] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState('user');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    // Registration angle stages: 'FRONT' | 'LEFT' | 'RIGHT' | 'COMPLETE'
    const [currentStep, setCurrentStep] = useState('FRONT');
    const [isCapturing, setIsCapturing] = useState(false);

    // Real-time detection feedback
    const [faceStatus, setFaceStatus] = useState('SEARCHING'); // 'SEARCHING' | 'ALIGNING' | 'WARNING' | 'ERROR' | 'READY'
    const [statusMessage, setStatusMessage] = useState('Position your face inside the frame.');
    const [multipleFaces, setMultipleFaces] = useState(false);
    const [yawAngle, setYawAngle] = useState(0);
    const [isAngleAligned, setIsAngleAligned] = useState(false);
    const [qualityOk, setQualityOk] = useState(false);
    const [qualityReason, setQualityReason] = useState('');

    // Blink / Liveness for Front face
    const [blinkDetected, setBlinkDetected] = useState(false);
    const earHistoryRef = useRef([]);

    // Enrolled views storage & template reference (ref prevents stale closures)
    const firstSideSignRef = useRef(null); // records user's side-turn sign (-1 or 1)
    const templatesRef = useRef({
        front: null,
        left: null,
        right: null
    });
    const [enrolledTemplates, setEnrolledTemplates] = useState({
        front: null,
        left: null,
        right: null
    });
    const [finalBiometricProfile, setFinalBiometricProfile] = useState(null);

    // Backend save states
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Stop active camera media stream
    const stopCameraStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (e) {}
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            try {
                videoRef.current.srcObject = null;
            } catch (e) {}
        }
        setCameraActive(false);
    }, []);

    // 1. Initial mount: check if face profile already exists in DB / localStorage
    useEffect(() => {
        let isMounted = true;

        const checkExisting = async () => {
            const currentAuthUid = auth?.currentUser?.uid;
            const targetUid = uid || currentAuthUid;
            const targetPid = profileId || (currentAuthUid ? `c_${currentAuthUid}` : null);

            if (targetUid && targetPid) {
                try {
                    const result = await checkBiometricEnrollmentStatus({ uid: targetUid, profileId: targetPid });
                    if (!isMounted) return;
                    if (result.enrolled && result.profile) {
                        setFinalBiometricProfile(result.profile);
                        const existing = {
                            front: result.profile.frontTemplate || null,
                            left: result.profile.leftTemplate || null,
                            right: result.profile.rightTemplate || null
                        };
                        templatesRef.current = existing;
                        setEnrolledTemplates(existing);
                        setUiStage('ALREADY_COMPLETED');
                        return;
                    }
                } catch (e) {
                    console.warn("Could not check existing face registration:", e);
                }
            }

            if (isMounted) {
                setUiStage('PERMISSION_PROMPT');
            }
        };

        checkExisting();

        // Check for multiple video input devices
        if (navigator.mediaDevices?.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                if (isMounted && videoInputs.length > 1) {
                    setHasMultipleCameras(true);
                }
            }).catch(() => {});
        }

        return () => {
            isMounted = false;
            stopCameraStream();
        };
    }, [uid, profileId, stopCameraStream]);

    // Robust video stream attachment helper
    const attachStreamToVideo = useCallback((videoElement) => {
        if (!videoElement || !streamRef.current) return;

        if (videoElement.srcObject !== streamRef.current) {
            videoElement.srcObject = streamRef.current;
        }

        const playVideo = async () => {
            try {
                await videoElement.play();
                setCameraActive(true);
            } catch (err) {
                console.warn("Autoplay deferred or handled:", err);
                setCameraActive(true);
            }
        };

        videoElement.onloadedmetadata = () => {
            playVideo();
        };

        if (videoElement.readyState >= 1) {
            playVideo();
        }
    }, []);

    // Callback ref for the <video> element to handle mounting cleanly
    const setVideoRef = useCallback((node) => {
        videoRef.current = node;
        if (node && streamRef.current) {
            attachStreamToVideo(node);
        }
    }, [attachStreamToVideo]);

    // Ensure stream is attached whenever uiStage switches to CAMERA_ACTIVE
    useEffect(() => {
        if (uiStage === 'CAMERA_ACTIVE' && videoRef.current && streamRef.current) {
            attachStreamToVideo(videoRef.current);
        }
    }, [uiStage, attachStreamToVideo]);

    // Handle tab visibility change (stop camera if user switches tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && streamRef.current) {
                stopCameraStream();
                if (uiStage === 'CAMERA_ACTIVE') {
                    setUiStage('PERMISSION_PROMPT');
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [uiStage, stopCameraStream]);

    // Request Camera Permission and Start Stream
    const handleEnableCamera = async () => {
        stopCameraStream();
        setCameraErrorType(null);
        setModelLoading(true);

        try {
            // First ensure AI vision models are initialized
            await loadBiometricModels();
            setModelReady(true);
            setModelLoading(false);
        } catch (modelErr) {
            console.error("Biometric model loading failed:", modelErr);
            setModelLoading(false);
            setCameraErrorType('STREAM_FAILURE');
            setUiStage('CAMERA_ERROR');
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraErrorType('NOT_SUPPORTED');
            setUiStage('CAMERA_ERROR');
            return;
        }

        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: facingMode ? { ideal: facingMode } : 'user'
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            setUiStage('CAMERA_ACTIVE');

            // Attach stream immediately if video element is already mounted
            if (videoRef.current) {
                attachStreamToVideo(videoRef.current);
            }
        } catch (err) {
            console.error("Camera access error:", err);
            stopCameraStream();

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraErrorType('PERMISSION_DENIED');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraErrorType('NO_CAMERA');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setCameraErrorType('IN_USE');
            } else if (err.name === 'OverconstrainedError') {
                // Retry with standard unconstrained video
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    streamRef.current = fallbackStream;
                    setUiStage('CAMERA_ACTIVE');
                    if (videoRef.current) {
                        attachStreamToVideo(videoRef.current);
                    }
                    return;
                } catch (fbErr) {
                    setCameraErrorType('STREAM_FAILURE');
                }
            } else {
                setCameraErrorType('STREAM_FAILURE');
            }

            setUiStage('CAMERA_ERROR');
        }
    };

    // Toggle camera between front and environment
    const handleSwitchCamera = async () => {
        const nextMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(nextMode);
        stopCameraStream();
        setTimeout(() => {
            handleEnableCamera();
        }, 150);
    };

    // 2. Real-time Face Detection Loop
    useEffect(() => {
        if (uiStage !== 'CAMERA_ACTIVE' || !cameraActive || currentStep === 'COMPLETE') return;

        let animationFrameId;
        let isEvaluating = false;
        let lastEvalTime = 0;

        const loop = async (timestamp) => {
            const video = videoRef.current;
            // Throttle to at most once every 90ms for high responsiveness without freezing the CPU/UI
            if (video && video.readyState >= 2 && video.videoWidth > 0 && !isEvaluating && (timestamp - lastEvalTime > 90)) {
                isEvaluating = true;
                lastEvalTime = timestamp;
                try {
                    const result = await detectSingleFace(video, { extractDescriptor: false });

                    if (result.status === 'INITIALIZING') {
                        setFaceStatus('SEARCHING');
                        setStatusMessage('Initializing video stream...');
                        setIsAngleAligned(false);
                        setQualityOk(false);
                    } else if (result.status === 'MULTIPLE_FACES') {
                        setMultipleFaces(true);
                        setFaceStatus('ERROR');
                        setStatusMessage('MULTIPLE FACES DETECTED. Only one person should be visible. Please make sure nobody else is inside the camera frame.');
                        setIsAngleAligned(false);
                        setQualityOk(false);
                    } else if (result.status === 'NO_FACE') {
                        setMultipleFaces(false);
                        setFaceStatus('SEARCHING');
                        setStatusMessage('NO FACE DETECTED. Move closer to the camera and make sure your face is clearly visible.');
                        setIsAngleAligned(false);
                        setQualityOk(false);
                    } else if (result.status === 'FACE_DETECTED') {
                        setMultipleFaces(false);
                        const yaw = result.pose.yaw;
                        setYawAngle(yaw);

                        // Blink liveness check for Front capture
                        if (currentStep === 'FRONT') {
                            const ear = result.pose.ear;
                            earHistoryRef.current.push(ear);
                            if (earHistoryRef.current.length > 10) earHistoryRef.current.shift();
                            const minEar = Math.min(...earHistoryRef.current);
                            const maxEar = Math.max(...earHistoryRef.current);
                            if (minEar < 0.20 && maxEar > 0.25) {
                                setBlinkDetected(true);
                            }
                        }

                        // Quality check
                        const quality = result.quality;
                        setQualityOk(quality.isAcceptable);
                        setQualityReason(quality.qualityMessage);

                        // Angle alignment check with direction memory
                        const angleCheck = verifyAngleTarget(result.pose, currentStep, firstSideSignRef.current);
                        setIsAngleAligned(angleCheck.isMatch);

                        if (!quality.isAcceptable) {
                            setFaceStatus('WARNING');
                            setStatusMessage(quality.qualityMessage);
                        } else if (!angleCheck.isMatch) {
                            setFaceStatus('ALIGNING');
                            setStatusMessage(angleCheck.feedback);
                        } else {
                            setFaceStatus('READY');
                            if (currentStep === 'FRONT') {
                                setStatusMessage(
                                    blinkDetected
                                        ? '✓ LIVENESS CONFIRMED — READY TO CAPTURE'
                                        : '✓ FRONT FACE READY TO CAPTURE'
                                );
                            } else {
                                setStatusMessage(`✓ ${currentStep} FACE READY TO CAPTURE`);
                            }
                        }

                        // Cache latest detection on video element for capture
                        video._latestBiometric = result;
                    }
                } catch (e) {
                    console.error("Face detection loop error:", e);
                } finally {
                    isEvaluating = false;
                }
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [uiStage, cameraActive, currentStep, blinkDetected]);

    // 3. Step Capture Handler
    const handleCaptureStep = async () => {
        const video = videoRef.current;
        if (!video) {
            toast.error("Camera not active. Please enable camera.");
            return;
        }

        setIsCapturing(true);

        try {
            // Snapshot dedicated frame canvas for isolated descriptor extraction
            const snapCanvas = document.createElement('canvas');
            const vW = video.videoWidth || 640;
            const vH = video.videoHeight || 480;
            snapCanvas.width = vW;
            snapCanvas.height = vH;
            const sCtx = snapCanvas.getContext('2d', { willReadFrequently: true });
            sCtx.drawImage(video, 0, 0, vW, vH);

            // Extract high-precision biometric descriptor directly from the snapshot
            let bio = null;
            try {
                bio = await detectSingleFace(snapCanvas, { extractDescriptor: true });
            } catch (e) {
                console.warn("On-demand detection exception:", e);
            }

            if (!bio || bio.status !== 'FACE_DETECTED' || !bio.descriptor || bio.descriptor.length !== 128 || isPseudoEmbedding(bio.descriptor)) {
                setIsCapturing(false);
                toast.error(bio?.message || "Could not extract high-precision biometric features. Please hold steady with good lighting.");
                return;
            }

            const angleCheck = verifyAngleTarget(bio.pose, currentStep, firstSideSignRef.current);
            if (!angleCheck.isMatch) {
                if (currentStep === 'FRONT' && Math.abs(bio.pose.yaw) > 18) {
                    setIsCapturing(false);
                    toast.error("Please look straight into the camera for the front view.");
                    return;
                }
                if (currentStep === 'LEFT' && Math.abs(bio.pose.yaw) < 5) {
                    setIsCapturing(false);
                    toast.error("Please turn your head slightly to the left.");
                    return;
                }
                if (currentStep === 'RIGHT') {
                    if (Math.abs(bio.pose.yaw) < 5) {
                        setIsCapturing(false);
                        toast.error("Please turn your head slightly to the right.");
                        return;
                    }
                    if (firstSideSignRef.current && bio.pose.yaw * firstSideSignRef.current > 0 && Math.abs(bio.pose.yaw) > 6) {
                        setIsCapturing(false);
                        toast.error("Please turn your head to the opposite side.");
                        return;
                    }
                }
            }

            // Create high-clarity snapshot for verification fallback & visual audit
            let stepSnapshot = null;
            try {
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = 320;
                cropCanvas.height = 320;
                const cropCtx = cropCanvas.getContext('2d');
                const minDim = Math.min(vW, vH);
                const sx = (vW - minDim) / 2;
                const sy = (vH - minDim) / 2;
                if (facingMode === 'user') {
                    cropCtx.translate(320, 0);
                    cropCtx.scale(-1, 1);
                }
                cropCtx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 320, 320);
                stepSnapshot = cropCanvas.toDataURL('image/jpeg', 0.85);
            } catch (e) {
                console.warn("Snapshot capture error:", e);
            }

            const template = {
                descriptor: bio.descriptor,
                qualityScore: Number(((bio.detection?.detection?.score || 0.9) * 100).toFixed(1)),
                yaw: bio.pose.yaw,
                pitch: bio.pose.pitch,
                snapshot: stepSnapshot,
                capturedAt: new Date().toISOString()
            };

            if (currentStep === 'FRONT') {
                templatesRef.current.front = template;
                setEnrolledTemplates(prev => ({ ...prev, front: template }));
                toast.success("✓ FRONT FACE CAPTURED");
                setCurrentStep('LEFT');
                setStatusMessage('Turn your head slightly to the LEFT.');
            } else if (currentStep === 'LEFT') {
                firstSideSignRef.current = bio.pose.yaw < 0 ? -1 : 1;
                templatesRef.current.left = template;
                setEnrolledTemplates(prev => ({ ...prev, left: template }));
                toast.success("✓ LEFT PROFILE CAPTURED");
                setCurrentStep('RIGHT');
                setStatusMessage('Turn your head slightly to the RIGHT.');
            } else if (currentStep === 'RIGHT') {
                templatesRef.current.right = template;
                const completeTemplates = {
                    front: templatesRef.current.front,
                    left: templatesRef.current.left,
                    right: template
                };
                setEnrolledTemplates(completeTemplates);
                toast.success("✓ RIGHT PROFILE CAPTURED");
                setCurrentStep('COMPLETE');
                stopCameraStream();

                const bioProfile = {
                    enrollmentStatus: 'enrolled',
                    faceEnrollmentStatus: 'completed',
                    frontTemplate: completeTemplates.front,
                    leftTemplate: completeTemplates.left,
                    rightTemplate: template,
                    frontPhotoSnapshot: completeTemplates.front?.snapshot || frontSnapshot || null,
                    templateVersion: TEMPLATE_VERSION,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                setFinalBiometricProfile(bioProfile);
                setUiStage('SAVE_READY');
            }
        } catch (err) {
            console.error("Step capture error:", err);
            toast.error("Capture failed: " + (err.message || "Please try again."));
        } finally {
            setIsCapturing(false);
        }
    };

    // 4. Save Biometric Profile to User Account (CRITICAL: Section 25 & 26)
    const handleSaveBiometricProfile = async () => {
        if (!finalBiometricProfile) {
            toast.error("Facial profile capture incomplete.");
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        const toastId = toast.loading("Creating secure facial profile...");

        try {
            const currentAuthUid = auth?.currentUser?.uid;
            const targetUid = uid || currentAuthUid || 'guest_user';
            const targetPid = profileId || (currentAuthUid ? `c_${currentAuthUid}` : `c_${targetUid}`);

            const saveResult = await saveBiometricProfileToAccount({
                uid: targetUid,
                profileId: targetPid,
                biometricProfile: finalBiometricProfile
            });

            if (saveResult?.success) {
                setSaveSuccess(true);
                toast.success("✓ FACIAL PROFILE CREATED", { id: toastId });

                // Advancing to Step 2 ONLY AFTER backend confirms success
                setTimeout(() => {
                    if (onComplete) {
                        onComplete(saveResult.profile);
                    }
                }, 800);
            } else {
                throw new Error("Backend storage confirmation failed.");
            }
        } catch (err) {
            console.error("Biometric save failed:", err);
            setIsSaving(false);
            setSaveError("FACIAL PROFILE COULD NOT BE SAVED. Please check network connection and try again.");
            toast.error("FACIAL PROFILE COULD NOT BE SAVED", { id: toastId });
        }
    };

    // 5. Reset / Re-enroll
    const handleReEnroll = () => {
        stopCameraStream();
        firstSideSignRef.current = null;
        templatesRef.current = { front: null, left: null, right: null };
        setEnrolledTemplates({ front: null, left: null, right: null });
        setFinalBiometricProfile(null);
        setCurrentStep('FRONT');
        setSaveSuccess(false);
        setSaveError(null);
        setUiStage('PERMISSION_PROMPT');
    };

    return (
        <div className="bg-[#0A0F1D] border border-white/10 rounded-[36px] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden font-manrope">
            {/* Header / Biometric Protocol Banner */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="text-red-500" size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">
                            Biometric Security Protocol
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight font-poppins">
                        RESQR Face Registration
                    </h3>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">
                        Step {stepNumber} of {totalSteps}
                    </p>
                </div>
                {onCancel && (
                    <button 
                        onClick={() => {
                            stopCameraStream();
                            onCancel();
                        }}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Cancel"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* STAGE 1: Checking Existing Profile */}
            {uiStage === 'CHECKING_SAVED' && (
                <div className="py-16 text-center space-y-4">
                    <Loader2 className="animate-spin text-red-500 mx-auto" size={36} />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Synchronizing Biometric Identity Status...
                    </p>
                </div>
            )}

            {/* STAGE 2: Already Completed (e.g. on Page Refresh / Resume) */}
            {uiStage === 'ALREADY_COMPLETED' && (
                <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                    <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                        <CheckCircle2 size={42} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                            ✓ FACE REGISTRATION COMPLETE
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                            Your secure biometric facial profile is enrolled and stored on your account. You can proceed directly to personal details.
                        </p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-sm mx-auto flex items-center justify-around text-center">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Front Face</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Left Face</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Right Face</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (onComplete && finalBiometricProfile) {
                                    onComplete(finalBiometricProfile);
                                }
                            }}
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
                        >
                            PROCEED TO STEP 2
                            <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleReEnroll}
                            className="w-full sm:w-auto px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors"
                        >
                            RE-ENROLL FACIAL PROFILE
                        </button>
                    </div>
                </div>
            )}

            {/* STAGE 3: Camera Permission UI (Section 4) */}
            {uiStage === 'PERMISSION_PROMPT' && (
                <div className="py-8 px-4 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
                    <div className="w-20 h-20 bg-red-600/10 border-2 border-red-500/30 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/20">
                        <Camera size={36} />
                    </div>

                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 block mb-1 font-poppins">
                            RESQR FACE REGISTRATION
                        </span>
                        <h4 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                            Step {stepNumber} of {totalSteps}
                        </h4>
                    </div>

                    <div className="space-y-3 text-slate-300 text-xs leading-relaxed">
                        <p className="font-bold text-white text-sm">
                            We need to securely verify your identity.
                        </p>
                        <p className="text-slate-400">
                            Your camera will be used to register your facial profile (Front, Left, and Right views).
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={handleEnableCamera}
                            disabled={modelLoading}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-white/10 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
                        >
                            {modelLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    INITIALIZING VISION MODELS...
                                </>
                            ) : (
                                <>
                                    <Camera size={16} />
                                    ENABLE CAMERA
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* STAGE 4: Camera Error Handling (Section 5) */}
            {uiStage === 'CAMERA_ERROR' && (
                <div className="py-8 px-4 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
                    <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20">
                        <AlertTriangle size={36} />
                    </div>

                    {cameraErrorType === 'NO_CAMERA' && (
                        <div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                NO CAMERA DETECTED
                            </h4>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Please connect or enable a camera device on your system and try again.
                            </p>
                        </div>
                    )}

                    {cameraErrorType === 'PERMISSION_DENIED' && (
                        <div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                CAMERA PERMISSION DENIED
                            </h4>
                            <p className="text-xs text-slate-300 font-bold mt-2">
                                CAMERA ACCESS REQUIRED
                            </p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                Please allow camera access in your browser settings and try again.
                            </p>
                        </div>
                    )}

                    {cameraErrorType === 'IN_USE' && (
                        <div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                CAMERA IS CURRENTLY IN USE
                            </h4>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Close other applications or tabs using the camera and try again.
                            </p>
                        </div>
                    )}

                    {cameraErrorType === 'NOT_SUPPORTED' && (
                        <div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                CAMERA NOT SUPPORTED
                            </h4>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Please use a modern browser such as Chrome, Edge, Safari, or Firefox over HTTPS.
                            </p>
                        </div>
                    )}

                    {cameraErrorType === 'STREAM_FAILURE' && (
                        <div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                UNABLE TO START CAMERA
                            </h4>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                An error occurred starting the camera feed. Please check device permissions and retry.
                            </p>
                        </div>
                    )}

                    <div className="pt-4 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleEnableCamera}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
                        >
                            <RefreshCw size={14} />
                            TRY AGAIN
                        </button>
                    </div>
                </div>
            )}

            {/* STAGE 5: Live Camera View & Capture (Sections 8, 9, 10, 11) */}
            {uiStage === 'CAMERA_ACTIVE' && currentStep !== 'COMPLETE' && (
                <div className="space-y-6">
                    {/* Multi-angle indicator pills: Front ● Left ○ Right */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className={`p-3 rounded-2xl border text-center transition-all ${
                            currentStep === 'FRONT'
                                ? 'bg-red-600/15 border-red-500 text-white shadow-lg shadow-red-500/20'
                                : enrolledTemplates.front
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                : 'bg-white/5 border-white/5 text-slate-500'
                        }`}>
                            <span className="text-[9px] font-black uppercase tracking-widest block">Step 1</span>
                            <span className="text-xs sm:text-sm font-black uppercase italic tracking-tight">
                                {enrolledTemplates.front ? '✓ FRONT' : currentStep === 'FRONT' ? '● FRONT' : '○ FRONT'}
                            </span>
                        </div>

                        <div className={`p-3 rounded-2xl border text-center transition-all ${
                            currentStep === 'LEFT'
                                ? 'bg-red-600/15 border-red-500 text-white shadow-lg shadow-red-500/20'
                                : enrolledTemplates.left
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                : 'bg-white/5 border-white/5 text-slate-500'
                        }`}>
                            <span className="text-[9px] font-black uppercase tracking-widest block">Step 2</span>
                            <span className="text-xs sm:text-sm font-black uppercase italic tracking-tight">
                                {enrolledTemplates.left ? '✓ LEFT' : currentStep === 'LEFT' ? '● LEFT' : '○ LEFT'}
                            </span>
                        </div>

                        <div className={`p-3 rounded-2xl border text-center transition-all ${
                            currentStep === 'RIGHT'
                                ? 'bg-red-600/15 border-red-500 text-white shadow-lg shadow-red-500/20'
                                : enrolledTemplates.right
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                : 'bg-white/5 border-white/5 text-slate-500'
                        }`}>
                            <span className="text-[9px] font-black uppercase tracking-widest block">Step 3</span>
                            <span className="text-xs sm:text-sm font-black uppercase italic tracking-tight">
                                {enrolledTemplates.right ? '✓ RIGHT' : currentStep === 'RIGHT' ? '● RIGHT' : '○ RIGHT'}
                            </span>
                        </div>
                    </div>

                    {/* Camera Viewport with Oval HUD */}
                    <div className="relative aspect-[4/3] w-full max-w-md mx-auto rounded-[32px] overflow-hidden bg-black/80 border border-white/15 flex items-center justify-center shadow-inner">
                        {/* Video Element with callback ref for immediate stream attachment */}
                        <video
                            ref={setVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />

                        {/* Oval Face Guide Frame */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className={`w-48 h-64 sm:w-56 sm:h-72 rounded-[50%] border-2 transition-all duration-300 relative ${
                                multipleFaces 
                                    ? 'border-red-600 bg-red-600/15'
                                    : isAngleAligned && qualityOk
                                    ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.35)]'
                                    : faceStatus === 'WARNING'
                                    ? 'border-amber-400/80 border-dashed'
                                    : 'border-white/35 border-dashed'
                            }`}>
                                {/* Crosshair markers */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white/40" />
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white/40" />
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-white/40" />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-white/40" />
                            </div>
                        </div>

                        {/* Multiple Faces Warning Banner */}
                        {multipleFaces && (
                            <div className="absolute top-4 inset-x-4 z-30 bg-red-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl animate-pulse">
                                <ShieldAlert size={14} /> MULTIPLE FACES DETECTED — ONLY 1 PERSON VISIBLE
                            </div>
                        )}

                        {/* Quality / Alignment Banner */}
                        {!multipleFaces && faceStatus === 'WARNING' && (
                            <div className="absolute top-4 inset-x-4 z-30 bg-amber-500/90 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg">
                                <AlertCircle size={14} /> {qualityReason}
                            </div>
                        )}

                        {/* Direction Guidance Indicator */}
                        {currentStep === 'LEFT' && !isAngleAligned && (
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                                <span>← Turn Head Slightly to the Left</span>
                            </div>
                        )}
                        {currentStep === 'RIGHT' && !isAngleAligned && (
                            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                                <span>Turn Head Slightly to the Right →</span>
                            </div>
                        )}

                        {/* Ready Bounce Alert */}
                        {isAngleAligned && qualityOk && (
                            <div className="absolute bottom-16 inset-x-6 z-30 flex justify-center pointer-events-none">
                                <div className="px-4 py-2 bg-emerald-500 text-black rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xl animate-bounce">
                                    <CheckCircle2 size={16} /> Angle Aligned! Click Capture Below
                                </div>
                            </div>
                        )}

                        {/* Live Pose Angle Display */}
                        <div className="absolute bottom-4 left-4 z-20 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Head Pose</span>
                            <span className={`text-[10px] font-mono font-black ${
                                isAngleAligned ? 'text-emerald-400' : 'text-slate-300'
                            }`}>
                                {Math.abs(yawAngle)}° {yawAngle > 2 ? 'R' : yawAngle < -2 ? 'L' : 'Center'}
                            </span>
                        </div>

                        {/* Camera Switch Toggle (Mobile / Multi-camera) */}
                        {hasMultipleCameras && (
                            <button
                                type="button"
                                onClick={handleSwitchCamera}
                                className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/15 text-slate-300 hover:text-white transition-all"
                                title="Switch Camera"
                            >
                                <SwitchCamera size={16} />
                            </button>
                        )}
                    </div>

                    {/* Step Guidance Prompt */}
                    <div className="text-center space-y-2 max-w-md mx-auto">
                        <h4 className="text-sm font-black uppercase tracking-wide text-white font-poppins">
                            {currentStep === 'FRONT' && "FRONT FACE"}
                            {currentStep === 'LEFT' && (enrolledTemplates.front ? "✓ FRONT CAPTURED — NEXT: LEFT FACE" : "LEFT FACE")}
                            {currentStep === 'RIGHT' && (enrolledTemplates.left ? "✓ FRONT & LEFT CAPTURED — NEXT: RIGHT FACE" : "RIGHT FACE")}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            {currentStep === 'FRONT' && "Look directly at the camera. Keep your face inside the frame."}
                            {currentStep === 'LEFT' && "Turn your head slightly to the LEFT. Keep your face inside the frame."}
                            {currentStep === 'RIGHT' && "Turn your head slightly to the RIGHT. Keep your face inside the frame."}
                        </p>
                        <p className={`text-xs font-black uppercase tracking-widest transition-colors ${
                            faceStatus === 'ERROR' ? 'text-red-400' :
                            faceStatus === 'WARNING' ? 'text-amber-400' :
                            faceStatus === 'READY' ? 'text-emerald-400 animate-pulse' :
                            'text-slate-400'
                        }`}>
                            {statusMessage}
                        </p>
                    </div>

                    {/* Capture Trigger Button */}
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleCaptureStep}
                            disabled={!cameraActive || isCapturing || multipleFaces}
                            className={`w-full max-w-sm py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl transition-all ${
                                isCapturing
                                    ? 'bg-white/10 text-slate-400 cursor-wait'
                                    : multipleFaces || !cameraActive
                                    ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                                    : isAngleAligned && qualityOk
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 scale-100 active:scale-95 cursor-pointer ring-2 ring-emerald-400/50'
                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer'
                            }`}
                        >
                            {isCapturing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    EXTRACTING BIOMETRIC VECTOR...
                                </>
                            ) : (
                                <>
                                    <Camera size={16} />
                                    {currentStep === 'FRONT' && (isAngleAligned ? "✓ CAPTURE FRONT FACE (READY)" : "CAPTURE FRONT FACE")}
                                    {currentStep === 'LEFT' && (isAngleAligned ? "✓ CAPTURE LEFT PROFILE (READY)" : "CAPTURE LEFT PROFILE")}
                                    {currentStep === 'RIGHT' && (isAngleAligned ? "✓ CAPTURE RIGHT PROFILE (READY)" : "CAPTURE RIGHT PROFILE")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* STAGE 6: All 3 Views Captured — Create Facial Profile (Section 25 & 26) */}
            {uiStage === 'SAVE_READY' && (
                <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                    <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                        {saveSuccess ? <CheckCircle2 size={42} /> : <ShieldCheck size={42} />}
                    </div>

                    <div>
                        <h4 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                            {saveSuccess ? "✓ FACIAL PROFILE CREATED" : "ALL 3 VIEWS CAPTURED"}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                            {saveSuccess 
                                ? "Biometric vectors securely stored and linked to your user account. Proceeding to Step 2..."
                                : "Front, Left, and Right angles successfully validated. Create your protected biometric profile to complete Step 1."}
                        </p>
                    </div>

                    {/* Views Summary Card */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-sm mx-auto flex items-center justify-around text-center">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Front</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Left</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Right</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                    </div>

                    {/* Save Error Recovery Card */}
                    {saveError && (
                        <div className="p-4 bg-red-600/15 border border-red-500/40 rounded-2xl max-w-sm mx-auto text-center space-y-2">
                            <p className="text-xs text-red-400 font-bold">{saveError}</p>
                        </div>
                    )}

                    {/* Action Trigger */}
                    <div className="pt-2 flex justify-center">
                        <button
                            type="button"
                            onClick={handleSaveBiometricProfile}
                            disabled={isSaving || saveSuccess}
                            className={`w-full max-w-sm py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer ${
                                saveSuccess
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-95'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    CREATING SECURE FACIAL PROFILE...
                                </>
                            ) : saveSuccess ? (
                                <>
                                    <Check size={16} />
                                    ✓ FACIAL PROFILE CREATED
                                </>
                            ) : (
                                <>
                                    <Lock size={16} />
                                    {saveError ? "RETRY SAVING FACIAL PROFILE" : "CREATE FACIAL PROFILE"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Development Debug Mode HUD (Section 40) - Only in Dev */}
            {import.meta.env.DEV && (
                <div className="mt-6 pt-4 border-t border-white/10 text-left font-mono text-[10px] text-slate-400 space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <div className="font-bold text-slate-300 text-[11px] mb-1">=== BIOMETRIC DIAGNOSTICS (DEV ONLY) ===</div>
                    <div className="grid grid-cols-2 gap-x-4">
                        <div>Camera: <span className="text-emerald-400">{cameraActive ? 'READY' : 'OFF'}</span></div>
                        <div>Model: <span className="text-emerald-400">{modelReady ? 'LOADED' : 'PENDING'}</span></div>
                        <div>Face Detection: <span className="text-emerald-400">{cameraActive ? 'ACTIVE' : 'IDLE'}</span></div>
                        <div>Faces Detected: <span className="text-emerald-400">{multipleFaces ? '2+' : faceStatus === 'SEARCHING' ? '0' : '1'}</span></div>
                        <div>Quality: <span className={qualityOk ? 'text-emerald-400' : 'text-amber-400'}>{qualityOk ? 'PASS' : 'RECHECK'}</span></div>
                        <div>Orientation: <span className="text-emerald-400">{currentStep}</span> (yaw: {yawAngle}°)</div>
                        <div>Capture: <span className={isAngleAligned && qualityOk ? 'text-emerald-400' : 'text-slate-500'}>{isAngleAligned && qualityOk ? 'READY' : 'WAITING'}</span></div>
                        <div>Backend: <span className="text-emerald-400">CONNECTED</span></div>
                        <div>Enrollment: <span className={finalBiometricProfile ? 'text-emerald-400' : 'text-slate-500'}>{finalBiometricProfile ? 'SUCCESS' : 'PENDING'}</span></div>
                        <div>User ID: <span className="text-slate-300">{uid || 'GUEST'}</span></div>
                    </div>
                </div>
            )}
        </div>
    );
}
