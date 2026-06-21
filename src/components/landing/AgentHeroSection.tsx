"use client";

import { useEffect, useRef, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Layers, LayoutGrid, ShieldCheck, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import * as THREE from "three";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function AgentHeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#020202] px-5 pb-10 pt-20 text-white antialiased sm:px-8 lg:min-h-[82dvh] lg:px-16 lg:pb-10 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#191506] via-[#020202] to-transparent opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#020202] via-[#020202] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1440px]">
        <div className="grid min-h-[600px] items-center gap-8 lg:min-h-[calc(82dvh-7.5rem)] lg:grid-cols-[minmax(0,0.88fr)_minmax(520px,1.12fr)] lg:gap-4 xl:gap-10">
          <div className="relative z-10 mx-auto flex max-w-[560px] flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffd400] backdrop-blur-md"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ffd400]/50 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#ffd400]" />
              </span>
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              TaskBricks workspace
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 max-w-[560px] text-[42px] font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[68px]"
            >
              Plan work.
              <br />
              Track progress.
              <br />
              <span className="bg-gradient-to-r from-[#ffd400] via-[#fff2a8] to-white bg-clip-text text-transparent">
                Ship faster.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-[500px] text-[15px] font-medium leading-7 text-[#a3a3aa] sm:text-base"
            >
              TaskBricks connects projects, sprints, approvals, and AI agents in one secure workspace.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ffd400] px-6 text-sm font-black text-[#111111] shadow-[0_18px_42px_rgba(255,212,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f2c200]"
              >
                Start workspace <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="#agents"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-6 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.07]"
              >
                <Layers className="size-4 text-[#ffd400]" aria-hidden="true" />
                View agents
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.55 }}
              className="mt-6 flex max-w-[500px] flex-wrap items-center justify-center gap-2 lg:justify-start"
            >
              <HeroChip icon={Workflow} label="Boards" />
              <HeroChip icon={ShieldCheck} label="Controls" />
              <HeroChip icon={Bot} label="AI agents" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.55 }}
              className="mt-5 flex max-w-[500px] flex-wrap items-center justify-center gap-2.5 lg:justify-start"
            >
              <SocialProofChip value="30K+" label="Active users" />
              <SocialProofChip value="99.9%" label="Uptime" />
              <SocialProofChip value="4.9★" label="User rating" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40, filter: "blur(5px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.22, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-h-[400px] select-none lg:min-h-[500px] lg:max-h-[64dvh]"
          >
            <div className="pointer-events-none absolute -inset-x-16 top-1/2 h-72 -translate-y-1/2 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,212,0,0.12),transparent_70%)] blur-2xl" />
            <FloatingTaskCubes />
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-[#020202] to-transparent lg:block" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#020202] to-transparent" />
          </motion.div>
        </div>
      </div>

    </section>
  );
}

function HeroChip({ icon: Icon, label }: { icon: IconType; label: string }) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 text-[12px] font-semibold text-white/72 backdrop-blur-md">
      <Icon className="size-3.5 text-[#ffd400]" aria-hidden="true" />
      {label}
    </span>
  );
}

function SocialProofChip({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-white/70 backdrop-blur-md">
      <span className="font-black text-[#ffd400]">{value}</span>
      {label}
    </span>
  );
}

function FloatingTaskCubes() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#020202", 8, 16);
    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 1000);
    camera.position.set(0, 0, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.7;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight("#ffffff", 0.12));

    const keyLight = new THREE.DirectionalLight("#ffffff", 5.2);
    keyLight.position.set(-4, 5, 4);
    scene.add(keyLight);

    const rimGlowLight = new THREE.DirectionalLight("#ffffff", 3.8);
    rimGlowLight.position.set(5, 2.5, -5);
    scene.add(rimGlowLight);

    const warmGlowLight = new THREE.PointLight("#ffd400", 5, 18);
    warmGlowLight.position.set(0, -2, 4);
    scene.add(warmGlowLight);

    const whiteSweepLight = new THREE.PointLight("#ffffff", 7, 14);
    whiteSweepLight.position.set(-5, 1.5, 3);
    scene.add(whiteSweepLight);

    const disposableObjects: Array<{ dispose: () => void }> = [];
    const cubeGroups: Array<InstanceType<typeof THREE.Group>> = [];
    const BRICKS = [
      { letter: "T", x: -3.65, y: 0.42, z: -0.18, scale: 1.03, rx: 0.22, ry: -0.5 },
      { letter: "A", x: -1.22, y: -0.34, z: 0.22, scale: 0.94, rx: -0.1, ry: 0.42 },
      { letter: "S", x: 1.15, y: 0.26, z: 0.03, scale: 0.98, rx: 0.18, ry: -0.28 },
      { letter: "K", x: 3.5, y: -0.42, z: -0.08, scale: 1.06, rx: -0.16, ry: 0.48 },
    ] as const;
    const impulseVelocities = [0, 0, 0, 0];

    BRICKS.forEach((brick) => {
      const group = new THREE.Group();
      group.position.set(brick.x, brick.y, brick.z);
      group.rotation.set(brick.rx, brick.ry, 0);
      group.scale.setScalar(brick.scale);

      const brickGeometry = new THREE.BoxGeometry(1.62, 1.62, 1.62, 5, 5, 5);
      const brickMaterial = new THREE.MeshPhysicalMaterial({
        color: "#050505",
        transparent: true,
        opacity: 0.55,
        roughness: 0.05,
        metalness: 0.08,
        transmission: 0.72,
        ior: 1.55,
        thickness: 0.65,
        specularIntensity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        side: THREE.DoubleSide,
      });
      const brickMesh = new THREE.Mesh(brickGeometry, brickMaterial);
      group.add(brickMesh);

      const edgeGeometry = new THREE.EdgesGeometry(brickGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.22,
      });
      const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      group.add(edgeLines);

      const innerPanelGeometry = new THREE.BoxGeometry(1.02, 1.02, 0.05);
      const innerPanelMaterial = new THREE.MeshPhysicalMaterial({
        color: "#050505",
        transparent: true,
        opacity: 0.42,
        roughness: 0.18,
        metalness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
      });
      const innerPanel = new THREE.Mesh(innerPanelGeometry, innerPanelMaterial);
      innerPanel.position.z = 0.18;
      group.add(innerPanel);

      const letterTexture = createLetterTexture(brick.letter);
      const letterMaterial = new THREE.MeshBasicMaterial({
        map: letterTexture,
        transparent: true,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const letterGeometry = new THREE.PlaneGeometry(0.78, 0.78);
      const frontLetter = new THREE.Mesh(letterGeometry, letterMaterial);
      frontLetter.position.z = 0.82;
      group.add(frontLetter);

      const backLetter = new THREE.Mesh(letterGeometry, letterMaterial);
      backLetter.position.z = -0.82;
      backLetter.rotation.y = Math.PI;
      group.add(backLetter);

      const shineGeometry = new THREE.PlaneGeometry(0.24, 1.24);
      const shineMaterial = new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });
      const shine = new THREE.Mesh(shineGeometry, shineMaterial);
      shine.position.set(-0.52, 0.12, 0.83);
      shine.rotation.z = -0.18;
      group.add(shine);

      const glowGeometry = new THREE.PlaneGeometry(2.2, 2.2);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.035,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.z = -0.82;
      group.add(glow);

      disposableObjects.push(
        brickGeometry,
        brickMaterial,
        edgeGeometry,
        edgeMaterial,
        innerPanelGeometry,
        innerPanelMaterial,
        letterTexture,
        letterMaterial,
        letterGeometry,
        shineGeometry,
        shineMaterial,
        glowGeometry,
        glowMaterial,
      );
      scene.add(group);
      cubeGroups.push(group);
    });

    const mouseVector = new THREE.Vector2(0, 0);
    const smoothTargetMouse = new THREE.Vector2(0, 0);

    const onMouseMove = (event: MouseEvent) => {
      const bounds = mount.getBoundingClientRect();
      mouseVector.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouseVector.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    };

    const onCanvasClick = () => {
      cubeGroups.forEach((_, i) => {
        impulseVelocities[i] = 12 + Math.random() * 8;
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    mount.addEventListener("click", onCanvasClick);

    const clock = new THREE.Clock();
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      smoothTargetMouse.lerp(mouseVector, 0.06);

      cubeGroups.forEach((group, i) => {
        const off = i * 0.85;
        group.position.y = Math.sin(t * 0.9 + off) * 0.26;

        if (impulseVelocities[i] > 0) {
          impulseVelocities[i] -= 25 * delta;
          if (impulseVelocities[i] < 0) impulseVelocities[i] = 0;
        }

        const baseSpinVelocity = t * 0.16;
        const currentImpulseRotation = t * (impulseVelocities[i] || 0) * 0.05;
        group.rotation.y = BRICKS[i]!.ry + baseSpinVelocity + currentImpulseRotation + smoothTargetMouse.x * 0.34;
        group.rotation.x = BRICKS[i]!.rx + Math.sin(t * 0.4 + off) * 0.1 + smoothTargetMouse.y * 0.26;
        group.rotation.z = Math.cos(t * 0.3 + off) * 0.08 + smoothTargetMouse.x * 0.15;
      });

      whiteSweepLight.position.x = Math.sin(t * 0.55) * 5;
      whiteSweepLight.position.y = 1.4 + Math.cos(t * 0.42) * 0.8;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight || H;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("click", onCanvasClick);
      mount.innerHTML = "";
      renderer.dispose();
      disposableObjects.forEach((item) => item.dispose());
    };
  }, []);

  return (
    <div className="relative mx-auto h-[400px] w-full max-w-[760px] cursor-pointer overflow-hidden sm:h-[460px] lg:h-[58dvh] lg:max-h-[540px] lg:min-h-[430px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_48%_at_50%_42%,rgba(255,255,255,0.075),transparent_72%)]" />
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}

function createLetterTexture(letter: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0,0,0,0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.shadowColor = "rgba(255,255,255,0.45)";
  context.shadowBlur = 18;
  context.fillStyle = "#f5f5f5";
  context.strokeStyle = "rgba(0,0,0,0.45)";
  context.lineWidth = 12;
  context.font = "900 270px Arial, Helvetica, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.strokeText(letter, 256, 275);
  context.fillText(letter, 256, 275);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
