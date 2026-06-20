// Neural 3D hero — animated distorted icosahedron core surrounded by an orbiting
// wire torus knot and floating particles. Uses Three.js via react-three-fiber.
// Tuned for the Obsidian Neural palette (violet → cyan aurora).

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function Core() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = t * 0.15;
    mesh.current.rotation.y = t * 0.22;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={mesh} scale={1.55}>
        <icosahedronGeometry args={[1, 12]} />
        <MeshDistortMaterial
          color="#7c3aed"
          emissive="#22d3ee"
          emissiveIntensity={0.35}
          roughness={0.15}
          metalness={0.85}
          distort={0.42}
          speed={1.6}
        />
      </mesh>
    </Float>
  );
}

function WireKnot() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * 0.18;
    ref.current.rotation.z = t * 0.12;
  });
  return (
    <mesh ref={ref} scale={2.6}>
      <torusKnotGeometry args={[1, 0.018, 220, 16, 2, 3]} />
      <meshBasicMaterial color="#e879f9" transparent opacity={0.55} />
    </mesh>
  );
}

function Particles() {
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i += 1) {
      const r = 3 + Math.random() * 2.5;
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
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.022} color="#22d3ee" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function NeuralScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <pointLight position={[5, 5, 5]} intensity={2.4} color="#7c3aed" />
        <pointLight position={[-5, -3, -2]} intensity={2.0} color="#22d3ee" />
        <pointLight position={[0, 4, -3]} intensity={1.2} color="#e879f9" />
        <Core />
        <WireKnot />
        <Particles />
        <Sparkles count={80} scale={6} size={2} speed={0.4} color="#a78bfa" />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}