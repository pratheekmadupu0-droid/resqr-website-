import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * Interactive 3D Product Mesh Viewer for the RESQR Product Ecosystem.
 * Renders distinct physical geometries and material shaders for each product type:
 * - 'Digital Mobile Pass': Floating holographic Apple/Google Wallet digital card
 * - 'Reflective QR Stickers': Circular 3M reflective vinyl badge with micro-prismatic sheen
 * - 'Stainless Steel Keychains': Heavy brushed steel tag with laser engraving and split-ring loop
 * - 'NFC Emergency Smart Card': Standard PVC smart card with gold NFC contact chip
 */
export default function Product3DViewer({ productType = 'digital', className = '' }) {
    const mountRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const sceneRef = useRef(null);
    const meshRef = useRef(null);
    const animIdRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const width = container.clientWidth || 240;
        const height = container.clientHeight || 180;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
        camera.position.set(0, 0, 4.8);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Studio Lights
        const amb = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(amb);

        const key = new THREE.DirectionalLight(0xffffff, 2.0);
        key.position.set(3, 4, 4);
        scene.add(key);

        const rim = new THREE.PointLight(0xD71920, 2.8, 8);
        rim.position.set(-2, -1, 1.5);
        scene.add(rim);

        // Group container for the product
        const group = new THREE.Group();
        scene.add(group);
        meshRef.current = group;

        // Preload official RESQR logo texture for 3D products
        const logoTex = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}resqr_logo.png`);
        logoTex.minFilter = THREE.LinearFilter;

        // Determine geometry & materials based on productType
        const typeKey = productType.toLowerCase();

        if (typeKey.includes('sticker')) {
            // ==========================================
            // PRODUCT 2: 3M Reflective Vinyl Sticker Disc
            // ==========================================
            const stickerGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.04, 48);
            
            // Texture with high-reflectivity vinyl graphics
            const cvs = document.createElement('canvas');
            cvs.width = 512;
            cvs.height = 512;
            const ctx = cvs.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#111317';
                ctx.fillRect(0, 0, 512, 512);

                // Reflective micro-prismatic grid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 512; i += 12) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, 512);
                    ctx.stroke();
                }

                ctx.strokeStyle = '#D71920';
                ctx.lineWidth = 14;
                ctx.beginPath();
                ctx.arc(256, 256, 220, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(156, 156, 200, 200);

                ctx.fillStyle = '#111317';
                ctx.fillRect(180, 180, 50, 50);
                ctx.fillRect(282, 180, 50, 50);
                ctx.fillRect(180, 282, 50, 50);

                ctx.fillStyle = '#D71920';
                ctx.beginPath();
                ctx.arc(256, 256, 24, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('RESQR HELMET VINYL', 256, 430);
            }

            const stickerTex = new THREE.CanvasTexture(cvs);
            const stickerMat = new THREE.MeshStandardMaterial({
                map: stickerTex,
                roughness: 0.15,
                metalness: 0.75,
            });
            const rimMat = new THREE.MeshStandardMaterial({ color: 0x22252C, roughness: 0.4 });
            const stickerMesh = new THREE.Mesh(stickerGeo, [rimMat, stickerMat, rimMat]);
            stickerMesh.rotation.x = Math.PI / 2.3;

            // Official RESQR Logo centered on vinyl badge
            const logoStickerGeo = new THREE.PlaneGeometry(1.1, 0.42);
            const logoStickerMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true });
            const logoStickerMesh = new THREE.Mesh(logoStickerGeo, logoStickerMat);
            logoStickerMesh.position.set(0, 0.025, 0);
            logoStickerMesh.rotation.x = -Math.PI / 2;
            stickerMesh.add(logoStickerMesh);
            group.add(stickerMesh);

        } else if (typeKey.includes('keychain')) {
            // ==========================================
            // PRODUCT 3: Stainless Steel Engraved Keychain
            // ==========================================
            const tagShape = new THREE.Shape();
            const w = 1.0;
            const h = 1.8;
            const r = 0.2;
            tagShape.moveTo(-w + r, -h);
            tagShape.lineTo(w - r, -h);
            tagShape.quadraticCurveTo(w, -h, w, -h + r);
            tagShape.lineTo(w, h - r);
            tagShape.quadraticCurveTo(w, h, w - r, h);
            tagShape.lineTo(-w + r, h);
            tagShape.quadraticCurveTo(-w, h, -w, h - r);
            tagShape.lineTo(-w, -h + r);
            tagShape.quadraticCurveTo(-w, -h, -w + r, -h);

            // Keyhole
            const holePath = new THREE.Path();
            holePath.absarc(0, 1.4, 0.16, 0, Math.PI * 2, true);
            tagShape.holes.push(holePath);

            const steelGeo = new THREE.ExtrudeGeometry(tagShape, {
                depth: 0.08,
                bevelEnabled: true,
                bevelSegments: 4,
                bevelSize: 0.03,
                bevelThickness: 0.03
            });
            steelGeo.center();

            const steelMat = new THREE.MeshStandardMaterial({
                color: 0xD0D5DD,
                metalness: 0.95,
                roughness: 0.2,
            });
            const steelMesh = new THREE.Mesh(steelGeo, steelMat);

            // Official RESQR Logo laser-engraved on steel plate
            const logoSteelGeo = new THREE.PlaneGeometry(1.15, 0.44);
            const logoSteelMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, opacity: 0.9 });
            const logoSteelMesh = new THREE.Mesh(logoSteelGeo, logoSteelMat);
            logoSteelMesh.position.set(0, -0.2, 0.045);
            steelMesh.add(logoSteelMesh);
            group.add(steelMesh);

            // Split ring loop
            const ringGeo = new THREE.TorusGeometry(0.35, 0.045, 16, 32);
            const ringMesh = new THREE.Mesh(ringGeo, steelMat);
            ringMesh.position.set(0, 1.4, 0);
            ringMesh.rotation.x = Math.PI / 3;
            group.add(ringMesh);

        } else if (typeKey.includes('nfc') || typeKey.includes('card')) {
            // ==========================================
            // PRODUCT 4: NFC Emergency Smart Card
            // ==========================================
            const cardShape = new THREE.Shape();
            const cw = 1.6;
            const ch = 1.0;
            const cr = 0.1;
            cardShape.moveTo(-cw + cr, -ch);
            cardShape.lineTo(cw - cr, -ch);
            cardShape.quadraticCurveTo(cw, -ch, cw, -ch + cr);
            cardShape.lineTo(cw, ch - cr);
            cardShape.quadraticCurveTo(cw, ch, cw - cr, ch);
            cardShape.lineTo(-cw + cr, ch);
            cardShape.quadraticCurveTo(-cw, ch, -cw, ch - cr);
            cardShape.lineTo(-cw, -ch + cr);
            cardShape.quadraticCurveTo(-cw, -ch, -cw + cr, -ch);

            const cardGeo = new THREE.ExtrudeGeometry(cardShape, {
                depth: 0.04,
                bevelEnabled: true,
                bevelSegments: 3,
                bevelSize: 0.02,
                bevelThickness: 0.02
            });
            cardGeo.center();

            const cardMat = new THREE.MeshStandardMaterial({
                color: 0x14161B,
                metalness: 0.7,
                roughness: 0.25,
            });
            const cardMesh = new THREE.Mesh(cardGeo, cardMat);
            group.add(cardMesh);

            // Embedded Gold NFC chip
            const chipGeo = new THREE.PlaneGeometry(0.42, 0.34);
            const chipMat = new THREE.MeshStandardMaterial({
                color: 0xEAB308,
                metalness: 0.95,
                roughness: 0.2
            });
            const chipMesh = new THREE.Mesh(chipGeo, chipMat);
            chipMesh.position.set(-0.9, 0, 0.05);
            group.add(chipMesh);

            // Crimson Emergency stripe
            const stripeGeo = new THREE.PlaneGeometry(0.12, 1.95);
            const stripeMat = new THREE.MeshBasicMaterial({ color: 0xD71920 });
            const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
            stripeMesh.position.set(1.4, 0, 0.05);
            group.add(stripeMesh);

            // Official RESQR Logo printed on card face
            const logoCardGeo = new THREE.PlaneGeometry(1.1, 0.42);
            const logoCardMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true });
            const logoCardMesh = new THREE.Mesh(logoCardGeo, logoCardMat);
            logoCardMesh.position.set(0.15, 0.35, 0.05);
            group.add(logoCardMesh);

        } else {
            // ==========================================
            // PRODUCT 1: Digital Mobile Wallet Pass
            // ==========================================
            const passShape = new THREE.Shape();
            const dw = 1.35;
            const dh = 2.1;
            const dr = 0.16;
            passShape.moveTo(-dw + dr, -dh);
            passShape.lineTo(dw - dr, -dh);
            passShape.quadraticCurveTo(dw, -dh, dw, -dh + dr);
            passShape.lineTo(dw, dh - dr);
            passShape.quadraticCurveTo(dw, dh, dw - dr, dh);
            passShape.lineTo(-dw + dr, dh);
            passShape.quadraticCurveTo(-dw, dh, -dw, dh - dr);
            passShape.lineTo(-dw, -dh + dr);
            passShape.quadraticCurveTo(-dw, -dh, -dw + dr, -dh);

            const passGeo = new THREE.ExtrudeGeometry(passShape, {
                depth: 0.03,
                bevelEnabled: true,
                bevelSegments: 3,
                bevelSize: 0.02,
                bevelThickness: 0.02
            });
            passGeo.center();

            const passMat = new THREE.MeshPhysicalMaterial({
                color: 0x141824,
                roughness: 0.1,
                metalness: 0.6,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });
            const passMesh = new THREE.Mesh(passGeo, passMat);
            group.add(passMesh);

            // Glowing pass header
            const passHeaderGeo = new THREE.PlaneGeometry(2.5, 0.7);
            const passHeaderMat = new THREE.MeshBasicMaterial({ color: 0xD71920 });
            const passHeaderMesh = new THREE.Mesh(passHeaderGeo, passHeaderMat);
            passHeaderMesh.position.set(0, 1.6, 0.04);
            group.add(passHeaderMesh);

            // Official RESQR Logo on digital pass header
            const logoPassGeo = new THREE.PlaneGeometry(1.4, 0.54);
            const logoPassMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true });
            const logoPassMesh = new THREE.Mesh(logoPassGeo, logoPassMat);
            logoPassMesh.position.set(0, 1.6, 0.06);
            group.add(logoPassMesh);
        }

        // Mouse hover interaction
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
            mouseRef.current.targetX = x * 0.8;
            mouseRef.current.targetY = y * 0.6;
        };

        const handleMouseEnter = () => setIsHovered(true);
        const handleMouseLeave = () => {
            setIsHovered(false);
            mouseRef.current.targetX = 0;
            mouseRef.current.targetY = 0;
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        const clock = new THREE.Clock();
        const animate = () => {
            animIdRef.current = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

            if (meshRef.current) {
                // Harmonic floating animation
                meshRef.current.position.y = Math.sin(time * 1.5) * 0.06;
                meshRef.current.rotation.y = time * 0.4 + mouseRef.current.x;
                meshRef.current.rotation.x = mouseRef.current.y * 0.6;
            }

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
            if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [productType]);

    return (
        <div 
            ref={mountRef} 
            className={`w-full h-44 cursor-grab active:cursor-grabbing rounded-xl overflow-hidden relative ${className}`}
            aria-label={`Interactive 3D model of ${productType}`}
        />
    );
}
