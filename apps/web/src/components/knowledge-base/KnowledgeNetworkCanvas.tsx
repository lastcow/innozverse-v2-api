'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function generateNodes(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * (0.3 + Math.random() * 0.7)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

function generateEdges(
  positions: Float32Array,
  nodeCount: number,
  maxEdges: number,
  maxDist: number
) {
  const edges: number[] = []
  for (let i = 0; i < nodeCount && edges.length / 6 < maxEdges; i++) {
    for (let j = i + 1; j < nodeCount && edges.length / 6 < maxEdges; j++) {
      const dx = positions[i * 3]! - positions[j * 3]!
      const dy = positions[i * 3 + 1]! - positions[j * 3 + 1]!
      const dz = positions[i * 3 + 2]! - positions[j * 3 + 2]!
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < maxDist) {
        edges.push(
          positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!,
          positions[j * 3]!, positions[j * 3 + 1]!, positions[j * 3 + 2]!
        )
      }
    }
  }
  return new Float32Array(edges)
}

function Network() {
  const groupRef = useRef<THREE.Group>(null)

  const { nodePositions, linePositions } = useMemo(() => {
    const np = generateNodes(80, 5)
    const lp = generateEdges(np, 80, 100, 2.5)
    return { nodePositions: np, linePositions: lp }
  }, [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.05 * delta
      groupRef.current.rotation.x += 0.02 * delta
    }
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nodePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#93C5FD"
          size={0.06}
          sizeAttenuation
          transparent
          opacity={0.9}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#93C5FD" transparent opacity={0.15} />
      </lineSegments>
    </group>
  )
}

export function KnowledgeNetworkCanvas() {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 65 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Network />
    </Canvas>
  )
}
