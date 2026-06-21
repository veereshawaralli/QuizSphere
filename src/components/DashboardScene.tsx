// Immersive 3D dashboard hero — a slow-orbiting cluster of crystalline shards,
// a wire-frame globe of knowledge nodes, drifting particles and sparkles. Tuned
// to the Obsidian Neural palette so it sits inside a glass card.

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';

function Shard({ position, color, scale = 0.6 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * 0.3;
    ref.current.rotation.y = t * 0.4;
  });
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={1.4}>
      <mesh ref={ref} position={position} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
          metalness={0.9}
          roughness={0.15}
          flatShading
        />
      </mesh>
    </Float>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.25;
    ref.current.rotation.x = Math.sin(t * 0.3) * 0.2;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={ref} scale={1.35}>
        <icosahedronGeometry args={[1, 6]} />
        <MeshDistortMaterial
          color="#7c3aed"
          emissive="#22d3ee"
          emissiveIntensity={0.35}
          roughness={0.12}
          metalness={0.95}
          distort={0.38}
          speed={1.4}
        />
      </mesh>
    </Float>
  );
}

function Globe() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.12;
  });
  return (
    <mesh ref={ref} scale={2.4}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.18} />
    </mesh>
  );
}

function Nodes() {
  const positions = useMemo(() => {
    const arr = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i += 1) {
      const r = 2.6 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.04;
    ref.current.rotation.x = state.clock.getElapsedTime() * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.028} color="#a78bfa" transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

export default function DashboardScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 48 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <pointLight position={[5, 5, 5]} intensity={2.6} color="#7c3aed" />
        <pointLight position={[-5, -3, -2]} intensity={2.2} color="#22d3ee" />
        <pointLight position={[0, 4, -3]} intensity={1.4} color="#e879f9" />

        <Core />
        <Globe />
        <Nodes />

        <Shard position={[2.4, 1.2, 0]} color="#22d3ee" scale={0.5} />
        <Shard position={[-2.6, -0.6, 0.8]} color="#7c3aed" scale={0.7} />
        <Shard position={[1.4, -1.8, -0.4]} color="#e879f9" scale={0.45} />
        <Shard position={[-1.6, 1.9, -0.6]} color="#a78bfa" scale={0.55} />

        <Sparkles count={120} scale={7} size={2.4} speed={0.5} color="#a78bfa" />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}