"use client";

import React, { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
} from "@react-three/postprocessing";
import * as THREE from "three";

/* ============================================
   Data — KOANO Agent Network
   ============================================ */

interface LeafNode {
  name: string;
}

interface AgentNode {
  name: string;
  color: string;
  description: string;
  leaves: LeafNode[];
}

const AGENTS: AgentNode[] = [
  {
    name: "Market timing",
    color: "#7BACC4",
    description: "Pricing velocity, DOM trends, absorption rates",
    leaves: [
      { name: "Census" },
      { name: "Redfin" },
      { name: "FHFA" },
      { name: "Freddie Mac" },
    ],
  },
  {
    name: "Infrastructure",
    color: "#5A9BBE",
    description: "DOT data, permits, zoning variances, municipal bonds",
    leaves: [
      { name: "Shovels.ai" },
      { name: "DOT data" },
      { name: "Zoneomics" },
      { name: "MSRB" },
    ],
  },
  {
    name: "Demand sentiment",
    color: "#8BB8CC",
    description: "Foot traffic, search trends, review velocity",
    leaves: [
      { name: "Placer.ai" },
      { name: "Walk Score" },
      { name: "Yelp" },
      { name: "Google Places" },
    ],
  },
  {
    name: "Risk & volatility",
    color: "#6AAABE",
    description: "Climate risk, crime data, STR saturation",
    leaves: [
      { name: "First Street" },
      { name: "FBI UCR" },
      { name: "FEMA" },
      { name: "AirDNA" },
    ],
  },
  {
    name: "Regulatory & policy",
    color: "#9BC4D4",
    description: "Zoning, city council decisions, opportunity zones",
    leaves: [
      { name: "Zoneomics" },
      { name: "HUD" },
      { name: "IRS Opp Zones" },
      { name: "Municipode" },
    ],
  },
];

const HUB_COLOR = "#A8C4D4";
const LINE_COLOR = "#D6EBF7";
const LEAF_COLOR = "#FFFFFF";
const LEAF_BORDER_COLOR = "#D6EBF7";
const TEXT_COLOR = "#0D2B3E";

/* ============================================
   Geometry helpers
   ============================================ */

interface PositionedNode {
  position: THREE.Vector3;
  name: string;
  color: string;
  type: "hub" | "agent" | "leaf";
  description?: string;
  agentIndex?: number;
}

interface Edge {
  from: THREE.Vector3;
  to: THREE.Vector3;
}

function buildGraph() {
  const nodes: PositionedNode[] = [];
  const edges: Edge[] = [];

  const hubPos = new THREE.Vector3(0, 0, 0);
  nodes.push({
    position: hubPos,
    name: "Synthesis Agent",
    color: HUB_COLOR,
    type: "hub",
    description: "Receives all 5 agent outputs and issues a unified verdict",
  });

  const agentRadius = 4;
  const leafRadius = 2.2;

  AGENTS.forEach((agent, ai) => {
    const angle = (ai / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
    const agentPos = new THREE.Vector3(
      Math.cos(angle) * agentRadius,
      (Math.random() - 0.5) * 1.6,
      Math.sin(angle) * agentRadius
    );

    nodes.push({
      position: agentPos,
      name: agent.name,
      color: agent.color,
      type: "agent",
      description: agent.description,
      agentIndex: ai,
    });

    edges.push({ from: hubPos, to: agentPos });

    agent.leaves.forEach((leaf, li) => {
      const leafAngle =
        angle + ((li - (agent.leaves.length - 1) / 2) * 0.45);
      const leafPos = new THREE.Vector3(
        agentPos.x + Math.cos(leafAngle) * leafRadius,
        agentPos.y + (li - (agent.leaves.length - 1) / 2) * 0.6,
        agentPos.z + Math.sin(leafAngle) * leafRadius
      );

      nodes.push({
        position: leafPos,
        name: leaf.name,
        color: LEAF_COLOR,
        type: "leaf",
        agentIndex: ai,
      });

      edges.push({ from: agentPos, to: leafPos });
    });
  });

  return { nodes, edges };
}

/* ============================================
   Flowing particles along edges
   ============================================ */

function EdgeParticles({ edges }: { edges: Edge[] }) {
  const particlesPerEdge = 3;
  const count = edges.length * particlesPerEdge;

  const ref = useRef<THREE.Points>(null);

  const { positions, edgeIndices, offsets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const idx: number[] = [];
    const off: number[] = [];

    for (let e = 0; e < edges.length; e++) {
      for (let p = 0; p < particlesPerEdge; p++) {
        const i = e * particlesPerEdge + p;
        const t = p / particlesPerEdge;
        const edge = edges[e];
        pos[i * 3] = edge.from.x + (edge.to.x - edge.from.x) * t;
        pos[i * 3 + 1] = edge.from.y + (edge.to.y - edge.from.y) * t;
        pos[i * 3 + 2] = edge.from.z + (edge.to.z - edge.from.z) * t;
        idx.push(e);
        off.push(t);
      }
    }

    return { positions: pos, edgeIndices: idx, offsets: off };
  }, [edges, count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const time = clock.getElapsedTime();
    const speed = 0.3;

    for (let i = 0; i < count; i++) {
      const ei = edgeIndices[i];
      const edge = edges[ei];
      const t = ((offsets[i] + time * speed) % 1 + 1) % 1;
      arr[i * 3] = edge.from.x + (edge.to.x - edge.from.x) * t;
      arr[i * 3 + 1] = edge.from.y + (edge.to.y - edge.from.y) * t;
      arr[i * 3 + 2] = edge.from.z + (edge.to.z - edge.from.z) * t;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={HUB_COLOR}
        size={0.06}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ============================================
   Connection lines
   ============================================ */

function ConnectionLines({ edges }: { edges: Edge[] }) {
  const lineGeometry = useMemo(() => {
    const points: number[] = [];
    edges.forEach((edge) => {
      points.push(edge.from.x, edge.from.y, edge.from.z);
      points.push(edge.to.x, edge.to.y, edge.to.z);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geo;
  }, [edges]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial
        color={LINE_COLOR}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/* ============================================
   Node sphere with hover
   ============================================ */

function NodeSphere({
  node,
  onHover,
  onUnhover,
}: {
  node: PositionedNode;
  onHover: (node: PositionedNode, screenPos: { x: number; y: number }) => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();

  const radius =
    node.type === "hub" ? 0.35 : node.type === "agent" ? 0.22 : 0.12;

  const handlePointerOver = useCallback(() => {
    if (!meshRef.current) return;
    document.body.style.cursor = "pointer";
    const pos = node.position.clone().project(camera);
    const x = ((pos.x + 1) / 2) * size.width;
    const y = ((-pos.y + 1) / 2) * size.height;
    onHover(node, { x, y });
  }, [node, camera, size, onHover]);

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = "auto";
    onUnhover();
  }, [onUnhover]);

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[radius, 24, 24]} />
      {node.type === "leaf" ? (
        <meshStandardMaterial
          color={LEAF_COLOR}
          emissive={LEAF_BORDER_COLOR}
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.1}
        />
      ) : (
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={node.type === "hub" ? 0.5 : 0.3}
          roughness={0.3}
          metalness={0.2}
        />
      )}
    </mesh>
  );
}

/* ============================================
   Node labels (Drei <Text>)
   ============================================ */

function NodeLabel({ node }: { node: PositionedNode }) {
  if (node.type === "leaf") return null;

  const yOffset = node.type === "hub" ? 0.55 : 0.38;

  return (
    <Text
      position={[node.position.x, node.position.y + yOffset, node.position.z]}
      fontSize={node.type === "hub" ? 0.18 : 0.14}
      color={TEXT_COLOR}
      anchorX="center"
      anchorY="bottom"
      font="https://api.fontshare.com/v2/css?f[]=neue-montreal@500&display=swap"
      outlineWidth={0.015}
      outlineColor="#F0F7FC"
    >
      {node.name}
    </Text>
  );
}

/* ============================================
   Auto-rotate wrapper
   ============================================ */

function AutoRotateGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

/* ============================================
   Scene
   ============================================ */

function NeuralMapScene({
  onHover,
  onUnhover,
}: {
  onHover: (node: PositionedNode, screenPos: { x: number; y: number }) => void;
  onUnhover: () => void;
}) {
  const { nodes, edges } = useMemo(() => buildGraph(), []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-3, -2, -4]} intensity={0.3} />

      <AutoRotateGroup>
        <ConnectionLines edges={edges} />
        <EdgeParticles edges={edges} />

        {nodes.map((node, i) => (
          <NodeSphere
            key={`${node.name}-${i}`}
            node={node}
            onHover={onHover}
            onUnhover={onUnhover}
          />
        ))}

        {nodes.map((node, i) => (
          <NodeLabel key={`label-${node.name}-${i}`} node={node} />
        ))}
      </AutoRotateGroup>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={16}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
      />

      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

/* ============================================
   Tooltip overlay
   ============================================ */

function Tooltip({
  node,
  position,
}: {
  node: PositionedNode | null;
  position: { x: number; y: number };
}) {
  if (!node) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -120%)",
        pointerEvents: "none",
        zIndex: 10,
        background: "rgba(255, 255, 255, 0.95)",
        border: "1px solid #D6EBF7",
        borderRadius: "12px",
        padding: "10px 14px",
        maxWidth: "220px",
        boxShadow: "0 4px 16px rgba(168, 196, 212, 0.15)",
      }}
    >
      <p
        style={{
          fontFamily: "'Neue Montreal', sans-serif",
          fontSize: "13px",
          fontWeight: 500,
          color: "#0D2B3E",
          marginBottom: node.description ? "4px" : 0,
          lineHeight: 1.3,
        }}
      >
        {node.name}
      </p>
      {node.description && (
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#5A7A8C",
            letterSpacing: "0.04em",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {node.description}
        </p>
      )}
    </div>
  );
}

/* ============================================
   Main NeuralMap component
   ============================================ */

interface NeuralMapProps {
  className?: string;
  style?: React.CSSProperties;
  height?: string | number;
}

export default function NeuralMap({
  className = "",
  style,
  height = 600,
}: NeuralMapProps) {
  const [hoveredNode, setHoveredNode] = useState<PositionedNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleHover = useCallback(
    (node: PositionedNode, screenPos: { x: number; y: number }) => {
      setHoveredNode(node);
      setTooltipPos(screenPos);
    },
    []
  );

  const handleUnhover = useCallback(() => {
    setHoveredNode(null);
  }, []);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height,
        background: "transparent",
        borderRadius: "20px",
        overflow: "hidden",
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 3, 9], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: "transparent" }}
      >
        <NeuralMapScene onHover={handleHover} onUnhover={handleUnhover} />
      </Canvas>

      <Tooltip node={hoveredNode} position={tooltipPos} />

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          pointerEvents: "none",
        }}
      >
        {[
          { color: HUB_COLOR, label: "Synthesis agent" },
          { color: "#6AAABE", label: "Specialist agents (5)" },
          { color: LEAF_COLOR, label: "Data sources" },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: item.color,
                border:
                  item.color === LEAF_COLOR
                    ? `1px solid ${LEAF_BORDER_COLOR}`
                    : "none",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "10px",
                color: "#5A7A8C",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
