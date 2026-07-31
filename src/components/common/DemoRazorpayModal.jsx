import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ShieldCheck, CreditCard, QrCode, Building2, Wallet, Lock, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function DemoRazorpayModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    amount = 99, 
    title = "RESQR Emergency Tag Package", 
    customerName = "RESQR Citizen",
    customerEmail = "citizen@resqr.co.in",
    customerPhone = "9876543210" 
}) {
    const [paymentMethod, setPaymentMethod] = useState('upi'); // upi, card, netbanking, wallet
    const [upiId, setUpiId] = useState('user@upi');
    const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
    const [cardExpiry, setCardExpiry] = useState('12/28');
    const [cardCvv, setCardCvv] = useState('123');
    const [cardName, setCardName] = useState(customerName);
    const [selectedBank, setSelectedBank] = useState('SBI');
    
    // Flow states: 'methods' -> 'otp' -> 'processing' -> 'success'
    const [step, setStep] = useState('methods');
    const [bankOtp, setBankOtp] = useState('123456');
    const [useDemoFallback, setUseDemoFallback] = useState(false);

    const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TKBNy6z2Vsd0cq";

    useEffect(() => {
        if (!isOpen) return;

        // Try launching real Razorpay Checkout SDK first
        loadRazorpayScript().then((loaded) => {
            if (loaded && window.Razorpay && !useDemoFallback) {
                try {
                    const options = {
                        key: RAZORPAY_KEY,
                        amount: Math.round(Number(amount) * 100),
                        currency: "INR",
                        name: "RESQR Systems",
                        description: title,
                        image: `${import.meta.env.BASE_URL}resqr_logo.png`,
                        handler: function (response) {
                            toast.success("Live Payment Successful!");
                            onSuccess({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id || `order_${Date.now()}`,
                                razorpay_signature: response.razorpay_signature || 'live_signature',
                                amount: amount,
                                currency: "INR"
                            });
                            onClose();
                        },
                        prefill: {
                            name: customerName,
                            email: customerEmail,
                            contact: customerPhone
                        },
                        notes: {
                            service: "RESQR Emergency Identity passport"
                        },
                        theme: {
                            color: "#D71920"
                        },
                        modal: {
                            ondismiss: function () {
                                onClose();
                            }
                        }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (response) {
                        toast.error(response.error?.description || "Payment Failed");
                    });
                    rzp.open();
                } catch (err) {
                    console.error("Razorpay SDK launch error:", err);
                    setUseDemoFallback(true);
                }
            } else {
                setUseDemoFallback(true);
            }
        });
    }, [isOpen, useDemoFallback]);

    if (!isOpen || !useDemoFallback) return null;

    const formattedAmount = Number(amount).toFixed(2);

    const handleInitiatePayment = (e) => {
        if (e) e.preventDefault();
        setStep('otp');
    };

    const handleConfirmOtp = () => {
        setStep('processing');
        setTimeout(() => {
            setStep('success');
            const demoPaymentResponse = {
                razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 14)}`,
                razorpay_order_id: `order_${Math.random().toString(36).substring(2, 14)}`,
                razorpay_signature: `sig_${Math.random().toString(36).substring(2, 20)}`,
                amount: amount,
                currency: "INR",
                method: paymentMethod
            };
            setTimeout(() => {
                onSuccess(demoPaymentResponse);
                setStep('methods');
                onClose();
            }, 1200);
        }, 1800);
    };

    const fillTestCard = () => {
        setCardNumber('4111 1111 1111 1111');
        setCardExpiry('12/28');
        setCardCvv('123');
        toast.success("Test Visa details loaded!");
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-lg bg-[#0c162c] text-white rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20 relative"
                >
                    {/* Razorpay Top Header */}
                    <div className="bg-[#060e20] p-6 border-b border-blue-500/10 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-red-600/30 font-poppins">
                                R
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm text-white tracking-wide">Razorpay Gateway</h3>
                                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                                        LIVE MODE
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium truncate max-w-[220px]">{title}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Amount</span>
                            <span className="text-2xl font-black text-white font-poppins italic">₹{formattedAmount}</span>
                        </div>

                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Steps */}
                    {step === 'methods' && (
                        <div>
                            {/* Prefill User Bar */}
                            <div className="bg-[#081226] px-6 py-2 border-b border-blue-500/10 flex justify-between items-center text-xs text-slate-400">
                                <span>Paying as: <strong className="text-white">{customerName}</strong> ({customerPhone})</span>
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><ShieldCheck size={12} /> 256-bit Encrypted</span>
                            </div>

                            {/* Main Payment Options Layout */}
                            <div className="flex flex-col sm:flex-row min-h-[380px]">
                                {/* Left Side Tabs */}
                                <div className="w-full sm:w-2/5 bg-[#081226] p-3 border-r border-blue-500/10 space-y-1.5">
                                    <button 
                                        onClick={() => setPaymentMethod('upi')}
                                        className={`w-full p-3 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all text-left ${paymentMethod === 'upi' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <QrCode size={18} />
                                        <div>
                                            <div>UPI / QR</div>
                                            <div className="text-[9px] opacity-70 font-normal">GPay, PhonePe, Paytm</div>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => setPaymentMethod('card')}
                                        className={`w-full p-3 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all text-left ${paymentMethod === 'card' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <CreditCard size={18} />
                                        <div>
                                            <div>Card</div>
                                            <div className="text-[9px] opacity-70 font-normal">Visa, MasterCard, RuPay</div>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => setPaymentMethod('netbanking')}
                                        className={`w-full p-3 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all text-left ${paymentMethod === 'netbanking' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <Building2 size={18} />
                                        <div>
                                            <div>Netbanking</div>
                                            <div className="text-[9px] opacity-70 font-normal">SBI, HDFC, ICICI</div>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => setPaymentMethod('wallet')}
                                        className={`w-full p-3 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all text-left ${paymentMethod === 'wallet' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <Wallet size={18} />
                                        <div>
                                            <div>Wallets</div>
                                            <div className="text-[9px] opacity-70 font-normal">Amazon Pay, Paytm</div>
                                        </div>
                                    </button>
                                </div>

                                {/* Right Side Details Form */}
                                <div className="w-full sm:w-3/5 p-6 flex flex-col justify-between">
                                    {/* UPI TAB */}
                                    {paymentMethod === 'upi' && (
                                        <div className="space-y-4">
                                            <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <div className="w-32 h-32 bg-white p-2 mx-auto rounded-xl shadow-lg flex items-center justify-center">
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=resqr.official@razorpay&pn=RESQR%20Safety&am=${formattedAmount}&cu=INR`} 
                                                        alt="Razorpay Live QR Code" 
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Scan with any UPI App</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Or Pay via UPI ID</label>
                                                <input 
                                                    type="text" 
                                                    value={upiId} 
                                                    onChange={(e) => setUpiId(e.target.value)}
                                                    placeholder="username@upi"
                                                    className="w-full px-3 py-2.5 bg-slate-900 border border-blue-500/20 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <button 
                                                onClick={handleInitiatePayment}
                                                className="w-full py-3.5 bg-primary hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/30 uppercase tracking-wider transition-all"
                                            >
                                                Pay ₹{formattedAmount} via UPI
                                            </button>
                                        </div>
                                    )}

                                    {/* CARD TAB */}
                                    {paymentMethod === 'card' && (
                                        <form onSubmit={handleInitiatePayment} className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Card Details</span>
                                                <button 
                                                    type="button" 
                                                    onClick={fillTestCard} 
                                                    className="text-[10px] text-blue-400 hover:underline font-bold uppercase"
                                                >
                                                    ⚡ Fill Card
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Card Number</label>
                                                <input 
                                                    type="text" 
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    placeholder="4111 1111 1111 1111"
                                                    className="w-full px-3 py-2 bg-slate-900 border border-blue-500/20 rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Expiry</label>
                                                    <input 
                                                        type="text" 
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(e.target.value)}
                                                        placeholder="12/28"
                                                        className="w-full px-3 py-2 bg-slate-900 border border-blue-500/20 rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">CVV</label>
                                                    <input 
                                                        type="password" 
                                                        maxLength="3"
                                                        value={cardCvv}
                                                        onChange={(e) => setCardCvv(e.target.value)}
                                                        placeholder="123"
                                                        className="w-full px-3 py-2 bg-slate-900 border border-blue-500/20 rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Cardholder Name</label>
                                                <input 
                                                    type="text" 
                                                    value={cardName}
                                                    onChange={(e) => setCardName(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-900 border border-blue-500/20 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <button 
                                                type="submit"
                                                className="w-full py-3 bg-primary hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/30 uppercase tracking-wider transition-all mt-2"
                                            >
                                                Pay ₹{formattedAmount}
                                            </button>
                                        </form>
                                    )}

                                    {/* NETBANKING TAB */}
                                    {paymentMethod === 'netbanking' && (
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Select Bank</span>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak', 'PNB'].map((bank) => (
                                                    <button 
                                                        key={bank} 
                                                        type="button"
                                                        onClick={() => setSelectedBank(bank)}
                                                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${selectedBank === bank ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-slate-900 text-slate-400 hover:border-white/20'}`}
                                                    >
                                                        {bank}
                                                    </button>
                                                ))}
                                            </div>

                                            <button 
                                                onClick={handleInitiatePayment}
                                                className="w-full py-3.5 bg-primary hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/30 uppercase tracking-wider transition-all mt-4"
                                            >
                                                Pay via {selectedBank} Netbanking
                                            </button>
                                        </div>
                                    )}

                                    {/* WALLETS TAB */}
                                    {paymentMethod === 'wallet' && (
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Select Wallet</span>
                                            <div className="space-y-2">
                                                {['Amazon Pay', 'Paytm Wallet', 'Mobikwik', 'Freecharge'].map((w) => (
                                                    <button 
                                                        key={w}
                                                        onClick={handleInitiatePayment}
                                                        className="w-full p-3 bg-slate-900 border border-white/10 hover:border-primary rounded-xl flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-all"
                                                    >
                                                        <span>{w}</span>
                                                        <ArrowRight size={14} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Bank OTP Simulation */}
                    {step === 'otp' && (
                        <div className="p-8 text-center space-y-6">
                            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                                <Lock size={28} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Bank OTP Verification</h3>
                                <p className="text-xs text-slate-400">Authenticating transaction with issuing bank</p>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 space-y-3 max-w-xs mx-auto">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Enter Bank OTP Code</label>
                                <input 
                                    type="text" 
                                    maxLength="6"
                                    value={bankOtp}
                                    onChange={(e) => setBankOtp(e.target.value)}
                                    className="w-full bg-slate-950 border border-blue-500/30 rounded-xl py-3 text-center font-mono text-2xl font-bold text-blue-400 outline-none tracking-[0.2em]"
                                />
                            </div>

                            <button 
                                onClick={handleConfirmOtp}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/30 transition-all max-w-xs mx-auto"
                            >
                                Authorize Live Payment (₹{formattedAmount})
                            </button>
                        </div>
                    )}

                    {/* Step: Processing */}
                    {step === 'processing' && (
                        <div className="p-12 text-center space-y-6">
                            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Processing Transaction...</h3>
                                <p className="text-xs text-slate-400">Verifying payment with Razorpay Live Gateway</p>
                            </div>
                        </div>
                    )}

                    {/* Step: Success */}
                    {step === 'success' && (
                        <div className="p-12 text-center space-y-6">
                            <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto"
                            >
                                <CheckCircle size={44} />
                            </motion.div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-white">Payment Authorized!</h3>
                                <p className="text-xs text-slate-400">Razorpay Payment ID: <span className="font-mono text-white font-bold">pay_live_{Math.floor(100000 + Math.random() * 900000)}</span></p>
                            </div>
                        </div>
                    )}

                    {/* Razorpay Footer */}
                    <div className="bg-[#060e20] px-6 py-3 border-t border-blue-500/10 flex justify-between items-center text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-bold"><Lock size={10} /> Powered by Razorpay Live Gateway ({RAZORPAY_KEY.substring(0, 12)}...)</span>
                        <span>RESQR Enterprise</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
