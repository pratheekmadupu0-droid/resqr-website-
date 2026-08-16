import React, { useState } from 'react';
import { ShoppingCart, Star, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import DemoRazorpayModal from '../components/common/DemoRazorpayModal';
import toast from 'react-hot-toast';

export default function ProductsPage() {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

    const items = [
        {
            id: 'digital-resqr',
            name: 'DIGITAL RESQR',
            price: 99,
            desc: 'Secure dynamic digital QR profile passport compatible with Apple/Google wallet applications.',
            useCase: 'Daily digital emergency ID backup.',
            available: true,
            badge: 'Essential',
            image: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'qr-sticker',
            name: 'QR STICKER PACK',
            price: 149,
            desc: 'Weatherproof high-visibility sticker sheet containing 2 premium vinyl stickers for helmets or gear.',
            useCase: 'Riders, drivers, and daily commuters.',
            available: true,
            badge: 'Bestseller',
            image: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'keychain',
            name: 'SECURE KEYCHAIN',
            price: 199,
            desc: 'Durable, waterproof metal key loop containing laser-engraved critical emergency QR markings.',
            useCase: 'Keychains, bags, or backup tags.',
            available: false,
            badge: 'Coming Soon',
            image: 'https://images.unsplash.com/photo-1619121822248-03863a8421bb?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'band',
            name: 'HYPOALLERGENIC BAND',
            price: 249,
            desc: 'Sleek, medical-grade stretchable silicone wristband with embedded QR laser imprint.',
            useCase: 'Sports, running, and heavy labor.',
            available: false,
            badge: 'Coming Soon',
            image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'bracelet',
            name: 'TITANIUM BRACELET',
            price: 349,
            desc: 'Premium rustproof metal wrist chain containing central medical information QR tag.',
            useCase: 'Elegant, everyday lifestyle safety wear.',
            available: false,
            badge: 'Coming Soon',
            image: 'https://images.unsplash.com/photo-1619121822248-03863a8421bb?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'ring',
            name: 'NFC TITANIUM RING',
            price: 499,
            desc: 'Smart titanium ring with embedded dynamic NFC chip syncing patient profile coordinates.',
            useCase: 'Tech enthusiasts and critical patients.',
            available: false,
            badge: 'Coming Soon',
            image: 'https://images.unsplash.com/photo-1619121822248-03863a8421bb?q=80&w=800&auto=format&fit=crop'
        }
    ];

    const handleBuy = (prod) => {
        setSelectedProduct(prod);
        setIsRazorpayOpen(true);
    };

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">SAFETY PLATFORM PRODUCTS</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        RESQR PRODUCT <br />
                        <span className="text-primary italic-display">ECOSYSTEM.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Explore our range of digital passes, smart cards, and upcoming wearables engineered to coordinate rescue teams instantly.
                    </p>
                </div>
            </section>

            {/* Products Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {items.map((prod) => (
                        <Card key={prod.id} className="p-8 hover:border-white/10 transition-all flex flex-col justify-between group">
                            <div>
                                <div className="h-48 bg-slate-900 rounded-2xl overflow-hidden mb-6 relative">
                                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-slate-950/80 text-white border-white/5 text-[8px] tracking-widest uppercase">{prod.badge}</Badge>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins text-white mb-2">{prod.name}</h3>
                                <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-4">{prod.desc}</p>
                                
                                <div className="space-y-1 mb-6 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    <div>Use Case: <span className="text-white">{prod.useCase}</span></div>
                                    <div>Availability: <span className={prod.available ? 'text-emerald-400' : 'text-amber-500'}>{prod.available ? 'In Stock' : 'Coming Soon'}</span></div>
                                </div>
                            </div>

                            <div>
                                <div className="text-3xl font-black text-white italic font-poppins mb-4">₹{prod.price}</div>
                                {prod.available ? (
                                    <Button onClick={() => handleBuy(prod)} className="w-full py-4 text-xs font-black uppercase tracking-wider italic flex items-center justify-center gap-2">
                                        <ShoppingCart size={16} /> ORDER NOW
                                    </Button>
                                ) : (
                                    <Button disabled className="w-full py-4 text-xs font-black uppercase tracking-wider italic bg-white/5 text-slate-500 border-none">
                                        OUT OF STOCK
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Which RESQR is right for you? */}
            <section className="py-24 bg-slate-950 border-t border-white/5 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">WHICH RESQR IS RIGHT FOR YOU?</h2>
                    <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">
                        If you commute daily, we recommend the <strong>Sticker Pack</strong> for your helmet/motorcycle. For a clean wallet companion, choose the <strong>Smart ID Card</strong>. If you want cross-device convenience, grab the <strong>Digital QR Pass</strong>.
                    </p>
                </div>
            </section>

            {/* Demo Razorpay Modal */}
            <DemoRazorpayModal 
                isOpen={isRazorpayOpen}
                onClose={() => setIsRazorpayOpen(false)}
                amount={selectedProduct ? selectedProduct.price : 99}
                title={selectedProduct ? selectedProduct.name : "RESQR Emergency Pack"}
                onSuccess={(pay) => {
                    toast.success(`Authorized payment successful for ${selectedProduct?.name}!`);
                }}
            />
        </div>
    );
}
