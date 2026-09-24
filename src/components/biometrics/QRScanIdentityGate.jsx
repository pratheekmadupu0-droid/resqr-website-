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

    // Gate stages: 'PROMPT' | 'CAMERA' | 'VERIFYING' | 'MATCH' | 'NO_MATCH' | 'LOCKED' | 'ERROR'
    const [gateStage, setGateStage] = useState('PROMPT');
    const [cameraActive, setCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // Default to rear camera to scan victim, switchable
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    // Detection feedback
    const [detectionStatus, setDetectionStatus] = useState('SEARCHING'); // 'SEARCHING' | 'READY' | 'MULTIPLE' | 'WARNING'
    const [statusMessage, setStatusMessage] = useState('Position face clearly inside frame.');
    const [isQualityOk, setIsQualityOk] = useState(false);
    const [faceCount, setFaceCount] = useState(0);

    // Rate limiting (max 3 attempts)
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 3;

    // Check multiple cameras on mount
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

    // Open camera
    const handleOpenCamera = async () => {
        stopCamera();
        setCameraError(null);
        setDetectionStatus('SEARCHING');
        setStatusMessage('Starting camera & AI vision models...');

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
                    facingMode: facingMode ? { ideal: facingMode } : 'environment'
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

    // Real-time Detection Loop
    useEffect(() => {
        if (gateStage !== 'CAMERA' || !cameraActive) return;

        let animId;
        let isEvaluating = false;
        let lastTime = 0;

        const loop = async (timestamp) => {
            const video = videoRef.current;
            if (video && video.readyState >= 2 && video.videoWidth > 0 && !isEvaluating && (timestamp - lastTime > 100)) {
                isEvaluating = true;
                lastTime = timestamp;

                try {
                    const result = await detectSingleFace(video, { extractDescriptor: false });

                    if (result.status === 'NO_FACE') {
                        setFaceCount(0);
                        setDetectionStatus('SEARCHING');
                        setStatusMessage('NO FACE DETECTED. Position the person\'s face inside the frame.');
                        setIsQualityOk(false);
                    } else if (result.status === 'MULTIPLE_FACES') {
                        setFaceCount(result.faceCount || 2);
                        setDetectionStatus('MULTIPLE');
                        setStatusMessage('MULTIPLE FACES DETECTED. Make sure only the person associated with this RESQR is visible.');
                        setIsQualityOk(false);
                    } else if (result.status === 'FACE_DETECTED') {
                        setFaceCount(1);
                        video._latestProbe = result;
                        padAnalyzerRef.current.addSample(result.detection, result.quality);

                        if (!result.quality.isAcceptable) {
                            setDetectionStatus('WARNING');
                            setStatusMessage(result.quality.qualityMessage);
                            setIsQualityOk(false);
                        } else {
                            setDetectionStatus('READY');
                            setStatusMessage('✓ Face positioned clearly. Ready to capture.');
                            setIsQualityOk(true);
                        }
                    }
                } catch (e) {
                    // Loop exception fallback
                } finally {
                    isEvaluating = false;
                }
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [gateStage, cameraActive]);

    // Handle Capture & Biometric 1:1 Match
    const handleCaptureVerification = async () => {
        const video = videoRef.current;
        if (!video) return;

        setGateStage('VERIFYING');

        try {
            // Snapshot dedicated frame canvas for isolated descriptor extraction
            const snapCanvas = document.createElement('canvas');
            const vW = video.videoWidth || 640;
            const vH = video.videoHeight || 480;
            snapCanvas.width = vW;
            snapCanvas.height = vH;
            const sCtx = snapCanvas.getContext('2d', { willReadFrequently: true });
            sCtx.drawImage(video, 0, 0, vW, vH);

            // Extract high-resolution probe descriptor directly from snapshot
            let probe = null;
            try {
                probe = await detectSingleFace(snapCanvas, { extractDescriptor: true });
            } catch (e) {
                console.warn("Probe extraction warning:", e);
            }

            if (!probe || probe.status !== 'FACE_DETECTED' || !probe.descriptor || probe.descriptor.length !== 128 || isPseudoEmbedding(probe.descriptor)) {
                setGateStage('CAMERA');
                toast.error(probe?.message || "Could not extract facial features. Please ensure your face is clearly visible inside the oval frame.");
                return;
            }

            // Quality gate check
            if (!probe.quality?.isAcceptable) {
                setGateStage('CAMERA');
                toast.error(probe.quality?.qualityMessage || "Face not clear. Please improve lighting and hold steady.");
                return;
            }

            const probeDescriptor = probe.descriptor;

            // Passive Presentation Attack Detection (PAD)
            const padResult = padAnalyzerRef.current.evaluatePassiveLiveness();
            const padScore = padResult.score || 0.8;

            // 1:1 Biometric Verification against enrolled profile
            const verifyResult = await verifyPublicEmergencyAccess({
                probeDescriptor,
                patientId,
                qrId: qrId || patientId,
                padScore
            });

            if (verifyResult.verified && verifyResult.verificationToken) {
                stopCamera();
                setGateStage('MATCH');

                // After brief confirmation animation, advance to Emergency Profile
                setTimeout(() => {
                    if (onVerificationSuccess) {
                        onVerificationSuccess({
                            token: verifyResult.verificationToken,
                            expiresAt: verifyResult.expiresAt
                        });
                    }
                }, 1000);
            } else {
                stopCamera();
                const nextAttempts = attempts + 1;
                setAttempts(nextAttempts);

                if (nextAttempts >= maxAttempts) {
                    setGateStage('LOCKED');
                } else {
                    setGateStage('NO_MATCH');
                }
            }
        } catch (err) {
            console.error("Verification error:", err);
            stopCamera();
            setGateStage('NO_MATCH');
        }
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
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        1:1 IDENTITY MATCH
                    </span>
                </div>

                {/* SCREEN 1: First Screen After QR Scan */}
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
                                For security, please take a photo of the person associated with this RESQR.
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                                Position their face clearly inside the frame.
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

                {/* SCREEN 2: Live Camera View & Verification */}
                {gateStage === 'CAMERA' && (
                    <div className="space-y-6 pt-4 animate-in fade-in duration-300">
                        <div className="text-center space-y-1">
                            <h4 className="text-lg font-black uppercase italic tracking-tight text-white font-poppins">
                                IDENTITY VERIFICATION
                            </h4>
                            <p className="text-xs text-slate-400 font-medium">
                                Position face clearly
                            </p>
                        </div>

                        {/* Viewport Frame with Oval Face Guide */}
                        <div className="relative aspect-[4/3] w-full max-w-md mx-auto rounded-[32px] overflow-hidden bg-black border border-white/15 flex items-center justify-center shadow-inner">
                            <video
                                ref={setVideoNode}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                            />

                            {/* Oval Face Guide Area */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className={`w-48 h-64 sm:w-52 sm:h-68 rounded-[50%] border-2 transition-all duration-300 relative ${
                                    detectionStatus === 'MULTIPLE'
                                        ? 'border-red-600 bg-red-600/15'
                                        : isQualityOk && detectionStatus === 'READY'
                                        ? 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.35)]'
                                        : detectionStatus === 'WARNING'
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
                            {detectionStatus === 'MULTIPLE' && (
                                <div className="absolute top-4 inset-x-4 z-30 bg-red-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl animate-pulse">
                                    <ShieldAlert size={14} /> MULTIPLE FACES DETECTED — ONLY 1 PERSON VISIBLE
                                </div>
                            )}

                            {/* Quality Warning Banner */}
                            {detectionStatus === 'WARNING' && (
                                <div className="absolute top-4 inset-x-4 z-30 bg-amber-500/90 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg">
                                    <AlertCircle size={14} /> {statusMessage}
                                </div>
                            )}

                            {/* Ready Glow Alert */}
                            {isQualityOk && detectionStatus === 'READY' && (
                                <div className="absolute bottom-4 inset-x-6 z-30 flex justify-center pointer-events-none">
                                    <div className="px-4 py-1.5 bg-emerald-500 text-black rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xl">
                                        <CheckCircle2 size={14} /> Face Centered — Click Capture
                                    </div>
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

                        {/* Status Message Text */}
                        <div className="text-center">
                            <p className={`text-xs font-black uppercase tracking-widest transition-colors ${
                                detectionStatus === 'MULTIPLE' ? 'text-red-400' :
                                detectionStatus === 'WARNING' ? 'text-amber-400' :
                                detectionStatus === 'READY' ? 'text-emerald-400' :
                                'text-slate-400'
                            }`}>
                                {statusMessage}
                            </p>
                        </div>

                        {/* CAPTURE BUTTON */}
                        <div className="flex items-center justify-center">
                            <button
                                type="button"
                                onClick={handleCaptureVerification}
                                disabled={!cameraActive || detectionStatus === 'MULTIPLE' || faceCount === 0}
                                className={`w-full max-w-sm py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer ${
                                    !cameraActive || detectionStatus === 'MULTIPLE' || faceCount === 0
                                        ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                                        : isQualityOk && detectionStatus === 'READY'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 active:scale-95 ring-2 ring-emerald-400/50'
                                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-95'
                                }`}
                            >
                                <Camera size={16} />
                                {isQualityOk && detectionStatus === 'READY' ? "✓ CAPTURE (READY)" : "CAPTURE"}
                            </button>
                        </div>
                    </div>
                )}

                {/* SCREEN 3: Verifying In Progress */}
                {gateStage === 'VERIFYING' && (
                    <div className="py-12 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-red-600/10 border-2 border-red-500/30 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/20">
                            <Loader2 size={38} className="animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                VERIFYING IDENTITY...
                            </h4>
                            <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                Analyzing image quality, anti-spoofing vectors, and comparing with registered facial identity...
                            </p>
                        </div>
                    </div>
                )}

                {/* SCREEN 4: SUCCESS MATCH */}
                {gateStage === 'MATCH' && (
                    <div className="py-12 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-bounce">
                            <CheckCircle2 size={42} />
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest block">
                                ✓ IDENTITY VERIFIED
                            </span>
                            <h4 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                                RESQR IDENTITY CONFIRMED
                            </h4>
                            <p className="text-xs text-slate-300 max-w-xs mx-auto">
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
                                IDENTITY COULD NOT BE VERIFIED
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto font-medium">
                                The captured person could not be sufficiently matched with the RESQR identity.
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto">
                                The protected profile will not be opened.
                            </p>
                            <span className="text-[10px] font-mono text-slate-500 block pt-1">
                                Attempt {attempts} of {maxAttempts}
                            </span>
                        </div>

                        <div className="pt-2 flex justify-center">
                            <button
                                type="button"
                                onClick={handleOpenCamera}
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
                                Maximum verification attempts reached. Please use the authorized alternate verification process.
                            </p>
                            <p className="text-[11px] text-slate-400">
                                Protected RESQR profile unavailable.
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

                {/* EMERGENCY FALLBACK ACTION LAYER (Section 18 & 39) */}
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
