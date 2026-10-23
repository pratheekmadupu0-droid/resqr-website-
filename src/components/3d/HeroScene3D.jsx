import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { QrCode, AlertTriangle, ShieldCheck, HeartHandshake, PhoneCall, RefreshCw, Check } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Creates an ultra-crisp Canvas texture for the smartphone screen
 * displaying the official RESQR Emergency Profile with zero blur.
 */
function createPhoneScreenCanvas(scenario = 'emergency', scanProgress = 0, logoImg = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background gradient - Deep matte charcoal
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 2048);
    bgGradient.addColorStop(0, '#121418');
    bgGradient.addColorStop(0.5, '#0E1013');
    bgGradient.addColorStop(1, '#08090B');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1024, 2048);

    // Top status bar notch & indicators
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('9:41', 72, 90);
    ctx.fillText('5G • 100%', 810, 90);

    // Screen Header: Official RESQR Logo & Scenario Category
    if (logoImg && (logoImg.complete || logoImg.naturalWidth > 0)) {
        // Draw authentic official RESQR logo asset with sharp proportions
        ctx.drawImage(logoImg, 72, 142, 200, 78);
    } else {
        // High-fidelity vector fallback matching official brand identity
        ctx.fillStyle = '#D71920';
        ctx.beginPath();
        ctx.roundRect(72, 154, 48, 48, 12);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('+', 87, 188);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Res', 132, 194);
        ctx.fillStyle = '#D71920';
        ctx.fillText('QR', 214, 194);
    }

    ctx.fillStyle = scenario === 'emergency' ? '#34D399' : '#60A5FA';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(scenario === 'emergency' ? '● BYSTANDER SCAN' : '● VERIFIED CLINICAL', 952, 194);
    ctx.textAlign = 'left';

    // Thin separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 240);
    ctx.lineTo(952, 240);
    ctx.stroke();

    // Citizen Identity Banner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(72, 280, 880, 310, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Blood Group Avatar
    ctx.fillStyle = 'rgba(215, 25, 32, 0.15)';
    ctx.beginPath();
    ctx.roundRect(112, 320, 130, 130, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(215, 25, 32, 0.4)';
    ctx.stroke();

    ctx.fillStyle = '#D71920';
    ctx.font = '900 64px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('O+', 177, 408);
    ctx.textAlign = 'left';

    // Citizen Name & Metadata
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('REGISTERED CITIZEN IDENTITY', 270, 360);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Rohan Sharma', 270, 425);

    ctx.fillStyle = '#64748B';
    ctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Age 31 • Protected Profile • TAG RQ-88219', 270, 480);

    // Emergency Contact Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(72, 630, 880, 310, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DESIGNATED EMERGENCY CONTACT (NEXT OF KIN)', 112, 690);

    ctx.fillStyle = '#34D399';
    ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('✓ Privacy Masked', 912, 690);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Ananya Sharma (Spouse)', 112, 765);

    ctx.fillStyle = '#D71920';
    ctx.font = 'bold 40px monospace';
    ctx.fillText('+91 98XXX XXXXX', 112, 840);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Location: Bengaluru / Delhi NCR Corridor', 112, 895);

    // Critical Allergy or Clinical Alert
    if (scenario === 'emergency') {
        ctx.fillStyle = 'rgba(215, 25, 32, 0.12)';
        ctx.beginPath();
        ctx.roundRect(72, 980, 880, 270, 28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(215, 25, 32, 0.35)';
        ctx.stroke();

        ctx.fillStyle = '#F87171';
        ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('⚠ CRITICAL MEDICAL ALERT', 120, 1045);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Severe Penicillin & Peanut Allergy', 120, 1115);

        ctx.fillStyle = '#CBD5E1';
        ctx.font = '400 30px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('High risk of anaphylactic shock. Epinephrine prescribed.', 120, 1180);
    } else {
        // Clinical Access View
        ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
        ctx.beginPath();
        ctx.roundRect(72, 980, 880, 270, 28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
        ctx.stroke();

        ctx.fillStyle = '#60A5FA';
        ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('✚ CLINICAL ADMISSIONS GATEWAY', 120, 1045);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Authorized Trauma Center Access', 120, 1115);

        ctx.fillStyle = '#CBD5E1';
        ctx.font = '400 30px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Blood: O+ Rh(D) Pos • No Chronic Cardiac History', 120, 1180);
    }

    // Call Action Button (Visual representation on screen)
    ctx.fillStyle = '#D71920';
    ctx.beginPath();
    ctx.roundRect(72, 1310, 880, 150, 32);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📞  CALL EMERGENCY CONTACT', 512, 1400);
    ctx.textAlign = 'left';

    // Footer notice
    ctx.fillStyle = '#64748B';
    ctx.font = '400 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Simulated presentation preview • Permitted emergency details only', 512, 1540);
    ctx.fillText('Operated by Sion Enterprises • resqr.co.in', 512, 1590);
    ctx.textAlign = 'left';

    // Laser scan sweep highlight overlay
    if (scanProgress > 0 && scanProgress < 1) {
        const sweepY = scanProgress * 2048;
        const sweepGrad = ctx.createLinearGradient(0, sweepY - 120, 0, sweepY + 120);
        sweepGrad.addColorStop(0, 'rgba(215, 25, 32, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(215, 25, 32, 0.35)');
        sweepGrad.addColorStop(1, 'rgba(215, 25, 32, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, sweepY - 120, 1024, 240);

        // Crisp laser line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(1024, sweepY);
        ctx.stroke();
    }

    return canvas;
}

/**
 * Creates the high-resolution texture for the physical RESQR Tag
 */
function createTagFaceCanvas(logoImg = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Matte Titanium Charcoal Base
    ctx.fillStyle = '#181A20';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle brushed concentric metallic ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 3;
    for (let r = 80; r < 500; r += 28) {
        ctx.beginPath();
        ctx.arc(512, 512, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Outer Red Accent Ring
    ctx.strokeStyle = '#D71920';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(512, 512, 440, 0, Math.PI * 2);
    ctx.stroke();

    // Central High-Contrast QR Code Mat (Square with rounded corners)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(212, 212, 600, 600, 36);
    ctx.fill();

    // Optical QR Matrix simulation
    ctx.fillStyle = '#0F1115';
    const cellSize = 30;
    const startX = 252;
    const startY = 252;
    const matrixSize = 17;

    for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
            // Keep corner finder patterns solid
            const isCornerFinder = 
                (r < 5 && c < 5) || 
                (r < 5 && c > matrixSize - 6) || 
                (r > matrixSize - 6 && c < 5);
            // Center area reserved for official RESQR logo capsule
            const isCenterLogo = (r >= 6 && r <= 10 && c >= 3 && c <= 13);

            if (isCornerFinder) {
                ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize - 3, cellSize - 3);
            } else if (!isCenterLogo) {
                // Pseudo-random pseudo-QR pattern derived from hash
                if (((r * 7 + c * 13 + r * c) % 3 === 0) || (r % 2 === 0 && c % 3 === 0)) {
                    ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize - 3, cellSize - 3);
                }
            }
        }
    }

    // Official RESQR Logo Center Capsule in QR
    ctx.fillStyle = '#101216';
    ctx.beginPath();
    ctx.roundRect(316, 432, 392, 160, 26);
    ctx.fill();
    ctx.strokeStyle = '#D71920';
    ctx.lineWidth = 6;
    ctx.stroke();

    if (logoImg && (logoImg.complete || logoImg.naturalWidth > 0)) {
        // Draw exact authentic official RESQR logo asset inside tag center
        ctx.drawImage(logoImg, 332, 446, 360, 132);
    } else {
        // High-fidelity vector fallback matching official brand logo
        ctx.fillStyle = '#D71920';
        ctx.fillRect(352, 474, 48, 48);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 52px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Res', 416, 514);
        ctx.fillStyle = '#D71920';
        ctx.fillText('QR', 504, 514);
    }

    // Chamfered text engravings around the rim
    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RESQR  •  TAG RQ-88219  •  NFC + OPTICAL QR', 512, 920);
    ctx.fillText('SION ENTERPRISES  •  SCAN TO RESCUE', 512, 130);
    ctx.textAlign = 'left';

    return canvas;
}

export default function HeroScene3D({ scanScenario = 'emergency', onScenarioChange }) {
    const mountRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [webglSupported, setWebglSupported] = useState(true);

    const sceneRef = useRef(null);
    const tagMeshRef = useRef(null);
    const tagTextureRef = useRef(null);
    const phoneMeshRef = useRef(null);
    const phoneTextureRef = useRef(null);
    const logoImgRef = useRef(null);
    const laserMeshRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
    const animationFrameIdRef = useRef(null);
    const scanProgressRef = useRef(0);

    // Trigger laser scan simulation
    const handleTriggerScan = () => {
        if (isScanning) return;
        setIsScanning(true);
        scanProgressRef.current = 0.01;
        toast.success("Simulating NFC / QR Optical Scan...", { icon: '⚡' });
    };

    const handleCallContact = () => {
        toast("Demonstration Mode: Emergency contact dialer triggered for spouse Ananya Sharma.", {
            icon: '📞',
            duration: 4500
        });
    };

    useEffect(() => {
        // Test WebGL availability
        try {
            const testCanvas = document.createElement('canvas');
            const hasGl = !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
            if (!hasGl) {
                setWebglSupported(false);
                return;
            }
        } catch (e) {
            setWebglSupported(false);
            return;
        }

        const container = mountRef.current;
        if (!container) return;

        // Preload and observe official RESQR logo asset for WebGL canvas textures
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = `${import.meta.env.BASE_URL}resqr_logo.png`;
        logo.onload = () => {
            logoImgRef.current = logo;
            if (phoneTextureRef.current) {
                phoneTextureRef.current.image = createPhoneScreenCanvas(scanScenario, 0, logo);
                phoneTextureRef.current.needsUpdate = true;
            }
            if (tagTextureRef.current) {
                tagTextureRef.current.image = createTagFaceCanvas(logo);
                tagTextureRef.current.needsUpdate = true;
            }
        };
        if (logo.complete && logo.naturalWidth > 0) {
            logoImgRef.current = logo;
        }

        const width = container.clientWidth || 580;
        const height = container.clientHeight || 560;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Perspective Camera
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 0, 7.8);

        // Renderer with soft anti-aliasing
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(renderer.domElement);

        // Controlled Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambientLight);

        // Key Light (Angled top-left)
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
        keyLight.position.set(-4, 6, 6);
        keyLight.castShadow = true;
        scene.add(keyLight);

        // Soft Fill Light (Right)
        const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.0);
        fillLight.position.set(5, -2, 4);
        scene.add(fillLight);

        // Crimson Rim / Edge Point Light (Behind Tag)
        const crimsonRim = new THREE.PointLight(0xD71920, 3.5, 12);
        crimsonRim.position.set(1.5, 0.5, 1.2);
        scene.add(crimsonRim);

        // Soft Ground Contact Shadow Plane
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 512;
        shadowCanvas.height = 512;
        const sCtx = shadowCanvas.getContext('2d');
        if (sCtx) {
            const grad = sCtx.createRadialGradient(256, 256, 20, 256, 256, 240);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
            grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            sCtx.fillStyle = grad;
            sCtx.fillRect(0, 0, 512, 512);
        }
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const shadowPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(6.5, 3.5),
            new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.65 })
        );
        shadowPlane.position.set(0, -2.4, -0.2);
        shadowPlane.rotation.x = -Math.PI / 2;
        scene.add(shadowPlane);

        // ========================================================
        // 1. SMARTPHONE 3D MESH
        // ========================================================
        const phoneGroup = new THREE.Group();
        phoneGroup.position.set(0.65, -0.1, -0.4);
        phoneGroup.rotation.set(0.08, -0.16, 0.04);
        scene.add(phoneGroup);
        phoneMeshRef.current = phoneGroup;

        // Slim phone body chassis
        const phoneWidth = 2.45;
        const phoneHeight = 4.9;
        const phoneDepth = 0.16;
        const phoneRadius = 0.28;

        const phoneShape = new THREE.Shape();
        const pw = phoneWidth / 2;
        const ph = phoneHeight / 2;
        phoneShape.moveTo(-pw + phoneRadius, -ph);
        phoneShape.lineTo(pw - phoneRadius, -ph);
        phoneShape.quadraticCurveTo(pw, -ph, pw, -ph + phoneRadius);
        phoneShape.lineTo(pw, ph - phoneRadius);
        phoneShape.quadraticCurveTo(pw, ph, pw - phoneRadius, ph);
        phoneShape.lineTo(-pw + phoneRadius, ph);
        phoneShape.quadraticCurveTo(-pw, ph, -pw, ph - phoneRadius);
        phoneShape.lineTo(-pw, -ph + phoneRadius);
        phoneShape.quadraticCurveTo(-pw, -ph, -pw + phoneRadius, -ph);

        const phoneExtrudeSettings = {
            depth: phoneDepth,
            bevelEnabled: true,
            bevelSegments: 6,
            steps: 1,
            bevelSize: 0.04,
            bevelThickness: 0.04
        };
        const phoneGeometry = new THREE.ExtrudeGeometry(phoneShape, phoneExtrudeSettings);
        phoneGeometry.center();

        const chassisMaterial = new THREE.MeshStandardMaterial({
            color: 0x1A1C22,
            metalness: 0.92,
            roughness: 0.22,
        });
        const phoneChassis = new THREE.Mesh(phoneGeometry, chassisMaterial);
        phoneGroup.add(phoneChassis);

        const activeLogo = logoImgRef.current || (logo.complete && logo.naturalWidth > 0 ? logo : null);

        // Screen texture plane
        const screenCanvas = createPhoneScreenCanvas(scanScenario, 0, activeLogo);
        const phoneScreenTexture = new THREE.CanvasTexture(screenCanvas);
        phoneScreenTexture.minFilter = THREE.LinearFilter;
        phoneScreenTexture.magFilter = THREE.LinearFilter;
        phoneTextureRef.current = phoneScreenTexture;

        const screenGeometry = new THREE.PlaneGeometry(phoneWidth - 0.08, phoneHeight - 0.08);
        const screenMaterial = new THREE.MeshBasicMaterial({
            map: phoneScreenTexture,
            toneMapped: false
        });
        const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
        screenMesh.position.set(0, 0, phoneDepth / 2 + 0.042);
        phoneGroup.add(screenMesh);

        // Glass reflection layer
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            roughness: 0.05,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05
        });
        const glassMesh = new THREE.Mesh(screenGeometry, glassMaterial);
        glassMesh.position.set(0, 0, phoneDepth / 2 + 0.045);
        phoneGroup.add(glassMesh);

        // ========================================================
        // 2. PHYSICAL RESQR TAG 3D MESH
        // ========================================================
        const tagGroup = new THREE.Group();
        tagGroup.position.set(-1.3, 0.2, 0.85);
        tagGroup.rotation.set(-0.06, 0.22, -0.05);
        scene.add(tagGroup);
        tagMeshRef.current = tagGroup;

        // Circular physical tag body
        const tagRadius = 1.25;
        const tagThickness = 0.18;
        const tagGeometry = new THREE.CylinderGeometry(tagRadius, tagRadius, tagThickness, 64, 1, false);

        // Front Face texture with high-contrast QR matrix & official RESQR logo
        const tagFaceCanvas = createTagFaceCanvas(activeLogo);
        const tagFaceTexture = new THREE.CanvasTexture(tagFaceCanvas);
        tagFaceTexture.minFilter = THREE.LinearFilter;
        tagFaceTexture.magFilter = THREE.LinearFilter;
        tagTextureRef.current = tagFaceTexture;

        const tagRimMaterial = new THREE.MeshStandardMaterial({
            color: 0x22252C,
            metalness: 0.88,
            roughness: 0.32,
        });

        const tagFaceMaterial = new THREE.MeshStandardMaterial({
            map: tagFaceTexture,
            metalness: 0.3,
            roughness: 0.25,
        });

        const tagMaterials = [
            tagRimMaterial,  // Sides
            tagFaceMaterial, // Top face
            tagRimMaterial   // Bottom face
        ];

        const tagCylinder = new THREE.Mesh(tagGeometry, tagMaterials);
        tagCylinder.rotation.x = Math.PI / 2;
        tagGroup.add(tagCylinder);

        // Laser scan sweep beam (initially hidden)
        const laserGeometry = new THREE.PlaneGeometry(3.2, 0.12);
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0xD71920,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const laserBeam = new THREE.Mesh(laserGeometry, laserMaterial);
        laserBeam.position.set(0, 0, 1.2);
        scene.add(laserBeam);
        laserMeshRef.current = laserBeam;

        // Pointer-based parallax handler
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
            mouseRef.current.targetX = x * 0.45;
            mouseRef.current.targetY = y * 0.35;
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

        // Reduced motion check
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Main Animation Loop
        let clock = new THREE.Clock();

        const animate = () => {
            animationFrameIdRef.current = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            // Smooth pointer lerp
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

            if (!prefersReducedMotion) {
                // Majestic Tag float & slow harmonic rotation
                if (tagMeshRef.current) {
                    tagMeshRef.current.position.y = 0.2 + Math.sin(time * 1.3) * 0.08;
                    tagMeshRef.current.rotation.y = 0.22 + Math.sin(time * 0.8) * 0.14 + mouseRef.current.x * 0.4;
                    tagMeshRef.current.rotation.x = -0.06 + Math.cos(time * 0.9) * 0.08 + mouseRef.current.y * 0.3;
                }

                // Subtle Phone movement & parallax
                if (phoneMeshRef.current) {
                    phoneMeshRef.current.position.y = -0.1 + Math.cos(time * 1.1) * 0.04;
                    phoneMeshRef.current.rotation.y = -0.16 + mouseRef.current.x * 0.25;
                    phoneMeshRef.current.rotation.x = 0.08 + mouseRef.current.y * 0.2;
                }
            }

            // Laser scan progress update
            if (scanProgressRef.current > 0) {
                scanProgressRef.current += delta * 1.1;

                if (laserMeshRef.current) {
                    laserMeshRef.current.material.opacity = Math.sin(scanProgressRef.current * Math.PI) * 0.85;
                    laserMeshRef.current.position.y = 1.8 - scanProgressRef.current * 3.6;
                }

                // Update canvas with scan progress line
                if (phoneTextureRef.current) {
                    const updatedCanvas = createPhoneScreenCanvas(scanScenario, scanProgressRef.current, logoImgRef.current);
                    phoneTextureRef.current.image = updatedCanvas;
                    phoneTextureRef.current.needsUpdate = true;
                }

                if (scanProgressRef.current >= 1) {
                    scanProgressRef.current = 0;
                    setIsScanning(false);
                    if (laserMeshRef.current) laserMeshRef.current.material.opacity = 0;
                    if (phoneTextureRef.current) {
                        phoneTextureRef.current.image = createPhoneScreenCanvas(scanScenario, 0, logoImgRef.current);
                        phoneTextureRef.current.needsUpdate = true;
                    }
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        // Responsive resize observer
        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

            // Dispose Three.js memory cleanly
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Re-render phone screen texture when scenario toggles
    useEffect(() => {
        if (phoneTextureRef.current) {
            phoneTextureRef.current.image = createPhoneScreenCanvas(scanScenario, 0, logoImgRef.current);
            phoneTextureRef.current.needsUpdate = true;
        }
    }, [scanScenario]);

    return (
        <div className="relative w-full h-[540px] sm:h-[620px] lg:h-[660px] flex flex-col justify-between">
            {/* Ambient Background Illumination */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] bg-[#D71920]/[0.10] rounded-full blur-[130px] pointer-events-none" />

            {/* Top Interactive Scenario Bar */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D71920] animate-pulse" />
                    3D Interactive Product Stage
                </span>

                <div className="inline-flex p-1 rounded-xl bg-[#14161B] border border-[#272B33] text-[11px] font-semibold">
                    <button
                        type="button"
                        onClick={() => onScenarioChange && onScenarioChange('emergency')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            scanScenario === 'emergency'
                                ? 'bg-[#D71920] text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Emergency Scan
                    </button>
                    <button
                        type="button"
                        onClick={() => onScenarioChange && onScenarioChange('clinical')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            scanScenario === 'clinical'
                                ? 'bg-[#22252C] text-white border border-white/10 shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Clinical Access
                    </button>
                </div>
            </div>

            {/* 3D WebGL Canvas Viewport */}
            <div 
                ref={mountRef} 
                className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
                aria-label="Interactive 3D RESQR Physical Tag and Smartphone Model"
            >
                {!webglSupported && (
                    /* Fallback for environments where WebGL is unavailable */
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-[#14161B] rounded-3xl border border-white/10">
                        <div className="space-y-3">
                            <QrCode size={48} className="text-[#D71920] mx-auto" />
                            <p className="text-sm font-bold text-white">RESQR 3D Studio Rendering</p>
                            <p className="text-xs text-slate-400">WebGL hardware acceleration disabled. Showing high-fidelity fallback presentation.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Interactive Demonstration Action Console */}
            <div className="relative z-20 px-2 pb-2 flex flex-wrap items-center justify-between gap-3 bg-[#14161B]/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shadow-xl">
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleTriggerScan}
                        disabled={isScanning}
                        className="h-10 px-4 bg-[#D71920] hover:bg-[#A80F19] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#D71920]/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
                        <span>{isScanning ? "Scanning Identifier..." : "Simulate 3D Scan"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleCallContact}
                        className="h-10 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                        <PhoneCall size={14} className="text-emerald-400" />
                        <span className="hidden sm:inline">Test Emergency Call</span>
                    </button>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Real-time Three.js WebGL • Pointer Parallax Enabled</span>
                </div>
            </div>
        </div>
    );
}
