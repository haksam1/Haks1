import React, { useMemo, useRef, useEffect, useState } from 'react';
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
  useViewport,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePersons } from '../hooks/usePersons';
import { useTrees } from '../hooks/useTrees';
import DecompressedImage from '../components/DecompressedImage';
import {
  Plus,
  ArrowLeft,
  Calendar,
  ZoomIn,
  ZoomOut,
  Flame,
  Compass,
  Target,
  RotateCcw,
  Search as SearchIcon,
  X,
} from 'lucide-react';
import { Person } from '../types';

// ─── Custom Types ────────────────────────────────────────────────────────────
type PersonNodeData = Person & {
  isSelected?: boolean;
  isHighlighted?: boolean;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelect?: () => void;
  onDoubleClick?: () => void;
};

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

const PersonNode = ({ data }: NodeProps<PersonNodeData>) => {
  const { zoom } = useViewport();
  const years = `${getYear(data.birthDate)}${data.deathDate ? ` - ${getYear(data.deathDate)}` : ''}`;

  // Level of detail determined by zoom level
  let detailLevel: 'low' | 'med' | 'high' = 'high';
  if (zoom < 0.65) {
    detailLevel = 'low';
  } else if (zoom < 1.1) {
    detailLevel = 'med';
  }

  // Highlight and selection classes
  const isSelected = data.isSelected;
  const isHighlighted = data.isHighlighted;

  const highlightClass = isHighlighted
    ? 'node-highlight-flash ring-4 ring-[#2d6a4f] ring-offset-2 scale-105'
    : isSelected
    ? 'border-[#2d6a4f] border-2 shadow-[0_0_15px_rgba(45,106,79,0.35)] scale-102'
    : 'border-[#d7dfd4]';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (data.onSelect) data.onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (data.onDoubleClick) data.onDoubleClick();
      }}
      className={`group relative w-[112px] h-[82px] cursor-pointer rounded-lg bg-white px-2 py-2 text-center shadow-[0_8px_20px_rgba(35,51,38,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(35,51,38,0.14)] nodrag nopan flex flex-col justify-between ${highlightClass}`}
      style={{ pointerEvents: 'auto' }}
    >
      <Handle id="lineage-top" type="target" position={Position.Top} style={hiddenHandleStyle} />
      <Handle id="spouse-left-target" type="target" position={Position.Left} style={hiddenHandleStyle} />
      <Handle id="spouse-right-target" type="target" position={Position.Right} style={hiddenHandleStyle} />
      <Handle id="spouse-left-source" type="source" position={Position.Left} style={hiddenHandleStyle} />
      <Handle id="spouse-right-source" type="source" position={Position.Right} style={hiddenHandleStyle} />
      <Handle id="lineage-bottom" type="source" position={Position.Bottom} style={hiddenHandleStyle} />

      {detailLevel === 'low' && (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div
            className={`h-9 w-9 overflow-hidden rounded-md ${data.deathDate ? 'grayscale opacity-75' : ''}`}
            style={{ background: '#f1eee8', border: '1px solid #dfe4db' }}
          >
            <DecompressedImage
              photoUrl={data.photoUrl}
              fallbackIconSize={16}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-1 truncate text-[9px] font-bold leading-none text-[#22332a] w-full">
            {data.firstName || 'Family'}
          </div>
        </div>
      )}

      {detailLevel === 'med' && (
        <div className="flex flex-col items-center justify-between h-full w-full">
          <div
            className={`h-8 w-8 overflow-hidden rounded-md ${data.deathDate ? 'grayscale opacity-75' : ''}`}
            style={{ background: '#f1eee8', border: '1px solid #dfe4db' }}
          >
            <DecompressedImage
              photoUrl={data.photoUrl}
              fallbackIconSize={14}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-0.5 truncate text-[9px] font-bold leading-none text-[#22332a] w-full">
            {getCompactName(data)}
          </div>
          <div className="text-[7px] font-medium leading-none text-[#6f756b] w-full truncate">
            {years}
          </div>
        </div>
      )}

      {detailLevel === 'high' && (
        <>
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
        </>
      )}

      {/* Expand/Collapse Button */}
      {data.hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (data.onToggleCollapse) data.onToggleCollapse();
          }}
          className="absolute -bottom-3 flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-md hover:bg-gray-50 border transition-all duration-200 pointer-events-auto z-20 cursor-pointer text-[#1a3a2a] hover:scale-110"
          style={{ borderColor: '#dfe4db', left: 'calc(50% - 12px)' }}
          title={data.isCollapsed ? 'Expand branch' : 'Collapse branch'}
        >
          <span className="text-[14px] font-bold leading-none select-none">
            {data.isCollapsed ? '+' : '−'}
          </span>
        </button>
      )}
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

// ─── Layout Constants ────────────────────────────────────────────────────────
const NODE_W = 112;
const NODE_H = 82;
const H_GAP = 64;
const V_GAP = 120;
const LAYOUT_PADDING_X = 128;
const LAYOUT_PADDING_TOP = 128;
const TREE_FIT_VIEW_OPTIONS = { padding: 0.12, minZoom: 0.45, maxZoom: 1.0, duration: 800 };

// Helper to find parent IDs of a child
const getParentIdsOf = (childId: number, personsList: Person[]): number[] => {
  const parents: number[] = [];
  personsList.forEach((p) => {
    const hasChild = p.relationships.some(
      (rel) => rel.type === 'PARENT' && rel.relatedPersonId === childId
    );
    if (hasChild) {
      parents.push(p.id);
    }
  });
  return parents;
};

// Helper to expand all ancestors of a person
const expandAncestorsOf = (
  personId: number,
  personsList: Person[],
  currentCollapsed: Set<string>
): Set<string> => {
  const newCollapsed = new Set(currentCollapsed);
  const traverseUp = (id: number) => {
    const parents = getParentIdsOf(id, personsList);
    parents.forEach((pid) => {
      const pidStr = pid.toString();
      if (newCollapsed.has(pidStr)) {
        newCollapsed.delete(pidStr);
      }
      traverseUp(pid);
    });
  };
  traverseUp(personId);
  return newCollapsed;
};

// ─── Layout Calculator (Forest of Groups) ──────────────────────────────────
function buildLayout(persons: Person[], collapsedNodeIds: Set<string>): { nodes: Node[]; edges: Edge[] } {
  if (!persons.length) return { nodes: [], edges: [] };

  const personMap: Record<number, Person> = {};
  persons.forEach((p) => (personMap[p.id] = p));

  // Find spouse pairs among visible persons
  const spousePairs: [number, number][] = [];
  const spouseSet = new Set<string>();
  persons.forEach((p) => {
    p.relationships.forEach((rel) => {
      if (rel.type === 'SPOUSE' && personMap[rel.relatedPersonId]) {
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
      if (rel.type === 'PARENT' && personMap[rel.relatedPersonId]) {
        if (!childrenOf[p.id]) childrenOf[p.id] = [];
        if (!childrenOf[p.id].includes(rel.relatedPersonId)) {
          childrenOf[p.id].push(rel.relatedPersonId);
        }
        hasParent.add(rel.relatedPersonId);
      }
    });
  });

  // BFS / DFS to mark collapsed branches
  const hiddenIds = new Set<number>();
  const roots = persons.filter((p) => !hasParent.has(p.id)).map((p) => p.id);

  const traverseCollapse = (id: number, isParentCollapsed: boolean) => {
    if (isParentCollapsed) {
      hiddenIds.add(id);
    }
    const shouldCollapseChildren = isParentCollapsed || collapsedNodeIds.has(id.toString());
    const children = childrenOf[id] || [];
    children.forEach((childId) => {
      traverseCollapse(childId, shouldCollapseChildren);
    });
  };

  roots.forEach((rootId) => {
    traverseCollapse(rootId, false);
  });

  const visiblePersons = persons.filter((p) => !hiddenIds.has(p.id));
  const visiblePersonMap: Record<number, Person> = {};
  visiblePersons.forEach((p) => (visiblePersonMap[p.id] = p));

  if (visiblePersons.length === 0) return { nodes: [], edges: [] };

  // Group into Layout Units (Spouses couples or Singles)
  interface LayoutUnit {
    id: string;
    members: number[]; // 1 or 2 person IDs
    children: LayoutUnit[];
    width: number;
    subtreeWidth: number;
    x: number;
    y: number;
  }

  const units: LayoutUnit[] = [];
  const personToUnit: Record<number, LayoutUnit> = {};
  const groupedPeople = new Set<number>();

  // Create Couple Units
  spousePairs.forEach(([a, b]) => {
    if (visiblePersonMap[a] && visiblePersonMap[b]) {
      const unit: LayoutUnit = {
        id: `couple-${a}-${b}`,
        members: [a, b],
        children: [],
        width: 0,
        subtreeWidth: 0,
        x: 0,
        y: 0,
      };
      units.push(unit);
      personToUnit[a] = unit;
      personToUnit[b] = unit;
      groupedPeople.add(a);
      groupedPeople.add(b);
    }
  });

  // Create Single Units
  visiblePersons.forEach((p) => {
    if (!groupedPeople.has(p.id)) {
      const unit: LayoutUnit = {
        id: `single-${p.id}`,
        members: [p.id],
        children: [],
        width: 0,
        subtreeWidth: 0,
        x: 0,
        y: 0,
      };
      units.push(unit);
      personToUnit[p.id] = unit;
      groupedPeople.add(p.id);
    }
  });

  // Connect child units to parent units (Hierarchical Forest structure)
  const unitHasParent = new Set<string>();
  units.forEach((u) => {
    const childrenIds = new Set<number>();
    u.members.forEach((memberId) => {
      (childrenOf[memberId] || []).forEach((childId) => {
        if (visiblePersonMap[childId]) {
          childrenIds.add(childId);
        }
      });
    });

    childrenIds.forEach((childId) => {
      const childUnit = personToUnit[childId];
      if (childUnit && childUnit.id !== u.id) {
        if (!unitHasParent.has(childUnit.id)) {
          u.children.push(childUnit);
          unitHasParent.add(childUnit.id);
        }
      }
    });
  });

  const rootUnits = units.filter((u) => !unitHasParent.has(u.id));
  const SPOUSE_GAP = 32;

  // Compute subtree widths bottom-up
  const computeSubtreeWidth = (u: LayoutUnit): number => {
    if (u.members.length === 2) {
      u.width = NODE_W * 2 + SPOUSE_GAP;
    } else {
      u.width = NODE_W;
    }

    if (u.children.length === 0) {
      u.subtreeWidth = u.width;
    } else {
      let childrenWidth = 0;
      u.children.forEach((child, i) => {
        childrenWidth += computeSubtreeWidth(child);
        if (i > 0) childrenWidth += H_GAP;
      });
      u.subtreeWidth = Math.max(u.width, childrenWidth);
    }
    return u.subtreeWidth;
  };

  rootUnits.forEach((root) => computeSubtreeWidth(root));

  // Assign coordinate positions recursively
  const posX: Record<number, number> = {};
  const posY: Record<number, number> = {};

  const layoutUnit = (u: LayoutUnit, leftX: number, yOffset: number) => {
    const unitCenterX = leftX + u.subtreeWidth / 2;
    u.x = unitCenterX - u.width / 2;
    u.y = yOffset;

    if (u.members.length === 2) {
      const [a, b] = u.members;
      const pA = visiblePersonMap[a];
      const pB = visiblePersonMap[b];
      const putALeft = pA?.gender === 'MALE' || pB?.gender !== 'MALE';

      const leftId = putALeft ? a : b;
      const rightId = putALeft ? b : a;

      posX[leftId] = u.x;
      posY[leftId] = u.y;
      posX[rightId] = u.x + NODE_W + SPOUSE_GAP;
      posY[rightId] = u.y;
    } else {
      const a = u.members[0];
      posX[a] = u.x;
      posY[a] = u.y;
    }

    if (u.children.length > 0) {
      let totalChildrenWidth = 0;
      u.children.forEach((child, i) => {
        totalChildrenWidth += child.subtreeWidth;
        if (i > 0) totalChildrenWidth += H_GAP;
      });

      let childLeftX = unitCenterX - totalChildrenWidth / 2;
      u.children.forEach((child) => {
        layoutUnit(child, childLeftX, yOffset + NODE_H + V_GAP);
        childLeftX += child.subtreeWidth + H_GAP;
      });
    }
  };

  // Position multiple roots side by side
  let currentRootLeftX = 0;
  rootUnits.forEach((root) => {
    layoutUnit(root, currentRootLeftX, 0);
    currentRootLeftX += root.subtreeWidth + H_GAP * 2;
  });

  // Global alignment with padding
  const allX = Object.values(posX);
  const minX = allX.length > 0 ? Math.min(...allX) : 0;
  Object.keys(posX).forEach((id) => {
    const personId = Number(id);
    posX[personId] = posX[personId] - minX + LAYOUT_PADDING_X;
    posY[personId] = posY[personId] + LAYOUT_PADDING_TOP;
  });

  // Build React Flow Nodes
  const nodes: Node[] = visiblePersons.map((p) => {
    const hasChildren = (childrenOf[p.id] || []).length > 0;
    return {
      id: p.id.toString(),
      type: 'person',
      data: {
        ...p,
        hasChildren,
      },
      position: { x: posX[p.id] ?? 0, y: posY[p.id] ?? 0 },
      draggable: false,
      selectable: false,
    };
  });

  // Build React Flow Edges
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  // Spouse edges
  spousePairs.forEach(([a, b]) => {
    if (visiblePersonMap[a] && visiblePersonMap[b]) {
      const sourceIsLeft = (posX[a] ?? 0) <= (posX[b] ?? 0);
      edges.push({
        id: `spouse-${a}-${b}`,
        source: a.toString(),
        target: b.toString(),
        type: 'spouse',
        sourceHandle: sourceIsLeft ? 'spouse-right-source' : 'spouse-left-source',
        targetHandle: sourceIsLeft ? 'spouse-left-target' : 'spouse-right-target',
      });
    }
  });

  // Parent→child lineage edges
  visiblePersons.forEach((p) => {
    const children = childrenOf[p.id] || [];
    if (!children.length) return;

    const spouseRel = p.relationships.find((r) => r.type === 'SPOUSE');
    const spouseId = spouseRel?.relatedPersonId;
    const hasVisibleSpouse = spouseId !== undefined && visiblePersonMap[spouseId];
    const spouseX = hasVisibleSpouse ? posX[spouseId] : undefined;

    const parentCenterX = (posX[p.id] ?? 0) + NODE_W / 2;
    const midX =
      spouseX !== undefined
        ? (parentCenterX + spouseX + NODE_W / 2) / 2
        : parentCenterX;

    children.forEach((childId) => {
      if (visiblePersonMap[childId]) {
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
      }
    });
  });

  return { nodes, edges };
}

// ─── Flow Controls Component ─────────────────────────────────────────────────
const FlowControls = ({
  onCenterTree,
  onCenterSelected,
  onResetView,
  isNodeSelected,
}: {
  onCenterTree: () => void;
  onCenterSelected: () => void;
  onResetView: () => void;
  isNodeSelected: boolean;
}) => {
  const { zoomIn, zoomOut } = useReactFlow();

  return (
    <Panel position="bottom-right" className="flex flex-col gap-2">
      {/* Navigation controls */}
      <div className="flex flex-col rounded-xl bg-white shadow-lg p-1.5 gap-1.5 border border-[#e8e0d0]">
        <button
          onClick={onCenterTree}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#5a4a3a] hover:bg-gray-50 transition-colors cursor-pointer"
          title="Center entire tree"
        >
          <Compass size={14} className="text-[#2d6a4f]" />
          <span>Center Tree</span>
        </button>

        <button
          onClick={onCenterSelected}
          disabled={!isNodeSelected}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
            isNodeSelected
              ? 'text-[#5a4a3a] hover:bg-gray-50'
              : 'text-[#a09080]/50 cursor-not-allowed'
          }`}
          title={isNodeSelected ? 'Center on selected person' : 'Select a person to center'}
        >
          <Target size={14} className={isNodeSelected ? 'text-[#2d6a4f]' : 'text-[#a09080]/50'} />
          <span>Center Selected</span>
        </button>

        <button
          onClick={onResetView}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#5a4a3a] hover:bg-gray-50 transition-colors border-t border-[#f0ece4] pt-2 cursor-pointer"
          title="Reset view to fit"
        >
          <RotateCcw size={14} className="text-amber-600" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex rounded-xl bg-white shadow-lg border border-[#e8e0d0] self-end">
        <button
          onClick={() => zoomOut({ duration: 300 })}
          className="p-2.5 hover:bg-gray-50 rounded-l-xl transition-colors cursor-pointer text-[#5a4a3a]"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => zoomIn({ duration: 300 })}
          className="p-2.5 hover:bg-gray-50 rounded-r-xl transition-colors cursor-pointer text-[#5a4a3a] border-l border-[#e8e0d0]"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
      </div>
    </Panel>
  );
};

// ─── Main Flow Component (wrapped with ReactFlowProvider) ────────────────────
const TreeFlow = ({ treeId, isPublic }: { treeId: number; isPublic: boolean }) => {
  const navigate = useNavigate();
  const { useList: usePersonsList } = usePersons(Number(treeId));
  const { data: persons, isLoading } = usePersonsList(isPublic);

  const isInitialFitDone = useRef(false);
  const [pendingCenterNodeId, setPendingCenterNodeId] = useState<string | null>(null);

  const { fitView, setCenter, getViewport, setViewport, zoomIn, zoomOut } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  // Navigation states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Branch collapse states (sessionStorage persistence)
  const SESSION_STORAGE_KEY = `tree-collapsed-${treeId}`;
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
  });

  const handleToggleCollapse = (nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Base layout generation (only runs when people list or collapses change)
  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    if (!persons) return { nodes: [], edges: [] };
    return buildLayout(persons, collapsedNodeIds);
  }, [persons, collapsedNodeIds]);

  // Inject callbacks and selection/highlight states dynamically to prevent full layout recalculations
  const nodes = useMemo(() => {
    return baseNodes.map((node: Node<PersonNodeData>) => {
      return {
        ...node,
        data: {
          ...node.data,
          isSelected: selectedNodeId === node.id,
          isHighlighted: highlightedNodeId === node.id,
          isCollapsed: collapsedNodeIds.has(node.id),
          onToggleCollapse: () => handleToggleCollapse(node.id),
          onSelect: () => {
            setSelectedNodeId(node.id);
            const { zoom } = getViewport();
            setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
              zoom: Math.max(zoom, 1.2),
              duration: 800,
            });
            setHighlightedNodeId(node.id);
            setTimeout(() => setHighlightedNodeId(null), 2200);
          },
          onDoubleClick: () => {
            navigate(
              isPublic
                ? `/public-trees/${treeId}/persons/${node.id}`
                : `/trees/${treeId}/persons/${node.id}`
            );
          },
        },
      };
    });
  }, [baseNodes, selectedNodeId, highlightedNodeId, collapsedNodeIds, getViewport, setCenter, navigate, treeId, isPublic]);

  const edges = baseEdges;

  // Search autocompletion list
  const searchResults = useMemo(() => {
    if (!persons || !searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return persons.filter((p) => {
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [persons, searchQuery]);

  const handleSearchSelect = (person: Person) => {
    const personIdStr = person.id.toString();
    setSearchQuery('');

    // If the node is hidden because an ancestor is collapsed, expand the ancestors!
    if (persons) {
      const nextCollapsed = expandAncestorsOf(person.id, persons, collapsedNodeIds);
      if (nextCollapsed.size !== collapsedNodeIds.size) {
        setCollapsedNodeIds(nextCollapsed);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(Array.from(nextCollapsed)));
      }
    }

    // Set pending center: it will center on the node once the nodes array updates
    setPendingCenterNodeId(personIdStr);
  };

  // Center on node once it is visible/laid out
  useEffect(() => {
    if (pendingCenterNodeId) {
      const targetNode = nodes.find((n: Node) => n.id === pendingCenterNodeId);
      if (targetNode) {
        setCenter(targetNode.position.x + NODE_W / 2, targetNode.position.y + NODE_H / 2, {
          zoom: 1.35,
          duration: 800,
        });
        setSelectedNodeId(pendingCenterNodeId);
        setHighlightedNodeId(pendingCenterNodeId);
        setTimeout(() => setHighlightedNodeId(null), 2500);
        setPendingCenterNodeId(null);
      }
    }
  }, [nodes, pendingCenterNodeId, setCenter]);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      const { x, y, zoom } = getViewport();
      const PAN_STEP = 72;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setViewport({ x: x + PAN_STEP, y, zoom }, { duration: 150 });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setViewport({ x: x - PAN_STEP, y, zoom }, { duration: 150 });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setViewport({ x, y: y + PAN_STEP, zoom }, { duration: 150 });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setViewport({ x, y: y - PAN_STEP, zoom }, { duration: 150 });
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn({ duration: 300 });
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut({ duration: 300 });
      } else if (e.key === ' ') {
        e.preventDefault();
        if (selectedNodeId) {
          const selectedNode = nodes.find((n: Node) => n.id === selectedNodeId);
          if (selectedNode) {
            setCenter(
              selectedNode.position.x + NODE_W / 2,
              selectedNode.position.y + NODE_H / 2,
              { zoom: Math.max(zoom, 1.25), duration: 800 }
            );
            setHighlightedNodeId(selectedNodeId);
            setTimeout(() => setHighlightedNodeId(null), 2000);
          }
        } else {
          fitView(TREE_FIT_VIEW_OPTIONS);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getViewport, setViewport, zoomIn, zoomOut, selectedNodeId, nodes, fitView, setCenter]);

  // Click away listener for search dropdown
  useEffect(() => {
    const handleGlobalClick = () => {
      setIsSearchFocused(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Initial fitting of the tree view
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

  // Handler functions for navigation controls
  const handleCenterTree = () => {
    fitView(TREE_FIT_VIEW_OPTIONS);
  };

  const handleCenterSelected = () => {
    if (selectedNodeId) {
      const node = nodes.find((n: Node) => n.id === selectedNodeId);
      if (node) {
        const { zoom } = getViewport();
        setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
          zoom: Math.max(zoom, 1.25),
          duration: 800,
        });
        setHighlightedNodeId(selectedNodeId);
        setTimeout(() => setHighlightedNodeId(null), 2000);
      }
    }
  };

  const handleResetView = () => {
    setCollapsedNodeIds(new Set());
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSelectedNodeId(null);
    fitView({ padding: 0.12, minZoom: 0.45, maxZoom: 1.0, duration: 800 });
  };

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
        minZoom={0.2}
        maxZoom={2.5}
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
        
        {/* Navigation & Zoom controls */}
        <FlowControls
          onCenterTree={handleCenterTree}
          onCenterSelected={handleCenterSelected}
          onResetView={handleResetView}
          isNodeSelected={selectedNodeId !== null}
        />

        {/* MiniMap panel always visible */}
        <MiniMap
          position="bottom-left"
          style={{
            height: 110,
            width: 150,
            background: '#f7f4ef',
            borderRadius: '12px',
            border: '1px solid #e8e0d0',
            boxShadow: '0 8px 24px rgba(35,51,38,0.12)',
            margin: '0 0 16px 16px',
          }}
          maskColor="rgba(45, 106, 79, 0.08)"
          nodeColor={(n) => (n.id === selectedNodeId ? '#2d6a4f' : '#8fae98')}
          nodeStrokeColor="#c0d4c7"
          nodeBorderRadius={4}
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Local tree search input */}
      <div
        className="absolute top-6 left-[340px] z-10 hidden md:flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shadow-md rounded-xl bg-white/95 border border-[#e8e0d0]">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a09080]" />
          <input
            type="text"
            placeholder="Find a relative..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="h-12 pl-10 pr-9 w-60 rounded-xl text-xs outline-none font-semibold text-[#2d3a2a] transition-all focus:border-[#2d6a4f]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09080] hover:text-[#5a4a3a]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results Autocomplete dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div
            className="absolute top-14 left-0 w-72 max-h-72 overflow-y-auto rounded-xl bg-white shadow-xl py-2 z-30 border border-[#e8e0d0]"
          >
            {searchResults.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  handleSearchSelect(p);
                  setIsSearchFocused(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f7f4ef] text-left transition-colors cursor-pointer"
              >
                <div
                  className={`h-8 w-8 overflow-hidden rounded-md flex-shrink-0 ${p.deathDate ? 'grayscale opacity-75' : ''}`}
                  style={{ background: '#f7f4ef', border: '1px solid #e8e0d0' }}
                >
                  <DecompressedImage photoUrl={p.photoUrl} fallbackIconSize={14} className="h-full w-full object-cover" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-[#2d3a2a] truncate">{p.firstName} {p.lastName}</p>
                  <p className="text-[9px] font-semibold text-[#a09080]">
                    {getYear(p.birthDate)} - {p.deathDate ? getYear(p.deathDate) : 'Present'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {isSearchFocused && searchQuery.trim() && searchResults.length === 0 && (
          <div
            className="absolute top-14 left-0 w-72 rounded-xl bg-white shadow-xl px-4 py-3 z-30 border border-[#e8e0d0] text-center text-xs text-[#a09080]"
          >
            No family members found
          </div>
        )}
      </div>

      {/* Instruction tooltip at the bottom */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none z-10 hidden sm:block">
        <div className="bg-[#1a3a2a]/90 backdrop-blur-sm text-white text-[11px] px-4 py-2 rounded-full flex items-center justify-center gap-x-3 shadow-lg border border-[#3f9372]/30 font-medium">
          <span>🖱️ Drag to pan</span>
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
          <span>🔍 Scroll to zoom</span>
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
          <span>👈 Click to focus</span>
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
          <span>⚡ Double-click for Profile</span>
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
