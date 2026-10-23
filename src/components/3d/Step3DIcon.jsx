import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Creates a high-contrast optical QR pattern texture for the physical identifier in Step 4
 */
function createStepQRTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 256;
    cvs.height = 256;
    const ctx = cvs.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Pure white reflective background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 256, 256);

    // Deep black optical QR matrix
    ctx.fillStyle = '#0F1115';

    // 3 Corner Finder Patterns
    const drawFinder = (x, y) => {
        ctx.fillRect(x, y, 64, 64);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 10, y + 10, 44, 44);
        ctx.fillStyle = '#0F1115';
        ctx.fillRect(x + 20, y + 20, 24, 24);
    };

    drawFinder(16, 16);
    drawFinder(176, 16);
    drawFinder(16, 176);

    // Optical data blocks
    ctx.fillStyle = '#0F1115';
    for (let x = 16; x < 240; x += 16) {
        for (let y = 16; y < 240; y += 16) {
            if ((x < 90 && y < 90) || (x > 160 && y < 90) || (x < 90 && y > 160)) continue;
            if (x >= 96 && x <= 160 && y >= 96 && y <= 160) continue;
            if ((x * 5 + y * 11 + x * y) % 3 === 0) {
                ctx.fillRect(x, y, 13, 13);
            }
        }
    }

    // Official RESQR Crimson Center Mark
    ctx.fillStyle = '#D71920';
    ctx.beginPath();
    ctx.roundRect(96, 96, 64, 64, 12);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R', 128, 142);

    const texture = new THREE.CanvasTexture(cvs);
    texture.minFilter = THREE.LinearFilter;
    return texture;
}

/**
 * Step3DIcon
 * 
 * Distinct, high-fidelity 3D micro-models tailored specifically to the exact words
 * of each "How RESQR Works" step:
 * 
 * Step 1: "REGISTER YOUR PROFILE" -> 3D Citizen ID Badge & User Silhouette with Verified Checkmark
 * Step 2: "ADD EMERGENCY CONTACTS" -> 3D Crimson Guardian Heart with Emergency Hotline Handset
 * Step 3: "CONFIGURE PERMITTED INFORMATION" -> 3D Medical Record Shield with Crimson Cross & Blood Droplet
 * Step 4: "ACTIVATE YOUR QR OR NFC IDENTIFIER" -> 3D Physical RESQR Tag with Scannable QR Face & NFC Wave Arcs
 * Step 5: "SCAN THE IDENTIFIER WHEN ASSISTANCE IS NEEDED" -> 3D Smartphone Camera Viewfinder with Sweeping Laser Scan
 * Step 6: "FOLLOW EMERGENCY-CONTACT OR CLINICAL WORKFLOW" -> 3D Clinical Stethoscope & Emergency Triage Medical Cross
 */
export default function Step3DIcon({ stepNumber = 1 }) {
    const mountRef = useRef(null);
    const animRef = useRef(null);
    const laserRef = useRef(null);
    const pulseRef = useRef(null);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        // Container sizing
        const size = container.clientWidth || 56;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
        camera.position.set(0, 0, 3.8);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Studio Lighting
        const amb = new THREE.AmbientLight(0xffffff, 1.4);
        scene.add(amb);

        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(3, 4, 3);
        scene.add(key);

        const rim = new THREE.PointLight(0xD71920, 2.8, 6);
        rim.position.set(-1.5, -1, 1.2);
        scene.add(rim);

        const group = new THREE.Group();
        scene.add(group);

        // Core Materials
        const crimsonMat = new THREE.MeshStandardMaterial({
            color: 0xD71920,
            metalness: 0.6,
            roughness: 0.25
        });

        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xE2E8F0,
            metalness: 0.95,
            roughness: 0.15
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x1A1C23,
            metalness: 0.85,
            roughness: 0.3
        });

        const emeraldMat = new THREE.MeshStandardMaterial({
            color: 0x10B981,
            metalness: 0.5,
            roughness: 0.2
        });

        // =========================================================================
        // MODEL CONSTRUCTION ACCORDING TO STEP WORDS
        // =========================================================================

        if (stepNumber === 1) {
            // =====================================================================
            // STEP 1: "REGISTER YOUR PROFILE"
            // 3D Citizen Identity Card & User Profile Persona with Verified Check Badge
            // =====================================================================
            // ID Card Chassis
            const cardShape = new THREE.Shape();
            const w = 0.85, h = 1.15, r = 0.12;
            cardShape.moveTo(-w + r, -h);
            cardShape.lineTo(w - r, -h);
            cardShape.quadraticCurveTo(w, -h, w, -h + r);
            cardShape.lineTo(w, h - r);
            cardShape.quadraticCurveTo(w, h, w - r, h);
            cardShape.lineTo(-w + r, h);
            cardShape.quadraticCurveTo(-w, h, -w, h - r);
            cardShape.lineTo(-w, -h + r);
            cardShape.quadraticCurveTo(-w, -h, -w + r, -h);

            const cardGeo = new THREE.ExtrudeGeometry(cardShape, {
                depth: 0.08,
                bevelEnabled: true,
                bevelSize: 0.03,
                bevelThickness: 0.03
            });
            cardGeo.center();
            const cardMesh = new THREE.Mesh(cardGeo, darkMat);
            group.add(cardMesh);

            // User Persona: Sphere Head
            const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
            const headMesh = new THREE.Mesh(headGeo, crimsonMat);
            headMesh.position.set(0, 0.22, 0.1);
            group.add(headMesh);

            // User Persona: Curved Shoulder / Torso
            const torsoShape = new THREE.Shape();
            torsoShape.moveTo(-0.45, -0.42);
            torsoShape.quadraticCurveTo(0, 0.02, 0.45, -0.42);
            torsoShape.lineTo(-0.45, -0.42);
            const torsoGeo = new THREE.ExtrudeGeometry(torsoShape, {
                depth: 0.08,
                bevelEnabled: true,
                bevelSize: 0.02,
                bevelThickness: 0.02
            });
            torsoGeo.center();
            const torsoMesh = new THREE.Mesh(torsoGeo, crimsonMat);
            torsoMesh.position.set(0, -0.22, 0.1);
            group.add(torsoMesh);

            // Verified Badge (small green shield in corner)
            const badgeGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16);
            const badgeMesh = new THREE.Mesh(badgeGeo, emeraldMat);
            badgeMesh.rotation.x = Math.PI / 2;
            badgeMesh.position.set(0.55, 0.72, 0.12);
            group.add(badgeMesh);

        } else if (stepNumber === 2) {
            // =====================================================================
            // STEP 2: "ADD EMERGENCY CONTACTS"
            // 3D Crimson Guardian Heart with Emergency Hotline Handset
            // =====================================================================
            // 3D Heart Geometry
            const heartShape = new THREE.Shape();
            const x = 0, y = 0;
            heartShape.moveTo(x + 0.25, y + 0.25);
            heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
            heartShape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
            heartShape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 1.0);
            heartShape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
            heartShape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
            heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

            const heartGeo = new THREE.ExtrudeGeometry(heartShape, {
                depth: 0.18,
                bevelEnabled: true,
                bevelSegments: 4,
                bevelSize: 0.04,
                bevelThickness: 0.04
            });
            heartGeo.center();
            const heartMesh = new THREE.Mesh(heartGeo, crimsonMat);
            heartMesh.rotation.z = Math.PI;
            heartMesh.scale.set(1.1, 1.1, 1.1);
            group.add(heartMesh);
            pulseRef.current = heartMesh;

            // Curved Telephone Handset across the Heart
            const handsetCurve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(-0.55, 0.45, 0.18),
                new THREE.Vector3(-0.25, 0.1, 0.25),
                new THREE.Vector3(0.25, -0.1, 0.25),
                new THREE.Vector3(0.55, -0.45, 0.18)
            );
            const tubeGeo = new THREE.TubeGeometry(handsetCurve, 20, 0.07, 12, false);
            const handsetMesh = new THREE.Mesh(tubeGeo, chromeMat);
            group.add(handsetMesh);

            // Earpiece and Mouthpiece caps
            const capGeo = new THREE.SphereGeometry(0.12, 16, 16);
            const cap1 = new THREE.Mesh(capGeo, chromeMat);
            cap1.position.set(-0.55, 0.45, 0.18);
            const cap2 = new THREE.Mesh(capGeo, chromeMat);
            cap2.position.set(0.55, -0.45, 0.18);
            group.add(cap1);
            group.add(cap2);

        } else if (stepNumber === 3) {
            // =====================================================================
            // STEP 3: "CONFIGURE PERMITTED INFORMATION"
            // 3D Medical Record Shield with Crimson Cross & Blood Droplet
            // =====================================================================
            // Medical Shield Base
            const shieldShape = new THREE.Shape();
            shieldShape.moveTo(0, 0.85);
            shieldShape.quadraticCurveTo(0.75, 0.75, 0.75, 0.1);
            shieldShape.quadraticCurveTo(0.75, -0.55, 0, -0.95);
            shieldShape.quadraticCurveTo(-0.75, -0.55, -0.75, 0.1);
            shieldShape.quadraticCurveTo(-0.75, 0.75, 0, 0.85);

            const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
                depth: 0.1,
                bevelEnabled: true,
                bevelSize: 0.03,
                bevelThickness: 0.03
            });
            shieldGeo.center();
            const shieldMesh = new THREE.Mesh(shieldGeo, darkMat);
            group.add(shieldMesh);

            // Raised Crimson Medical Cross
            const b1 = new THREE.BoxGeometry(0.28, 0.95, 0.16);
            const b2 = new THREE.BoxGeometry(0.95, 0.28, 0.16);
            const c1 = new THREE.Mesh(b1, crimsonMat);
            const c2 = new THREE.Mesh(b2, crimsonMat);
            c1.position.z = 0.08;
            c2.position.z = 0.08;
            group.add(c1);
            group.add(c2);

            // Chrome vital indicator badge in corner
            const vitalGeo = new THREE.SphereGeometry(0.12, 16, 16);
            const vitalMesh = new THREE.Mesh(vitalGeo, chromeMat);
            vitalMesh.position.set(0.48, 0.58, 0.12);
            group.add(vitalMesh);

        } else if (stepNumber === 4) {
            // =====================================================================
            // STEP 4: "ACTIVATE YOUR QR OR NFC IDENTIFIER"
            // 3D Physical RESQR Tag with Scannable QR Face & Radiating NFC Wave Arcs
            // =====================================================================
            // Round physical tag body
            const tagGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.12, 48);
            const qrTex = createStepQRTexture();
            const tagFaceMat = new THREE.MeshStandardMaterial({ map: qrTex, roughness: 0.2, metalness: 0.2 });
            const tagRimMat = new THREE.MeshStandardMaterial({ color: 0x1A1C23, roughness: 0.3, metalness: 0.8 });

            const tagMesh = new THREE.Mesh(tagGeo, [tagRimMat, tagFaceMat, tagRimMat]);
            tagMesh.rotation.x = Math.PI / 2;
            group.add(tagMesh);

            // Radiating Contactless NFC Wave Arcs
            const arc1Geo = new THREE.TorusGeometry(1.05, 0.04, 12, 24, Math.PI / 2);
            const arc1 = new THREE.Mesh(arc1Geo, crimsonMat);
            arc1.position.set(0.1, 0.1, 0.02);
            arc1.rotation.z = Math.PI / 8;
            group.add(arc1);

            const arc2Geo = new THREE.TorusGeometry(1.22, 0.035, 12, 24, Math.PI / 2.3);
            const arc2 = new THREE.Mesh(arc2Geo, chromeMat);
            arc2.position.set(0.12, 0.12, 0.02);
            arc2.rotation.z = Math.PI / 7;
            group.add(arc2);

        } else if (stepNumber === 5) {
            // =====================================================================
            // STEP 5: "SCAN THE IDENTIFIER WHEN ASSISTANCE IS NEEDED"
            // 3D Smartphone Camera Viewfinder with Sweeping Laser Scan Line
            // =====================================================================
            // Smartphone frame
            const phoneShape = new THREE.Shape();
            const pw = 0.65, ph = 1.15, pr = 0.1;
            phoneShape.moveTo(-pw + pr, -ph);
            phoneShape.lineTo(pw - pr, -ph);
            phoneShape.quadraticCurveTo(pw, -ph, pw, -ph + pr);
            phoneShape.lineTo(pw, ph - pr);
            phoneShape.quadraticCurveTo(pw, ph, pw - pr, ph);
            phoneShape.lineTo(-pw + pr, ph);
            phoneShape.quadraticCurveTo(-pw, ph, -pw, ph - pr);
            phoneShape.lineTo(-pw, -ph + pr);
            phoneShape.quadraticCurveTo(-pw, -ph, -pw + pr, -ph);

            const phoneGeo = new THREE.ExtrudeGeometry(phoneShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
            phoneGeo.center();
            const phoneMesh = new THREE.Mesh(phoneGeo, darkMat);
            group.add(phoneMesh);

            // Target QR matrix on screen
            const qrPlaneGeo = new THREE.PlaneGeometry(0.55, 0.55);
            const qrPlaneMat = new THREE.MeshBasicMaterial({ map: createStepQRTexture() });
            const qrPlane = new THREE.Mesh(qrPlaneGeo, qrPlaneMat);
            qrPlane.position.set(0, 0, 0.05);
            group.add(qrPlane);

            // 4 Viewfinder Corner Brackets
            const cornerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const cornerSize = 0.22, thickness = 0.035;
            const makeBracket = (cx, cy, rx, ry) => {
                const bH = new THREE.Mesh(new THREE.PlaneGeometry(cornerSize, thickness), cornerMat);
                bH.position.set(cx + rx * (cornerSize / 2), cy, 0.06);
                const bV = new THREE.Mesh(new THREE.PlaneGeometry(thickness, cornerSize), cornerMat);
                bV.position.set(cx, cy + ry * (cornerSize / 2), 0.06);
                group.add(bH);
                group.add(bV);
            };

            makeBracket(-0.4, 0.4, 1, -1);   // Top-Left
            makeBracket(0.4, 0.4, -1, -1);   // Top-Right
            makeBracket(-0.4, -0.4, 1, 1);   // Bottom-Left
            makeBracket(0.4, -0.4, -1, 1);   // Bottom-Right

            // Sweeping Laser Scan Line
            const laserGeo = new THREE.PlaneGeometry(0.95, 0.05);
            const laserMat = new THREE.MeshBasicMaterial({
                color: 0xD71920,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.95
            });
            const laserMesh = new THREE.Mesh(laserGeo, laserMat);
            laserMesh.position.set(0, 0, 0.07);
            group.add(laserMesh);
            laserRef.current = laserMesh;

        } else {
            // =====================================================================
            // STEP 6: "FOLLOW EMERGENCY-CONTACT OR CLINICAL WORKFLOW"
            // 3D Clinical Stethoscope & Emergency Medical Cross Dispatch
            // =====================================================================
            // 3D Emergency Clinical Cross
            const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.1, 0.16), crimsonMat);
            const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.32, 0.16), crimsonMat);
            group.add(crossV);
            group.add(crossH);

            // Stethoscope Binaural Tube wrapping around cross
            const stethCurve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(-0.7, 0.65, 0.15),
                new THREE.Vector3(-0.4, -0.65, 0.25),
                new THREE.Vector3(0.4, -0.65, 0.25),
                new THREE.Vector3(0.7, 0.65, 0.15)
            );
            const stethTube = new THREE.TubeGeometry(stethCurve, 24, 0.05, 12, false);
            const stethMesh = new THREE.Mesh(stethTube, chromeMat);
            group.add(stethMesh);

            // Stethoscope Chestpiece Disc
            const chestGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24);
            const chestMesh = new THREE.Mesh(chestGeo, chromeMat);
            chestMesh.rotation.x = Math.PI / 2;
            chestMesh.position.set(0, -0.68, 0.2);
            group.add(chestMesh);

            // Inner crimson membrane
            const membraneGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.09, 20);
            const membraneMesh = new THREE.Mesh(membraneGeo, crimsonMat);
            membraneMesh.rotation.x = Math.PI / 2;
            membraneMesh.position.set(0, -0.68, 0.21);
            group.add(membraneMesh);
        }

        // Animation Loop: Controlled harmonic tilt ensuring models are ALWAYS clearly facing front
        const clock = new THREE.Clock();
        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Controlled front-facing harmonic tilt (never flips edge-on)
            group.rotation.y = Math.sin(time * 1.3) * 0.22;
            group.rotation.x = Math.cos(time * 1.0) * 0.1;
            group.position.y = Math.sin(time * 1.5) * 0.035;

            // Step 5: Laser line sweeps smoothly up and down
            if (laserRef.current) {
                laserRef.current.position.y = Math.sin(time * 3.0) * 0.42;
            }

            // Step 2: Heart heartbeat pulse
            if (pulseRef.current) {
                const p = 1.05 + Math.sin(time * 3.2) * 0.06;
                pulseRef.current.scale.set(p, p, p);
            }

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [stepNumber]);

    return (
        <div 
            ref={mountRef} 
            className="w-13 h-13 rounded-2xl bg-[#101216] border border-white/10 shadow-inner flex items-center justify-center shrink-0 overflow-hidden" 
        />
    );
}
