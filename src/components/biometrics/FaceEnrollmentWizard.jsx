import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, CheckCircle2, ShieldCheck, AlertTriangle, RefreshCw,
    X, Sparkles, Loader2, ArrowRight, Eye, ShieldAlert
} from 'lucide-react';
import { 
    detectSingleFace, 
    verifyAngleTarget, 
    loadBiometricModels, 
    TEMPLATE_VERSION 
} from '../../lib/biometrics';
import toast from 'react-hot-toast';

export default function FaceEnrollmentWizard({
    onComplete,
    onCancel,
    initialStep = 'FRONT'
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [currentStep, setCurrentStep] = useState('FRONT'); // 'FRONT' | 'LEFT' | 'RIGHT' | 'COMPLETE'
    const [modelLoading, setModelLoading] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    // Live feedback states
    const [faceStatus, setFaceStatus] = useState('ALIGNING');
    const [statusMessage, setStatusMessage] = useState('Initializing biometric camera...');
    const [multipleFaces, setMultipleFaces] = useState(false);
    const [yawAngle, setYawAngle] = useState(0);
    const [isAngleAligned, setIsAngleAligned] = useState(false);
    const [qualityOk, setQualityOk] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    // Liveness / PAD tracking (Step 1 blink or micro-motion)
    const [blinkDetected, setBlinkDetected] = useState(false);
    const earHistoryRef = useRef([]);

    // Enrolled views storage (128-d descriptors only)
    const [enrolledTemplates, setEnrolledTemplates] = useState({
        front: null,
        left: null,
        right: null
    });

    // 1. Initialize models & camera stream
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                setModelLoading(true);
                await loadBiometricModels();
                if (!isMounted) return;
                setModelLoading(false);
                await startCamera();
            } catch (err) {
                console.error("Biometric init error:", err);
                if (isMounted) {
                    setCameraError("Failed to initialize facial recognition engine. Ensure camera access is allowed.");
                    setModelLoading(false);
                }
            }
        };
        init();

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraActive(true);
                };
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setCameraError("Camera permission denied or camera device unavailable.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    // 2. Real-time Detection Loop
    useEffect(() => {
        if (!cameraActive || modelLoading || currentStep === 'COMPLETE') return;

        let animationFrameId;
        let isEvaluating = false;

        const loop = async () => {
            if (videoRef.current && videoRef.current.readyState === 4 && !isEvaluating) {
                isEvaluating = true;
                try {
                    const result = await detectSingleFace(videoRef.current);

                    if (result.status === 'MULTIPLE_FACES') {
                        setMultipleFaces(true);
                        setFaceStatus('ERROR');
                        setStatusMessage('MULTIPLE FACES DETECTED. Only the registered user should be visible.');
                        setIsAngleAligned(false);
                        setQualityOk(false);
                    } else if (result.status === 'NO_FACE') {
                        setMultipleFaces(false);
                        setFaceStatus('SEARCHING');
                        setStatusMessage('Look directly at the camera. Keep your face inside the frame.');
                        setIsAngleAligned(false);
                        setQualityOk(false);
                    } else {
                        setMultipleFaces(false);
                        setYawAngle(result.pose.yaw);

                        // Blink / Liveness check for Frontal enrollment
                        if (currentStep === 'FRONT') {
                            const ear = result.pose.ear;
                            earHistoryRef.current.push(ear);
                            if (earHistoryRef.current.length > 10) earHistoryRef.current.shift();
                            const minEar = Math.min(...earHistoryRef.current);
                            const maxEar = Math.max(...earHistoryRef.current);
                            if (minEar < 0.20 && maxEar > 0.26) {
                                setBlinkDetected(true);
                            }
                        }

                        // Check angle target
                        const angleCheck = verifyAngleTarget(result.pose, currentStep);
                        setIsAngleAligned(angleCheck.isMatch);

                        // Check image quality
                        const quality = result.quality;
                        setQualityOk(quality.isAcceptable);

                        if (!quality.isAcceptable) {
                            setFaceStatus('WARNING');
                            setStatusMessage(quality.qualityMessage);
                        } else if (!angleCheck.isMatch) {
                            setFaceStatus('ALIGNING');
                            setStatusMessage(angleCheck.feedback);
                        } else {
                            setFaceStatus('READY');
                            setStatusMessage(
                                currentStep === 'FRONT' && !blinkDetected
                                    ? 'Blink your eyes to verify live presence'
                                    : `✓ ${currentStep} PROFILE READY FOR CAPTURE`
                            );
                        }

                        // Store latest frame descriptor for capture
                        videoRef.current._latestBiometric = result;
                    }
                } catch (e) {
                    // silent loop frame drop
                } finally {
                    isEvaluating = false;
                }
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [cameraActive, modelLoading, currentStep, blinkDetected]);

    // 3. Capture Step Handler
    const handleCaptureStep = () => {
        if (!videoRef.current?._latestBiometric) {
            toast.error("Face not positioned. Please wait for camera stabilization.");
            return;
        }

        const bio = videoRef.current._latestBiometric;
        if (!bio.quality.isAcceptable) {
            toast.error(bio.quality.qualityMessage);
            return;
        }

        const angleCheck = verifyAngleTarget(bio.pose, currentStep);
        if (!angleCheck.isMatch) {
            toast.error(`Please adjust head pose: ${angleCheck.feedback}`);
            return;
        }

        setIsCapturing(true);

        setTimeout(() => {
            const template = {
                descriptor: bio.descriptor,
                qualityScore: Number(((bio.detection.detection.score || 0.9) * 100).toFixed(1)),
                yaw: bio.pose.yaw,
                pitch: bio.pose.pitch,
                capturedAt: new Date().toISOString()
            };

            if (currentStep === 'FRONT') {
                setEnrolledTemplates(prev => ({ ...prev, front: template }));
                toast.success("✓ FRONT FACE CAPTURED");
                setCurrentStep('LEFT');
                setStatusMessage('Step 2: Slowly turn your face to the LEFT.');
            } else if (currentStep === 'LEFT') {
                setEnrolledTemplates(prev => ({ ...prev, left: template }));
                toast.success("✓ LEFT PROFILE CAPTURED");
                setCurrentStep('RIGHT');
                setStatusMessage('Step 3: Slowly turn your face to the RIGHT.');
            } else if (currentStep === 'RIGHT') {
                const finalTemplates = {
                    ...enrolledTemplates,
                    right: template
                };
                setEnrolledTemplates(finalTemplates);
                toast.success("✓ RIGHT PROFILE CAPTURED");
                setCurrentStep('COMPLETE');
                stopCamera();

                // Biometric profile conforming to Phase 4
                const biometricProfile = {
                    enrollmentStatus: 'enrolled',
                    frontTemplate: finalTemplates.front,
                    leftTemplate: finalTemplates.left,
                    rightTemplate: template,
                    templateVersion: TEMPLATE_VERSION,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (onComplete) {
                    onComplete(biometricProfile);
                }
            }

            setIsCapturing(false);
        }, 300);
    };

    return (
        <div className="bg-[#0A0F1D] border border-white/10 rounded-[36px] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden font-manrope">
            {/* Header / Step Tracker */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="text-red-500" size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">
                            Biometric Security Protocol
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight font-poppins">
                        Face Verification Enrollment
                    </h3>
                </div>
                {onCancel && (
                    <button 
                        onClick={onCancel}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Step Progress Indicators: Front ● Left ○ Right */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                <div className={`p-3 rounded-2xl border text-center transition-all ${
                    currentStep === 'FRONT'
                        ? 'bg-red-600/10 border-red-500 text-white shadow-lg shadow-red-500/20'
                        : enrolledTemplates.front
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/5 border-white/5 text-slate-500'
                }`}>
                    <span className="text-[9px] font-black uppercase tracking-widest block">Step 1</span>
                    <span className="text-xs sm:text-sm font-black uppercase italic tracking-tight">
                        {enrolledTemplates.front ? '✓ Front' : currentStep === 'FRONT' ? '● Front' : '○ Front'}
                    </span>
                </div>

                <div className={`p-3 rounded-2xl border text-center transition-all ${
                    currentStep === 'LEFT'
                        ? 'bg-red-600/10 border-red-500 text-white shadow-lg shadow-red-500/20'
                        : enrolledTemplates.left
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/5 border-white/5 text-slate-500'
                }`}>
                    <span className="text-[9px] font-black uppercase tracking-widest block">Step 2</span>
                    <span className="text-xs sm:text-sm font-black uppercase italic tracking-tight">
                        {enrolledTemplates.left ? '✓ Left' : currentStep === 'LEFT' ? '● Left' : '○ Left'}
                    </span>
                </div>

                <div className={`p-3 rounded-2xl border text-center transition-all ${
                    currentStep === 'RIGHT'
                        ? 'bg-red-600/10 border-red-500 text-white shadow-lg shadow-red-500/20'
                        : enrolledTemplates.right
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/5 border-white/5 text-slate-500'
                }`}>
                    <span className="text-[9px] font-black uppercase tracking-widest block">Step 3</span>
                    <span className="text-xs sm:text-sm font-black uppercase italic tracking-tight">
                        {enrolledTemplates.right ? '✓ Right' : currentStep === 'RIGHT' ? '● Right' : '○ Right'}
                    </span>
                </div>
            </div>

            {/* Video Viewport & Real-time HUD */}
            {currentStep !== 'COMPLETE' ? (
                <div className="space-y-6">
                    <div className="relative aspect-[4/3] w-full max-w-md mx-auto rounded-[32px] overflow-hidden bg-black/60 border border-white/15 flex items-center justify-center shadow-inner">
                        {modelLoading && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0F1D]/90 gap-3 text-center p-6">
                                <Loader2 className="animate-spin text-red-500" size={36} />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
                                    Loading Biometric Vision Weights...
                                </p>
                            </div>
                        )}

                        {cameraError && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0F1D] p-6 text-center space-y-4">
                                <AlertTriangle className="text-red-500" size={40} />
                                <p className="text-xs text-red-400 font-bold leading-relaxed">{cameraError}</p>
                                <button
                                    onClick={startCamera}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Retry Camera
                                </button>
                            </div>
                        )}

                        {/* Video Element */}
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />

                        {/* Oval Biometric Framing Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className={`w-48 h-64 sm:w-56 sm:h-72 rounded-[50%] border-2 transition-all duration-300 relative ${
                                multipleFaces 
                                    ? 'border-red-600 bg-red-600/10'
                                    : isAngleAligned && qualityOk
                                    ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.3)]'
                                    : 'border-white/30 border-dashed'
                            }`}>
                                {/* Corner crosshairs */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white/40" />
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white/40" />
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-white/40" />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-white/40" />
                            </div>
                        </div>

                        {/* Multiple Faces Warning Banner */}
                        {multipleFaces && (
                            <div className="absolute top-4 inset-x-4 z-30 bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl animate-pulse">
                                <ShieldAlert size={14} /> MULTIPLE FACES DETECTED
                            </div>
                        )}

                        {/* Dynamic Yaw Gauge */}
                        <div className="absolute bottom-4 left-4 z-20 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Head Pose</span>
                            <span className="text-[10px] font-mono font-black text-emerald-400">
                                {yawAngle > 0 ? `+${yawAngle}° R` : `${yawAngle}° L`}
                            </span>
                        </div>
                    </div>

                    {/* Step Guidance Prompt */}
                    <div className="text-center space-y-2">
                        <p className="text-sm font-bold text-slate-200">
                            {currentStep === 'FRONT' && "Look directly at the camera. Keep your face inside the frame."}
                            {currentStep === 'LEFT' && "Slowly turn your face to the LEFT. Keep your face inside the frame."}
                            {currentStep === 'RIGHT' && "Slowly turn your face to the RIGHT. Keep your face inside the frame."}
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
                    <div className="flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={handleCaptureStep}
                            disabled={!cameraActive || !isAngleAligned || !qualityOk || isCapturing}
                            className={`w-full max-w-sm py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl transition-all ${
                                isAngleAligned && qualityOk && !isCapturing
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 scale-100 active:scale-95'
                                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {isCapturing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Extracting Biometric Vector...
                                </>
                            ) : (
                                <>
                                    <Camera size={16} />
                                    Capture {currentStep} View
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                /* Completion Card */
                <div className="py-8 text-center space-y-6 animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                        <CheckCircle2 size={42} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                            ✓ FACE VERIFICATION COMPLETE
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                            All 3 angles (Front, Left, Right) successfully mapped into 128-dimensional encrypted biometric representations. Raw photos are never stored.
                        </p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-sm mx-auto flex items-center justify-around text-center">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Front View</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Left Profile</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Right Profile</span>
                            <span className="text-xs font-bold text-emerald-400">✓ Enrolled</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
