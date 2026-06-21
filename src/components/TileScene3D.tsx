// Tiny 3D shape used as a hover-reactive ornament on dashboard tiles.
// Each tile picks a shape variant; the scene is intentionally minimal so
// rendering many of them on a page stays cheap.

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

type Variant = 'torus' | 'octa' | 'knot' | 'cube';

function Shape({ variant, color }: { variant: Variant; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * 0.45;
    ref.current.rotation.y = t * 0.55;
  });

  const geom = (() => {
    switch (variant) {
      case 'torus': return <torusGeometry args={[0.85, 0.28, 32, 64]} />;
      case 'knot': return <torusKnotGeometry args={[0.7, 0.22, 120, 16]} />;
      case 'cube': return <boxGeometry args={[1.1, 1.1, 1.1]} />;
      case 'octa':
      default: return <octahedronGeometry args={[1, 0]} />;
    }
  })();

  return (
    <Float speed={2.2} rotationIntensity={0.6} floatIntensity={1.4}>
      <mesh ref={ref} scale={1}>
        {geom}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.85}
          roughness={0.2}
          flatShading={variant === 'octa' || variant === 'cube'}
        />
      </mesh>
    </Float>
  );
}

export default function TileScene3D({ variant = 'octa', color = '#7c3aed' }: { variant?: Variant; color?: string }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.4], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 3]} intensity={2.2} color="#7c3aed" />
        <pointLight position={[-3, -2, -2]} intensity={1.8} color="#22d3ee" />
        <pointLight position={[0, 3, -3]} intensity={1.2} color="#e879f9" />
        <Shape variant={variant} color={color} />
      </Suspense>
    </Canvas>
  );
}