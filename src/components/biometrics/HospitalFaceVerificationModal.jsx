import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, Shield, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, 
    RefreshCw, X, Stethoscope, Lock, Unlock, Eye, Sparkles, Loader2, Clock, UserCheck
} from 'lucide-react';
import { 
    detectSingleFace, 
    matchAgainstEnrolledTemplates, 
    PassivePADAnalyzer, 
    loadBiometricModels, 
    BIOMETRIC_MATCH_THRESHOLD 
} from '../../lib/biometrics';
import { verifyFaceOnServer, logMedicalAccessAudit } from '../../lib/medicalApi';
import toast from 'react-hot-toast';

export default function HospitalFaceVerificationModal({
    isOpen,
    onClose,
    patientName,
    patientId,
    qrId,
    biometricProfile,
    doctorInfo = {},
    onVerificationSuccess,
    onAlternateOverride
}) {
    if (!isOpen) return null;

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const padAnalyzerRef = useRef(new PassivePADAnalyzer());

    // Steps: 'CAMERA' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'INCONCLUSIVE' | 'COOLDOWN'
    const [step, setStep] = useState('CAMERA');
    const [modelLoading, setModelLoading] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    // Modes
    const [isUnconsciousMode, setIsUnconsciousMode] = useState(false);

    // Feedback
    const [statusMessage, setStatusMessage] = useState('Align patient face inside frame...');
    const [qualityWarning, setQualityWarning] = useState(null);
    const [multipleFaces, setMultipleFaces] = useState(false);
    const [matchDetails, setMatchDetails] = useState(null);

    // Rate limiting / Cooldown
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    // 1. Initialize
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
                console.error("Biometric init failed:", err);
                if (isMounted) {
                    setCameraError("Biometric AI models failed to load. Please check camera permissions.");
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

    // Cooldown countdown timer
    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const interval = setInterval(() => {
            setCooldownSeconds(prev => {
                if (prev <= 1) {
                    setStep('CAMERA');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownSeconds]);

    const startCamera = async () => {
        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'environment' // ER back camera / bed scanner
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
            setCameraError("Camera device inaccessible. Ensure browser camera permission is granted.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    // 2. Continuous frame sampling for Passive PAD & Quality Feedback
    useEffect(() => {
        if (!cameraActive || modelLoading || step !== 'CAMERA') return;

        let frameId;
        let isEvaluating = false;

        const loop = async () => {
            if (videoRef.current && videoRef.current.readyState === 4 && !isEvaluating) {
                isEvaluating = true;
                try {
                    const result = await detectSingleFace(videoRef.current);
                    if (result.status === 'MULTIPLE_FACES') {
                        setMultipleFaces(true);
                        setQualityWarning("MULTIPLE FACES DETECTED. Only patient should be in view.");
                    } else if (result.status === 'NO_FACE') {
                        setMultipleFaces(false);
                        setQualityWarning("Position patient's face inside the frame.");
                    } else {
                        setMultipleFaces(false);
                        padAnalyzerRef.current.addSample(result.detection, result.quality);

                        if (!result.quality.isAcceptable) {
                            setQualityWarning(result.quality.qualityMessage);
                        } else {
                            setQualityWarning(null);
                        }

                        videoRef.current._latestBiometric = result;
                    }
                } catch (e) {
                    // ignore dropped frames
                } finally {
                    isEvaluating = false;
                }
            }
            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [cameraActive, modelLoading, step]);

    // 3. Trigger Face Verification
    const handleVerifyPatient = async () => {
        if (!videoRef.current?._latestBiometric) {
            toast.error("Please position the camera over the patient's face.");
            return;
        }

        const bio = videoRef.current._latestBiometric;

        // Quality check before match (NIST Section 29)
        if (!bio.quality.isAcceptable) {
            if (isUnconsciousMode && (bio.quality.isTooDark || bio.quality.isBlurry)) {
                // In unconscious mode, if quality is poor, do NOT guess!
                setStep('INCONCLUSIVE');
                logMedicalAccessAudit({
                    hospitalId: doctorInfo.hospitalId || 'TRAUMA_UNIT',
                    hospitalName: doctorInfo.hospitalName || 'Emergency Trauma Center',
                    doctorId: doctorInfo.regNo || 'STAFF_DOCTOR',
                    patientId,
                    qrId,
                    result: 'INCONCLUSIVE',
                    accessType: 'face_biometric',
                    unconsciousMode: true
                });
                return;
            }
            toast.error(bio.quality.qualityMessage);
            return;
        }

        // Presentation Attack Detection
        const padResult = padAnalyzerRef.current.evaluatePassiveLiveness();
        if (!padResult.isLive && !isUnconsciousMode) {
            toast.error("Presentation attack suspected. Ensure a live person is present.");
        }

        setStep('VERIFYING');

        try {
            // Client-side 3-angle template comparison
            const localMatch = matchAgainstEnrolledTemplates(bio.descriptor, biometricProfile);

            // Server-side verification & token issuance
            const serverResult = await verifyFaceOnServer({
                probeDescriptor: bio.descriptor,
                patientId,
                qrId,
                doctorInfo,
                unconsciousMode: isUnconsciousMode,
                padScore: padResult.score
            });

            const isSuccess = localMatch.isMatch && serverResult.verified;

            if (isSuccess) {
                setMatchDetails({
                    matchedView: localMatch.matchedView,
                    confidence: localMatch.confidence,
                    distance: localMatch.minDistance,
                    token: serverResult.verificationToken,
                    expiresIn: serverResult.expiresIn || 900
                });
                setStep('SUCCESS');
                stopCamera();
                toast.success("✓ PATIENT VERIFIED. Identity confirmed.");
            } else {
                const nextFailed = failedAttempts + 1;
                setFailedAttempts(nextFailed);

                if (nextFailed >= 5) {
                    setStep('COOLDOWN');
                    setCooldownSeconds(300); // 5 minutes cooldown
                    stopCamera();
                    toast.error("Exceeded maximum face verification attempts. Cooldown active.");
                } else if (isUnconsciousMode && localMatch.minDistance > 0.55) {
                    setStep('INCONCLUSIVE');
                } else {
                    setStep('FAILED');
                }
            }
        } catch (err) {
            console.error("Verification processing failed:", err);
            setStep('FAILED');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 font-manrope">
            <div className="bg-[#0A0F1D] border border-white/10 w-full max-w-lg rounded-[36px] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600/10 rounded-2xl text-red-500">
                            <Stethoscope size={22} />
                        </div>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-400 block">
                                Hospital Clinical Access
                            </span>
                            <h3 className="text-xl font-black italic uppercase tracking-tight font-poppins">
                                Patient Biometric Verification
                            </h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Patient Context Banner (Dynamically retrieved from QR record) */}
                <div className="bg-[#11192A] border border-white/5 rounded-2xl p-4 mb-6 flex items-center justify-between">
                    <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                            Target Patient ID
                        </span>
                        <h4 className="text-lg font-black uppercase italic tracking-tight text-white font-poppins">
                            {patientName || "PATIENT NODE"}
                        </h4>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                        ✓ QR Identified
                    </span>
                </div>

                {/* STEP: CAMERA & VERIFICATION */}
                {step === 'CAMERA' && (
                    <div className="space-y-6">
                        {/* Unconscious Patient Mode Toggle */}
                        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3.5">
                            <div>
                                <span className="text-xs font-bold text-white block">Unconscious Patient Mode</span>
                                <span className="text-[10px] text-slate-400">
                                    Passive verification path without requiring blink or head movement
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsUnconsciousMode(!isUnconsciousMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                                    isUnconsciousMode ? 'bg-amber-500' : 'bg-slate-700'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                    isUnconsciousMode ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* Camera Frame */}
                        <div className="relative aspect-[4/3] w-full rounded-[28px] overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center">
                            {modelLoading && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0F1D]/90 gap-2">
                                    <Loader2 className="animate-spin text-red-500" size={32} />
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                                        Loading Biometric AI...
                                    </span>
                                </div>
                            )}

                            {cameraError && (
                                <div className="p-6 text-center text-xs text-red-400 font-bold">
                                    {cameraError}
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Oval Target Framing */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className={`w-44 h-60 rounded-[50%] border-2 transition-all duration-300 ${
                                    multipleFaces 
                                        ? 'border-red-600 bg-red-600/10'
                                        : qualityWarning
                                        ? 'border-amber-400/70 border-dashed'
                                        : 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                                }`} />
                            </div>

                            {/* Multiple Faces Warning */}
                            {multipleFaces && (
                                <div className="absolute top-3 inset-x-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-center shadow-lg animate-pulse">
                                    MULTIPLE FACES DETECTED
                                </div>
                            )}

                            {/* Quality Feedback Pill */}
                            {qualityWarning && !multipleFaces && (
                                <div className="absolute bottom-3 inset-x-3 bg-amber-500/90 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-center shadow-lg">
                                    {qualityWarning}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleVerifyPatient}
                                disabled={!cameraActive || !!multipleFaces}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-white/10 text-white font-black uppercase italic tracking-widest text-xs rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Camera size={16} />
                                Verify Patient Face
                            </button>

                            <button
                                type="button"
                                onClick={onAlternateOverride}
                                className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                            >
                                Use Authorized Alternate Verification
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: VERIFYING */}
                {step === 'VERIFYING' && (
                    <div className="py-12 text-center space-y-4">
                        <Loader2 size={44} className="animate-spin text-red-500 mx-auto" />
                        <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                            Analyzing Biometric Consistency...
                        </h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                            Comparing 128-d descriptor against enrolled Front, Left, and Right templates with presentation attack analysis.
                        </p>
                    </div>
                )}

                {/* STEP: SUCCESS */}
                {step === 'SUCCESS' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                            <CheckCircle2 size={42} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                                ✓ PATIENT VERIFIED
                            </h4>
                            <p className="text-xs text-slate-300 font-bold mt-1">Identity confirmed.</p>
                            <p className="text-[10px] text-slate-500 mt-2 font-mono">
                                Matched Angle: {matchDetails?.matchedView} | Confidence: {matchDetails?.confidence}% | Dist: {matchDetails?.distance}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onVerificationSuccess(matchDetails)}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Unlock size={16} /> Open Medical Profile
                        </button>
                    </div>
                )}

                {/* STEP: FAILED */}
                {step === 'FAILED' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-red-600/10 border-2 border-red-500/30 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/20">
                            <XCircle size={42} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                                PATIENT VERIFICATION FAILED
                            </h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                                The captured face could not be sufficiently matched with the patient's enrolled templates.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('CAMERA');
                                    startCamera();
                                }}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <RefreshCw size={14} /> Retry Verification
                            </button>

                            <button
                                type="button"
                                onClick={onAlternateOverride}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold uppercase tracking-widest text-[11px] border border-white/10 transition-all"
                            >
                                Use Authorized Alternate Verification
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: INCONCLUSIVE (Section 17: Unconscious Patient Mode) */}
                {step === 'INCONCLUSIVE' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20">
                            <AlertTriangle size={42} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                PATIENT IDENTITY COULD NOT BE VERIFIED
                            </h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                                Biometric analysis was inconclusive (face obstructed, lighting low, or facial trauma). Security thresholds are never lowered for emergencies.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={onAlternateOverride}
                                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 transition-all"
                            >
                                Use Authorized Alternate Verification Process
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('CAMERA');
                                    startCamera();
                                }}
                                className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                            >
                                Retry Camera Capture
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: COOLDOWN (Rate limiting) */}
                {step === 'COOLDOWN' && (
                    <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-red-600/10 border-2 border-red-500/30 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
                            <Clock size={42} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black uppercase italic tracking-tight text-white font-poppins">
                                Rate Limit Cooldown Active
                            </h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                                Too many consecutive failed biometric attempts. Security cooldown active.
                            </p>
                            <div className="text-3xl font-black font-mono text-red-500 mt-4">
                                {Math.floor(cooldownSeconds / 60)}:{(cooldownSeconds % 60).toString().padStart(2, '0')}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onAlternateOverride}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold uppercase tracking-widest text-[11px] border border-white/10 transition-all"
                        >
                            Use Authorized Alternate Verification
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
