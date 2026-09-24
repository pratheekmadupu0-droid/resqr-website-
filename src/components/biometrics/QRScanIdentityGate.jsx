import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, 
    Phone, Siren, CheckCircle2, XCircle, Loader2, SwitchCamera, 
    Lock, Sparkles, Navigation, AlertCircle
} from 'lucide-react';
import { 
    detectSingleFace, 
    loadBiometricModels, 
    PassivePADAnalyzer,
    isPseudoEmbedding
} from '../../lib/biometrics';
import { 
    verifyPublicEmergencyAccess,
    validatePublicEmergencySession
} from '../../lib/medicalApi';
import toast from 'react-hot-toast';

export default function QRScanIdentityGate({
    patientId,
    qrId,
    onVerificationSuccess
}) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const padAnalyzerRef = useRef(new PassivePADAnalyzer());

    // Gate stages: 'PROMPT' | 'CAMERA' | 'ANALYZING' | 'MATCH' | 'NO_MATCH' | 'LOCKED' | 'ERROR'
    const [gateStage, setGateStage] = useState('PROMPT');
    const [cameraActive, setCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState('user'); // Default to front camera as specified
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    // Single captured still photograph state
    const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
    const [analyzingSubtext, setAnalyzingSubtext] = useState('Analyzing captured image...');

    // Simple camera positioning guidance (NOT verification)
    const [positionStatus, setPositionStatus] = useState('SEARCHING'); // 'SEARCHING' | 'POSITIONED' | 'MULTIPLE' | 'WARNING'
    const [guidanceMessage, setGuidanceMessage] = useState('Position face clearly inside frame.');
    const [faceCount, setFaceCount] = useState(0);

    // Rate limiting (max 3 attempts)
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 3;

    // Check for multiple camera devices on mount
    useEffect(() => {
        if (navigator.mediaDevices?.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                if (videoInputs.length > 1) {
                    setHasMultipleCameras(true);
                }
            }).catch(() => {});
        }
    }, []);

    // Stop camera stream safely
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => {
                try {
                    t.stop();
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

    // Ensure camera is stopped on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // Open camera for face framing
    const handleOpenCamera = async () => {
        stopCamera();
        setCameraError(null);
        setPositionStatus('SEARCHING');
        setGuidanceMessage('Starting camera & AI vision models...');
        setCapturedPhotoUrl(null);

        try {
            await loadBiometricModels();
        } catch (err) {
            console.error("Biometric model load failed:", err);
            setCameraError("AI verification models could not load. Please check network.");
            setGateStage('ERROR');
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
            setGateStage('CAMERA');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current.play();
                    } catch (e) {}
                    setCameraActive(true);
                };
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setCameraError("Could not access camera. Please allow camera permissions to verify identity.");
            setGateStage('ERROR');
        }
    };

    // Toggle camera (Front / Back)
    const handleSwitchCamera = () => {
        const nextMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(nextMode);
        stopCamera();
        setTimeout(() => {
            handleOpenCamera();
        }, 150);
    };

    // Callback ref for <video> element
    const setVideoNode = useCallback((node) => {
        videoRef.current = node;
        if (node && streamRef.current) {
            node.srcObject = streamRef.current;
            node.onloadedmetadata = async () => {
                try {
                    await node.play();
                } catch (e) {}
                setCameraActive(true);
            };
        }
    }, []);

    // Real-time Positioning Guidance Loop (ONLY positioning guidance — NEVER verifies)
    useEffect(() => {
        if (gateStage !== 'CAMERA' || !cameraActive) return;

        let animId;
        let isEvaluating = false;
        let lastTime = 0;

        const loop = async (timestamp) => {
            const video = videoRef.current;
            if (video && video.readyState >= 2 && video.videoWidth > 0 && !isEvaluating && (timestamp - lastTime > 120)) {
                isEvaluating = true;
                lastTime = timestamp;

                try {
                    // Extract face positioning and quality only (NO descriptor extraction, NO verification)
                    const result = await detectSingleFace(video, { extractDescriptor: false });

                    if (result.status === 'NO_FACE') {
                        setFaceCount(0);
                        setPositionStatus('SEARCHING');
                        setGuidanceMessage('Position face inside frame');
                    } else if (result.status === 'MULTIPLE_FACES') {
                        setFaceCount(result.faceCount || 2);
                        setPositionStatus('MULTIPLE');
                        setGuidanceMessage('Multiple faces detected — ensure only 1 person in frame');
                    } else if (result.status === 'FACE_DETECTED') {
                        setFaceCount(1);
                        padAnalyzerRef.current.addSample(result.detection, result.quality);

                        const yaw = Math.abs(result.pose?.yaw || 0);
                        if (!result.quality?.isAcceptable) {
                            setPositionStatus('WARNING');
                            setGuidanceMessage(result.quality.isTooDark ? 'Improve lighting' : 'Hold steady inside frame');
                        } else if (yaw > 20) {
                            setPositionStatus('WARNING');
                            setGuidanceMessage('Look directly at the camera');
                        } else {
                            setPositionStatus('POSITIONED');
                            setGuidanceMessage('Face positioned inside frame');
                        }
                    }
                } catch (e) {
                    // Ignore dropped frame
                } finally {
                    isEvaluating = false;
                }
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [gateStage, cameraActive]);

    // Handle single still photograph capture & verification analysis
    const handleCapturePhoto = async () => {
        const video = videoRef.current;
        if (!video || !cameraActive) return;

        // STEP 3 — CAPTURE STILL IMAGE (exactly one photograph)
        const vW = video.videoWidth || 640;
        const vH = video.videoHeight || 480;
        const snapCanvas = document.createElement('canvas');
        snapCanvas.width = vW;
        snapCanvas.height = vH;
        const sCtx = snapCanvas.getContext('2d', { willReadFrequently: true });

        // Mirror front selfie camera snapshot to match user's perspective
        if (facingMode === 'user') {
            sCtx.translate(vW, 0);
            sCtx.scale(-1, 1);
        }
        sCtx.drawImage(video, 0, 0, vW, vH);
        const photoDataUrl = snapCanvas.toDataURL('image/jpeg', 0.92);
        setCapturedPhotoUrl(photoDataUrl);

        // Immediately stop live camera stream
        stopCamera();

        // STEP 4 — TRANSITION TO STILL IMAGE ANALYSIS
        setGateStage('ANALYZING');
        setAnalyzingSubtext('Analyzing captured image...');

        try {
            // Optical sensor variance check
            const padResult = padAnalyzerRef.current.evaluatePassiveLiveness();
            const padScore = padResult.score || 0.8;

            // Analyze the frozen still photograph canvas
            setAnalyzingSubtext('Detecting facial presence & orientation...');
            const probe = await detectSingleFace(snapCanvas, { extractDescriptor: true });

            // Check 1: Is a face present in the still photo?
            if (!probe || probe.status === 'NO_FACE') {
                handleFailure();
                return;
            }

            // Check 2: Exactly ONE face in the still photo?
            if (probe.status === 'MULTIPLE_FACES' || (probe.faceCount && probe.faceCount > 1)) {
                handleFailure();
                return;
            }

            // Check 3: Image quality, lighting, and blur
            if (!probe.quality?.isAcceptable) {
                handleFailure();
                return;
            }

            // Check 4: Face orientation (must not be turned away)
            if (probe.pose && Math.abs(probe.pose.yaw) > 25) {
                handleFailure();
                return;
            }

            // Check 5: Neural metric descriptor extraction (Float32Array of 128 elements)
            const probeDescriptor = probe.descriptor;
            if (!probeDescriptor || probeDescriptor.length !== 128 || isPseudoEmbedding(probeDescriptor)) {
                handleFailure();
                return;
            }

            // STEP 5 — QR-BOUND 1:1 FACE MATCH
            // Compares ONLY against the registered biometric profile belonging to THIS specific QR owner
            setAnalyzingSubtext('Verifying with registered RESQR biometric enrollment...');
            const verifyResult = await verifyPublicEmergencyAccess({
                probeDescriptor,
                patientId,
                qrId: qrId || patientId,
                padScore
            });

            // STEP 6 — SUCCESS
            if (verifyResult.verified && verifyResult.verificationToken) {
                setGateStage('MATCH');

                // Advance to Emergency Profile after brief verification confirmation
                setTimeout(() => {
                    if (onVerificationSuccess) {
                        onVerificationSuccess({
                            token: verifyResult.verificationToken,
                            expiresAt: verifyResult.expiresAt
                        });
                    }
                }, 1200);
            } else {
                // STEP 7 — FAILURE
                handleFailure();
            }
        } catch (err) {
            console.error("Still image analysis exception:", err);
            handleFailure();
        }
    };

    // Helper for failure handling (does NOT reveal match score or private details)
    const handleFailure = () => {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= maxAttempts) {
            setGateStage('LOCKED');
        } else {
            setGateStage('NO_MATCH');
        }
    };

    // Retry verification: clears captured photo and re-opens camera
    const handleTryAgain = () => {
        setCapturedPhotoUrl(null);
        handleOpenCamera();
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0A0F1D] border border-white/10 rounded-[36px] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden font-manrope">
                
                {/* Protocol Header Badge */}
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/20">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block font-mono">
                                SECURITY PROTOCOL
                            </span>
                            <span className="text-xs font-black tracking-tight text-white uppercase">
                                BIOMETRIC VERIFICATION GATE
                            </span>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-sky-500/10 border border-sky-500/30 text-sky-400">
                        1:1 QR VERIFICATION
                    </span>
                </div>

                {/* SCREEN 1: Initial Prompt */}
                {gateStage === 'PROMPT' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-red-600/10 border-2 border-red-500/30 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/20">
                            <Camera size={38} />
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-mono font-black text-red-500 uppercase tracking-widest block">
                                RESQR
                            </span>
                            <h3 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                                IDENTITY VERIFICATION
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto font-medium pt-1">
                                Position your face clearly inside the frame.
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                                The camera will capture a single still photo to verify against the registered RESQR identity.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={handleOpenCamera}
                                className="w-full max-w-sm py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
                            >
                                <Camera size={16} />
                                OPEN CAMERA
                            </button>
                        </div>
                    </div>
                )}

                {/* SCREEN 2: Live Camera View (Purely for Framing — NEVER Verifies) */}
                {gateStage === 'CAMERA' && (
                    <div className="space-y-6 pt-4 animate-in fade-in duration-300">
                        <div className="text-center space-y-1">
                            <h4 className="text-lg font-black uppercase italic tracking-tight text-white font-poppins">
                                IDENTITY VERIFICATION
                            </h4>
                            <p className="text-xs text-slate-400 font-medium">
                                Position your face clearly inside the frame.
                            </p>
                        </div>

                        {/* Viewport Frame with Neutral Positioning Guide */}
                        <div className="relative aspect-[4/3] w-full max-w-md mx-auto rounded-[32px] overflow-hidden bg-black border border-white/15 flex items-center justify-center shadow-inner">
                            <video
                                ref={setVideoNode}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                            />

                            {/* Oval Face Positioning Guide (Neutral styling — NOT verification) */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className={`w-48 h-64 sm:w-52 sm:h-68 rounded-[50%] border-2 transition-all duration-300 relative ${
                                    positionStatus === 'MULTIPLE'
                                        ? 'border-red-600 bg-red-600/10'
                                        : positionStatus === 'POSITIONED'
                                        ? 'border-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.2)]'
                                        : positionStatus === 'WARNING'
                                        ? 'border-amber-400/80 border-dashed'
                                        : 'border-white/35 border-dashed'
                                }`}>
                                    {/* Crosshair positioning markers */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white/40" />
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white/40" />
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-white/40" />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-white/40" />
                                </div>
                            </div>

                            {/* Multiple Faces Warning Banner */}
                            {positionStatus === 'MULTIPLE' && (
                                <div className="absolute top-4 inset-x-4 z-30 bg-red-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl animate-pulse">
                                    <ShieldAlert size={14} /> MULTIPLE FACES DETECTED — ONLY 1 PERSON VISIBLE
                                </div>
                            )}

                            {/* Quality Warning Banner */}
                            {positionStatus === 'WARNING' && (
                                <div className="absolute top-4 inset-x-4 z-30 bg-amber-500/90 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg">
                                    <AlertCircle size={14} /> {guidanceMessage}
                                </div>
                            )}

                            {/* Camera Switch Toggle */}
                            {hasMultipleCameras && (
                                <button
                                    type="button"
                                    onClick={handleSwitchCamera}
                                    className="absolute bottom-3 right-3 z-30 p-2.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-slate-300 hover:text-white transition-all shadow-lg"
                                    title="Switch Camera"
                                >
                                    <SwitchCamera size={16} />
                                </button>
                            )}
                        </div>

                        {/* Positioning Guidance Text (Neutral colors — never green verification) */}
                        <div className="text-center">
                            <p className={`text-xs font-black uppercase tracking-widest transition-colors ${
                                positionStatus === 'MULTIPLE' ? 'text-red-400' :
                                positionStatus === 'WARNING' ? 'text-amber-400' :
                                positionStatus === 'POSITIONED' ? 'text-sky-400' :
                                'text-slate-400'
                            }`}>
                                {guidanceMessage}
                            </p>
                        </div>

                        {/* CAPTURE PHOTO BUTTON */}
                        <div className="flex items-center justify-center">
                            <button
                                type="button"
                                onClick={handleCapturePhoto}
                                disabled={!cameraActive || positionStatus === 'MULTIPLE' || faceCount === 0}
                                className={`w-full max-w-sm py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer ${
                                    !cameraActive || positionStatus === 'MULTIPLE' || faceCount === 0
                                        ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-95'
                                }`}
                            >
                                <Camera size={16} />
                                CAPTURE PHOTO
                            </button>
                        </div>
                    </div>
                )}

                {/* SCREEN 3: Analyzing Still Image */}
                {gateStage === 'ANALYZING' && (
                    <div className="space-y-6 pt-4 text-center animate-in fade-in duration-300">
                        {/* Display Frozen Captured Photo */}
                        {capturedPhotoUrl && (
                            <div className="relative aspect-[4/3] w-full max-w-md mx-auto rounded-[32px] overflow-hidden bg-black border border-white/15 shadow-2xl">
                                <img
                                    src={capturedPhotoUrl}
                                    alt="Captured Identity Probe"
                                    className="w-full h-full object-cover"
                                />
                                {/* Laser Scan Animation Overlay */}
                                <div className="absolute inset-0 bg-red-600/10 pointer-events-none" />
                                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                            </div>
                        )}

                        <div className="py-4 space-y-3">
                            <div className="w-12 h-12 bg-red-600/10 border-2 border-red-500/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                    ANALYZING IDENTITY...
                                </h4>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    {analyzingSubtext}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* SCREEN 4: SUCCESS MATCH */}
                {gateStage === 'MATCH' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-bounce">
                            <CheckCircle2 size={42} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black uppercase italic tracking-tight text-emerald-400 font-poppins">
                                ✓ IDENTITY VERIFIED
                            </h4>
                            <p className="text-xs text-slate-300 max-w-xs mx-auto font-medium">
                                Identity successfully verified.
                            </p>
                            <p className="text-[11px] text-slate-500 pt-2 font-mono">
                                Opening emergency profile...
                            </p>
                        </div>
                    </div>
                )}

                {/* SCREEN 5: NO MATCH */}
                {gateStage === 'NO_MATCH' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-red-600/15 border-2 border-red-500/40 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/30">
                            <XCircle size={42} />
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-red-400 font-poppins">
                                IDENTITY NOT VERIFIED
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto font-medium">
                                The captured person does not match the registered RESQR user.
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto">
                                Access to the Emergency Profile remains locked.
                            </p>
                            <span className="text-[10px] font-mono text-slate-500 block pt-1">
                                Attempt {attempts} of {maxAttempts}
                            </span>
                        </div>

                        <div className="pt-2 flex justify-center">
                            <button
                                type="button"
                                onClick={handleTryAgain}
                                className="w-full max-w-sm py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
                            >
                                <RefreshCw size={14} />
                                TRY AGAIN
                            </button>
                        </div>
                    </div>
                )}

                {/* SCREEN 6: TEMPORARILY LOCKED AFTER 3 FAILURES */}
                {gateStage === 'LOCKED' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-amber-500/15 border-2 border-amber-500/40 text-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30">
                            <Lock size={42} />
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-lg font-black uppercase italic tracking-tight text-amber-400 font-poppins">
                                IDENTITY VERIFICATION TEMPORARILY LOCKED
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                                Maximum verification attempts reached. Direct emergency profile access is restricted.
                            </p>
                            <p className="text-[11px] text-slate-400">
                                Protected RESQR emergency profile remains unavailable.
                            </p>
                        </div>
                    </div>
                )}

                {/* ERROR STATE */}
                {gateStage === 'ERROR' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-red-600/15 border-2 border-red-500/40 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                            <AlertTriangle size={38} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-lg font-black uppercase italic tracking-tight text-white font-poppins">
                                VERIFICATION UNAVAILABLE
                            </h4>
                            <p className="text-xs text-red-400 max-w-xs mx-auto">
                                {cameraError || "An error occurred starting biometric verification."}
                            </p>
                        </div>
                        <div className="pt-2 flex justify-center">
                            <button
                                type="button"
                                onClick={handleOpenCamera}
                                className="w-full max-w-sm py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <RefreshCw size={14} />
                                RETRY CAMERA
                            </button>
                        </div>
                    </div>
                )}

                {/* EMERGENCY FALLBACK ACTION LAYER */}
                {/* Always available in failure, lock, or error states so identity verification NEVER blocks calling 108/100 */}
                {(gateStage === 'NO_MATCH' || gateStage === 'LOCKED' || gateStage === 'ERROR' || gateStage === 'PROMPT') && (
                    <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                        <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block font-mono">
                                EMERGENCY ASSISTANCE (HOTLINES ACTIVE)
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href="tel:108"
                                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all"
                            >
                                <Siren size={15} />
                                CALL 108
                            </a>

                            <a
                                href="tel:100"
                                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                            >
                                <Phone size={15} />
                                CALL 100
                            </a>
                        </div>
                    </div>
                )}

                {/* Footer security badge */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>1:1 BIOMETRIC GATE</span>
                    <span>PRIVACY-PRESERVED</span>
                </div>
            </div>
        </div>
    );
}
