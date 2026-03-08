import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

/* ── Types ── */
export interface GraphNode {
  id: string;
  label: string;
  status: string;
  reputation?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "subscription" | "absorption" | "transaction";
  weight: number;
}

interface ForceGraph3DProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  onNodeClick?: (nodeId: string) => void;
}

/* ── Constants ── */
const STATUS_COLORS: Record<string, number> = {
  online: 0x22c55e,
  busy: 0xf59e0b,
  offline: 0x6b7280,
};

const EDGE_COLORS: Record<string, number> = {
  subscription: 0x3b82f6,
  absorption: 0xa855f7,
  transaction: 0xf97316,
};

const GLOW_COLORS: Record<string, number> = {
  online: 0x22c55e,
  busy: 0xf59e0b,
  offline: 0x9ca3af,
};

/* ── Internal sim node ── */
interface SimNode {
  id: string;
  label: string;
  status: string;
  reputation: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  labelSprite: THREE.Sprite;
  baseY: number;
  hovered: boolean;
}

interface SimEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  line: THREE.Line;
  dot: THREE.Mesh;
  dotProgress: number;
  dotSpeed: number;
}

/* ── Component ── */
const ForceGraph3D = ({ nodes, edges, width, height, onNodeClick }: ForceGraph3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<SimEdge[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef(new THREE.Vector2(9999, 9999));
  const raycasterRef = useRef(new THREE.Raycaster());
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0, phi: Math.PI / 6 });
  const cameraDistRef = useRef(280);
  const autoRotateRef = useRef(true);
  const clockRef = useRef(new THREE.Clock());

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    // Cleanup
    if (rendererRef.current) {
      rendererRef.current.dispose();
      containerRef.current.innerHTML = "";
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);
    scene.fog = new THREE.Fog(0xfafafa, 400, 600);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(100, 200, 150);
    scene.add(directional);

    // Create nodes
    const simNodes: SimNode[] = [];
    const nodeMap = new Map<string, SimNode>();

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const rep = n.reputation ?? 60;
      const radius = 4 + (rep / 100) * 8;
      const angle = (i / nodes.length) * Math.PI * 2;
      const spread = 60 + Math.random() * 40;
      const x = Math.cos(angle) * spread;
      const z = Math.sin(angle) * spread;
      const y = (Math.random() - 0.5) * 40;

      // Main sphere
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: STATUS_COLORS[n.status] ?? 0x6b7280,
        emissive: STATUS_COLORS[n.status] ?? 0x6b7280,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.userData = { nodeId: n.id };
      scene.add(mesh);

      // Glow sphere
      const glowGeo = new THREE.SphereGeometry(radius * 1.6, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: GLOW_COLORS[n.status] ?? 0x9ca3af,
        transparent: true,
        opacity: 0.12,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(mesh.position);
      scene.add(glow);

      // Label
      const labelSprite = makeTextSprite(n.label);
      labelSprite.position.set(x, y + radius + 6, z);
      scene.add(labelSprite);

      const simNode: SimNode = {
        id: n.id,
        label: n.label,
        status: n.status,
        reputation: rep,
        x, y, z,
        vx: 0, vy: 0, vz: 0,
        mesh, glow, labelSprite,
        baseY: y,
        hovered: false,
      };
      simNodes.push(simNode);
      nodeMap.set(n.id, simNode);
    }

    simNodesRef.current = simNodes;

    // Create edges
    const simEdges: SimEdge[] = [];

    for (const e of edges) {
      const sn = nodeMap.get(e.source);
      const tn = nodeMap.get(e.target);
      if (!sn || !tn) continue;

      const points = [
        new THREE.Vector3(sn.x, sn.y, sn.z),
        new THREE.Vector3(tn.x, tn.y, tn.z),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: EDGE_COLORS[e.type] ?? 0xd1d5db,
        transparent: true,
        opacity: 0.25 + e.weight * 0.25,
        linewidth: 1,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Traveling dot
      const dotGeo = new THREE.SphereGeometry(1.5, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({
        color: EDGE_COLORS[e.type] ?? 0xd1d5db,
        transparent: true,
        opacity: 0.8,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(points[0]);
      scene.add(dot);

      simEdges.push({
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight,
        line,
        dot,
        dotProgress: Math.random(),
        dotSpeed: 0.003 + Math.random() * 0.005,
      });
    }

    simEdgesRef.current = simEdges;
  }, [nodes, edges, width, height]);

  // Physics + render loop
  const animate = useCallback(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    const dt = Math.min(clockRef.current.getDelta(), 0.05);
    const time = clockRef.current.getElapsedTime();
    const sns = simNodesRef.current;
    const ses = simEdgesRef.current;
    const nodeMap = new Map(sns.map((n) => [n.id, n]));

    // ── Physics ──

    // Repulsion
    for (let i = 0; i < sns.length; i++) {
      for (let j = i + 1; j < sns.length; j++) {
        const dx = sns[j].x - sns[i].x;
        const dy = sns[j].y - sns[i].y;
        const dz = sns[j].z - sns[i].z;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz));
        const force = 2000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;
        sns[i].vx -= fx; sns[i].vy -= fy; sns[i].vz -= fz;
        sns[j].vx += fx; sns[j].vy += fy; sns[j].vz += fz;
      }
    }

    // Spring attraction along edges
    for (const e of ses) {
      const s = nodeMap.get(e.source);
      const t = nodeMap.get(e.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dz = t.z - s.z;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz));
      const force = (dist - 80) * 0.003 * e.weight;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;
      s.vx += fx; s.vy += fy; s.vz += fz;
      t.vx -= fx; t.vy -= fy; t.vz -= fz;
    }

    // Center gravity + damping
    for (const n of sns) {
      n.vx += -n.x * 0.001;
      n.vy += -n.y * 0.001;
      n.vz += -n.z * 0.001;
      n.vx *= 0.88;
      n.vy *= 0.88;
      n.vz *= 0.88;
      n.x += n.vx;
      n.y += n.vy;
      n.z += n.vz;

      // Breathing pulse
      const rep = n.reputation;
      const radius = 4 + (rep / 100) * 8;
      const pulse = 1 + Math.sin(time * 1.5 + n.x * 0.1) * 0.06;
      n.mesh.scale.setScalar(pulse);

      // Hover lift
      const targetY = n.hovered ? n.y + 8 : n.y;
      const currentY = n.mesh.position.y;
      const lerpedY = currentY + (targetY - currentY) * 0.1;

      n.mesh.position.set(n.x, lerpedY, n.z);
      n.glow.position.copy(n.mesh.position);
      n.glow.scale.setScalar(pulse * 1.1);

      // Glow pulse
      const glowMat = n.glow.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.08 + Math.sin(time * 2 + n.z * 0.1) * 0.06;

      n.labelSprite.position.set(n.x, lerpedY + radius * pulse + 6, n.z);
    }

    // Update edges
    for (const e of ses) {
      const s = nodeMap.get(e.source);
      const t = nodeMap.get(e.target);
      if (!s || !t) continue;

      const positions = e.line.geometry.attributes.position as THREE.BufferAttribute;
      positions.setXYZ(0, s.mesh.position.x, s.mesh.position.y, s.mesh.position.z);
      positions.setXYZ(1, t.mesh.position.x, t.mesh.position.y, t.mesh.position.z);
      positions.needsUpdate = true;

      // Traveling dot
      e.dotProgress += e.dotSpeed;
      if (e.dotProgress > 1) e.dotProgress -= 1;
      const p = e.dotProgress;
      e.dot.position.set(
        s.mesh.position.x + (t.mesh.position.x - s.mesh.position.x) * p,
        s.mesh.position.y + (t.mesh.position.y - s.mesh.position.y) * p,
        s.mesh.position.z + (t.mesh.position.z - s.mesh.position.z) * p,
      );
      // Pulse the dot
      const dotScale = 0.8 + Math.sin(p * Math.PI) * 0.5;
      e.dot.scale.setScalar(dotScale);
    }

    // ── Camera ──
    if (autoRotateRef.current && !isDraggingRef.current) {
      cameraAngleRef.current.theta += 0.002;
    }
    const { theta, phi } = cameraAngleRef.current;
    const dist = cameraDistRef.current;
    camera.position.set(
      dist * Math.sin(theta) * Math.cos(phi),
      dist * Math.sin(phi),
      dist * Math.cos(theta) * Math.cos(phi),
    );
    camera.lookAt(0, 0, 0);

    // ── Raycast for hover ──
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const meshes = sns.map((n) => n.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes);
    for (const n of sns) {
      n.hovered = false;
    }
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const nodeId = hit.userData?.nodeId;
      const sn = nodeMap.get(nodeId);
      if (sn) sn.hovered = true;
    }

    renderer.render(scene, camera);
    animRef.current = requestAnimationFrame(animate);
  }, []);

  // Init
  useEffect(() => {
    clockRef.current.start();
    initScene();
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [initScene, animate]);

  // Resize
  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (renderer && camera) {
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }, [width, height]);

  // Mouse events
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDraggingRef.current) {
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      cameraAngleRef.current.theta -= dx * 0.005;
      cameraAngleRef.current.phi = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, cameraAngleRef.current.phi + dy * 0.005)
      );
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    autoRotateRef.current = false;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    // Resume auto-rotate after 3 seconds
    setTimeout(() => { autoRotateRef.current = true; }, 3000);
  }, []);

  const onClick = useCallback((e: React.MouseEvent) => {
    if (!onNodeClick || !cameraRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const meshes = simNodesRef.current.map((n) => n.mesh);
    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      const nodeId = intersects[0].object.userData?.nodeId;
      if (nodeId) onNodeClick(nodeId);
    }
  }, [onNodeClick]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    cameraDistRef.current = Math.max(100, Math.min(500, cameraDistRef.current + e.deltaY * 0.3));
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width, height, cursor: "grab", borderRadius: "0 0 8px 8px", overflow: "hidden" }}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={onClick}
      onWheel={onWheel}
    />
  );
};

/* ── Text Sprite Helper ── */
function makeTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 256;
  canvas.height = 64;
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "bold 24px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#374151";
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(32, 8, 1);
  return sprite;
}

export default ForceGraph3D;
