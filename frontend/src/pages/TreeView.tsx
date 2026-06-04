import React, { useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  EdgeProps,
  getStraightPath,
  BaseEdge,
  ReactFlowProvider,
  useReactFlow,
  useNodesInitialized,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePersons } from '../hooks/usePersons';
import { useTrees } from '../hooks/useTrees';
import DecompressedImage from '../components/DecompressedImage';
import { Plus, ArrowLeft, Calendar, ZoomIn, ZoomOut, Move, Maximize2, Flame } from 'lucide-react';
import { Person } from '../types';

// ─── Person Node ─────────────────────────────────────────────────────────────
const hiddenHandleStyle = {
  width: 6,
  height: 6,
  border: 0,
  opacity: 0,
  background: 'transparent',
  pointerEvents: 'none' as const,
};

const getYear = (date?: string) => {
  if (!date) return '?';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? '?' : String(year);
};

const getCompactName = (person: Person) => {
  const firstName = person.firstName?.trim() || 'Family';
  const lastInitial = person.lastName?.trim()?.charAt(0);
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
};

const PersonNode = ({ data }: NodeProps<Person>) => {
  const navigate = useNavigate();
  const isPublic = window.location.pathname.startsWith('/public-trees');
  const years = `${getYear(data.birthDate)}${data.deathDate ? ` - ${getYear(data.deathDate)}` : ''}`;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        navigate(
          isPublic
            ? `/public-trees/${data.treeId}/persons/${data.id}`
            : `/trees/${data.treeId}/persons/${data.id}`
        );
      }}
      className="group relative w-[112px] cursor-pointer rounded-lg bg-white px-2 py-2 text-center shadow-[0_8px_20px_rgba(35,51,38,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#94b9a4] hover:shadow-[0_12px_26px_rgba(35,51,38,0.14)] nodrag nopan"
      style={{ border: '1px solid #d7dfd4', pointerEvents: 'auto' }}
    >
      <Handle
        id="lineage-top"
        type="target"
        position={Position.Top}
        style={hiddenHandleStyle}
      />
      <Handle id="spouse-left-target" type="target" position={Position.Left} style={hiddenHandleStyle} />
      <Handle id="spouse-right-target" type="target" position={Position.Right} style={hiddenHandleStyle} />
      <Handle id="spouse-left-source" type="source" position={Position.Left} style={hiddenHandleStyle} />
      <Handle id="spouse-right-source" type="source" position={Position.Right} style={hiddenHandleStyle} />

      <div
        className={`mx-auto h-10 w-10 overflow-hidden rounded-md transition-transform duration-200 group-hover:scale-[1.03] ${data.deathDate ? 'grayscale opacity-75' : ''}`}
        style={{ background: '#f1eee8', border: '1px solid #dfe4db' }}
      >
        <DecompressedImage
          photoUrl={data.photoUrl}
          fallbackIconSize={18}
          className="h-full w-full object-cover"
        />
      </div>

      <div
        className="mt-1.5 truncate text-[10px] font-bold leading-none flex items-center justify-center gap-0.5"
        style={{ color: '#22332a' }}
        title={`${data.firstName} ${data.lastName}`.trim()}
      >
        <span className="truncate">{getCompactName(data)}</span>
        {data.deathDate && (
          <span title="Deceased" className="flex shrink-0">
            <Flame size={9} className="text-amber-600 fill-amber-300" />
          </span>
        )}
      </div>
      <div
        className="mt-1 flex items-center justify-center gap-1 text-[7px] font-medium leading-none"
        style={{ color: '#6f756b' }}
      >
        <Calendar size={8} strokeWidth={2} />
        <span className="truncate">{years}</span>
      </div>

      <Handle
        id="lineage-bottom"
        type="source"
        position={Position.Bottom}
        style={hiddenHandleStyle}
      />
    </div>
  );
};

// ─── Spouse Edge (dashed horizontal) ─────────────────────────────────────────
const SpouseEdge = ({ sourceX, sourceY, targetX, targetY }: EdgeProps) => {
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return (
    <BaseEdge
      path={path}
      style={{ stroke: '#73a489', strokeWidth: 1.4, strokeDasharray: '3,3' }}
    />
  );
};

// ─── Parent→Children "T-bar" Edge ────────────────────────────────────────────
const ParentChildEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps & { data?: { midX?: number } }) => {
  const midX = data?.midX ?? sourceX;
  const dropY = sourceY + 78;

  const d = `
    M ${midX} ${sourceY}
    L ${midX} ${dropY}
    L ${targetX} ${dropY}
    L ${targetX} ${targetY}
  `;

  return <path d={d} fill="none" stroke="#3f9372" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />;
};

const nodeTypes = { person: PersonNode };
const edgeTypes = { spouse: SpouseEdge, parentChild: ParentChildEdge };

// ─── Layout Calculator with Fixed Grid ───────────────────────────────────────
const NODE_W = 112;
const NODE_H = 82;
const H_GAP = 72;
const V_GAP = 136;
const LAYOUT_PADDING_X = 128;
const LAYOUT_PADDING_TOP = 128;
const TREE_FIT_VIEW_OPTIONS = { padding: 0.35, duration: 500 };

function buildLayout(persons: Person[]): { nodes: Node[]; edges: Edge[] } {
  if (!persons.length) return { nodes: [], edges: [] };

  const personMap: Record<number, Person> = {};
  persons.forEach((p) => (personMap[p.id] = p));

  // Find SPOUSE pairs
  const spousePairs: [number, number][] = [];
  const spouseSet = new Set<string>();
  persons.forEach((p) => {
    p.relationships.forEach((rel) => {
      if (rel.type === 'SPOUSE') {
        const key = [p.id, rel.relatedPersonId].sort((a, b) => a - b).join('-');
        if (!spouseSet.has(key)) {
          spouseSet.add(key);
          spousePairs.push([
            Math.min(p.id, rel.relatedPersonId),
            Math.max(p.id, rel.relatedPersonId),
          ]);
        }
      }
    });
  });

  // Build parent→children map
  const childrenOf: Record<number, number[]> = {};
  const hasParent = new Set<number>();
  persons.forEach((p) => {
    p.relationships.forEach((rel) => {
      if (rel.type === 'PARENT') {
        if (!childrenOf[p.id]) childrenOf[p.id] = [];
        if (!childrenOf[p.id].includes(rel.relatedPersonId)) {
          childrenOf[p.id].push(rel.relatedPersonId);
        }
        hasParent.add(rel.relatedPersonId);
      }
    });
  });

  // BFS generations
  const roots = persons.filter((p) => !hasParent.has(p.id)).map((p) => p.id);
  const generation: Record<number, number> = {};
  const bfsQueue = [...roots];
  roots.forEach((id) => (generation[id] = 0));
  while (bfsQueue.length) {
    const cur = bfsQueue.shift()!;
    (childrenOf[cur] || []).forEach((childId) => {
      if (generation[childId] === undefined) {
        generation[childId] = generation[cur] + 1;
        bfsQueue.push(childId);
      }
    });
  }
  persons.forEach((p) => {
    if (generation[p.id] === undefined) generation[p.id] = 0;
  });

  // Align spouse generations to ensure they are rendered on the same line/level
  for (let step = 0; step < 3; step++) {
    persons.forEach((p) => {
      const spouseRel = p.relationships.find((r) => r.type === 'SPOUSE');
      if (spouseRel) {
        const spouseId = spouseRel.relatedPersonId;
        const genP = generation[p.id];
        const genSpouse = generation[spouseId];
        if (genP !== undefined && genSpouse !== undefined && genP !== genSpouse) {
          const targetGen = Math.max(genP, genSpouse);
          generation[p.id] = targetGen;
          generation[spouseId] = targetGen;
        }
      }
    });
  }

  // Group by generation
  const byGen: Record<number, number[]> = {};
  persons.forEach((p) => {
    const g = generation[p.id];
    if (!byGen[g]) byGen[g] = [];
    byGen[g].push(p.id);
  });

  // Sort within generations to keep spouses next to each other
  Object.keys(byGen).forEach((genKey) => {
    const gen = Number(genKey);
    const ids = byGen[gen];
    const visited = new Set<number>();
    const orderedIds: number[] = [];

    // First sort alphabetically to have a stable, alphabetical baseline
    ids.sort((a, b) => {
      const personA = personMap[a];
      const personB = personMap[b];
      const nameA = `${personA?.lastName || ''} ${personA?.firstName || ''}`;
      const nameB = `${personB?.lastName || ''} ${personB?.firstName || ''}`;
      return nameA.localeCompare(nameB);
    });

    ids.forEach((id) => {
      if (visited.has(id)) return;

      const person = personMap[id];
      const spouseRel = person?.relationships?.find((r) => r.type === 'SPOUSE');
      const spouseId = spouseRel?.relatedPersonId;

      if (spouseId !== undefined && ids.includes(spouseId) && !visited.has(spouseId)) {
        visited.add(id);
        visited.add(spouseId);
        
        // Put male on left if available, otherwise original order
        if (person?.gender === 'MALE') {
          orderedIds.push(id, spouseId);
        } else {
          const spousePerson = personMap[spouseId];
          if (spousePerson?.gender === 'MALE') {
            orderedIds.push(spouseId, id);
          } else {
            orderedIds.push(id, spouseId);
          }
        }
      } else {
        visited.add(id);
        orderedIds.push(id);
      }
    });

    byGen[gen] = orderedIds;
  });

  // Position nodes with stable coordinates
  const posX: Record<number, number> = {};
  const posY: Record<number, number> = {};

  Object.entries(byGen).forEach(([genStr, ids]) => {
    const gen = Number(genStr);
    const total = ids.length * NODE_W + (ids.length - 1) * H_GAP;
    const startX = -total / 2;
    ids.forEach((id, i) => {
      posX[id] = startX + i * (NODE_W + H_GAP);
      posY[id] = gen * (NODE_H + V_GAP);
    });
  });

  const minX = Math.min(...Object.values(posX));
  Object.keys(posX).forEach((id) => {
    const personId = Number(id);
    posX[personId] = posX[personId] - minX + LAYOUT_PADDING_X;
    posY[personId] = posY[personId] + LAYOUT_PADDING_TOP;
  });

  const nodes: Node[] = persons.map((p) => ({
    id: p.id.toString(),
    type: 'person',
    data: p,
    position: { x: posX[p.id] ?? 0, y: posY[p.id] ?? 0 },
    draggable: false, // Disable node dragging to prevent layout shifting
    selectable: false, // Disable selection to prevent accidental movements
  }));

  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  // Spouse edges
  spousePairs.forEach(([a, b]) => {
    const sourceIsLeft = (posX[a] ?? 0) <= (posX[b] ?? 0);
    edges.push({
      id: `spouse-${a}-${b}`,
      source: a.toString(),
      target: b.toString(),
      type: 'spouse',
      sourceHandle: sourceIsLeft ? 'spouse-right-source' : 'spouse-left-source',
      targetHandle: sourceIsLeft ? 'spouse-left-target' : 'spouse-right-target',
    });
  });

  // Parent→child edges
  persons.forEach((p) => {
    const children = childrenOf[p.id] || [];
    if (!children.length) return;

    const spouseRel = p.relationships.find((r) => r.type === 'SPOUSE');
    const spouseId = spouseRel?.relatedPersonId;
    const spouseX = spouseId !== undefined ? posX[spouseId] : undefined;

    const parentCenterX = (posX[p.id] ?? 0) + NODE_W / 2;
    const midX =
      spouseX !== undefined
        ? (parentCenterX + spouseX + NODE_W / 2) / 2
        : parentCenterX;

    children.forEach((childId) => {
      const edgeId = `parentChild-${p.id}-${childId}`;
      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);
        edges.push({
          id: edgeId,
          source: p.id.toString(),
          target: childId.toString(),
          type: 'parentChild',
          sourceHandle: 'lineage-bottom',
          targetHandle: 'lineage-top',
          data: { midX },
        });
      }
    });
  });

  return { nodes, edges };
}

// ─── Flow Controls Component ─────────────────────────────────────────────────
const FlowControls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleReset = () => {
    fitView(TREE_FIT_VIEW_OPTIONS);
  };

  return (
    <Panel position="bottom-right" className="flex gap-2">
      <div className="flex rounded-lg bg-white shadow-lg" style={{ border: '1px solid #e8e0d0' }}>
        <button
          onClick={() => zoomOut({ duration: 300 })}
          className="p-2.5 hover:bg-gray-50 rounded-l-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={() => fitView(TREE_FIT_VIEW_OPTIONS)}
          className="p-2.5 hover:bg-gray-50 transition-colors border-x"
          style={{ borderColor: '#e8e0d0' }}
          title="Fit View"
        >
          <Maximize2 size={18} />
        </button>
        <button
          onClick={() => zoomIn({ duration: 300 })}
          className="p-2.5 hover:bg-gray-50 rounded-r-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
      </div>
      <button
        onClick={handleReset}
        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 shadow-lg hover:bg-gray-50 transition-colors"
        style={{ border: '1px solid #e8e0d0' }}
        title="Reset View"
      >
        <Move size={16} />
        <span className="text-sm font-medium">Reset</span>
      </button>
    </Panel>
  );
};

// ─── Main Flow Component (wrapped with ReactFlowProvider) ────────────────────
const TreeFlow = ({ treeId, isPublic }: { treeId: number; isPublic: boolean }) => {
  const { useList: usePersonsList } = usePersons(Number(treeId));
  const { data: persons, isLoading } = usePersonsList(isPublic);
  const isInitialFitDone = useRef(false);
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  const { nodes, edges } = useMemo(() => {
    if (!persons) return { nodes: [], edges: [] };
    return buildLayout(persons);
  }, [persons]);

  useEffect(() => {
    isInitialFitDone.current = false;
  }, [treeId]);

  useEffect(() => {
    if (!isLoading && nodesInitialized && nodes.length > 0 && !isInitialFitDone.current) {
      const frame = window.requestAnimationFrame(() => {
        fitView({ ...TREE_FIT_VIEW_OPTIONS, duration: 600 });
        isInitialFitDone.current = true;
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [fitView, isLoading, nodes.length, nodesInitialized]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center space-y-4">
        <div
          className="h-10 w-10 animate-spin rounded-full"
          style={{ border: '3px solid #e8e0d0', borderTopColor: '#2d6a4f' }}
        />
        <p className="font-medium" style={{ color: '#a09080' }}>
          Loading family canvas...
        </p>
      </div>
    );
  }

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={false}
        minZoom={0.3}
        maxZoom={2}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        zoomOnDoubleClick={false}
        preventScrolling={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        className="h-full w-full"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d8cfbc" gap={18} size={1} />
        <FlowControls />
      </ReactFlow>

      {/* Instruction tooltip */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
          <span>🖱️ Drag to pan</span>
          <span className="w-1 h-1 bg-white/40 rounded-full" />
          <span>🔍 Scroll to zoom</span>
        </div>
      </div>
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const TreeView: React.FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const isPublic = window.location.pathname.startsWith('/public-trees');

  const { useGet: useTreeGet } = useTrees();
  const { data: tree } = useTreeGet(Number(treeId), isPublic);

  if (!treeId) {
    return <div>Invalid tree ID</div>;
  }

  return (
    <div
      className="relative h-[calc(100vh-64px)] bg-[#f7f4ef] md:h-screen overflow-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Toolbar */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-4 pointer-events-auto">
        <button
          onClick={() => navigate(isPublic ? '/' : '/dashboard')}
          className="cursor-pointer rounded-xl bg-white p-3 shadow-md transition-all hover:shadow-lg"
          style={{ border: '1px solid #e8e0d0', color: '#5a4a3a' }}
          title={isPublic ? 'Back to Home' : 'Back to Dashboard'}
        >
          <ArrowLeft size={18} />
        </button>
        <div
          className="rounded-xl bg-white/90 px-5 py-3 shadow-md backdrop-blur-md"
          style={{ border: '1px solid #e8e0d0' }}
        >
          <h1
            className="text-lg font-bold leading-none"
            style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {tree?.name || 'Family Tree'}
          </h1>
          <p
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: '#a09080' }}
          >
            Interactive Family Graph
          </p>
        </div>
      </div>

      {/* Add Person */}
      {!isPublic && (
        <div className="absolute top-6 right-6 z-10 pointer-events-auto">
          <Link
            to={`/trees/${treeId}/persons/new`}
            className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: '#1a3a2a' }}
          >
            <Plus size={18} />
            <span>Add Person</span>
          </Link>
        </div>
      )}

      <ReactFlowProvider>
        <TreeFlow treeId={Number(treeId)} isPublic={isPublic} />
      </ReactFlowProvider>
    </div>
  );
};

export default TreeView;
