import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position, 
  NodeProps, 
  Edge, 
  Node 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePersons } from '../hooks/usePersons';
import { useTrees } from '../hooks/useTrees';
import DecompressedImage from '../components/DecompressedImage';
import { Plus, ArrowLeft, Calendar } from 'lucide-react';
import { Person } from '../types';

const PersonNode = ({ data }: NodeProps<Person>) => {
  const navigate = useNavigate();
  const isFemale = data.gender === 'FEMALE';
  
  return (
    <div 
      onClick={() => navigate(`/trees/${data.treeId}/persons/${data.id}`)}
      className="group relative min-w-[200px] cursor-pointer rounded-2xl bg-white p-3.5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      style={{ border: '1px solid #e8e0d0' }}
    >
      {/* Top Handle (target) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-2.5 !h-2.5 !border-2 !border-white !rounded-full -translate-y-0.5"
        style={{ background: '#2d6a4f' }}
      />
      
      <div className="flex items-center gap-3">
        {/* Avatar Area */}
        <div
          className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-105"
          style={{ background: '#f7f4ef', border: '1px solid #e8e0d0' }}
        >
          <DecompressedImage photoUrl={data.photoUrl} fallbackIconSize={22} className="w-full h-full object-cover" />
        </div>
        
        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-bold leading-tight transition-colors" style={{ color: '#2d3a2a' }}>
            {data.firstName} {data.lastName}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: '#a09080' }}>
            <Calendar size={12} />
            <span>
              {data.birthDate ? new Date(data.birthDate).getFullYear() : '?' } 
              {data.deathDate ? ` - ${new Date(data.deathDate).getFullYear()}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Gender Indicator Dot */}
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${isFemale ? 'bg-pink-400' : 'bg-blue-400'}`} />

      {/* Bottom Handle (source) */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-2.5 !h-2.5 !border-2 !border-white !rounded-full translate-y-0.5"
        style={{ background: '#2d6a4f' }}
      />
    </div>
  );
};

const nodeTypes = {
  person: PersonNode,
};

const TreeView: React.FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { useList: usePersonsList } = usePersons(Number(treeId));
  const { useGet: useTreeGet } = useTrees();
  const { data: tree } = useTreeGet(Number(treeId));
  const { data: persons, isLoading } = usePersonsList();

  const { nodes, edges } = useMemo(() => {
    if (!persons) return { nodes: [], edges: [] };

    const nodes: Node[] = persons.map((p, idx) => ({
      id: p.id.toString(),
      type: 'person',
      data: p,
      position: { x: (idx % 3) * 250, y: Math.floor(idx / 3) * 180 },
    }));

    const edges: Edge[] = [];
    persons.forEach((p) => {
      p.relationships.forEach((rel) => {
        // Only render edges in one direction for simplicity in visualization
        if (rel.type === 'PARENT') {
          edges.push({
            id: `e-${p.id}-${rel.relatedPersonId}`,
            source: p.id.toString(),
            target: rel.relatedPersonId.toString(),
            label: 'parent',
            animated: true,
            style: { stroke: '#2d6a4f', strokeWidth: 2.5 },
          });
        } else if (rel.type === 'SPOUSE' && p.id < rel.relatedPersonId) {
           edges.push({
            id: `e-${p.id}-${rel.relatedPersonId}`,
            source: p.id.toString(),
            target: rel.relatedPersonId.toString(),
            label: 'spouse',
            style: { stroke: '#95d5b2', strokeWidth: 2.5, strokeDasharray: '5,5' },
          });
        }
      });
    });

    return { nodes, edges };
  }, [persons]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center space-y-4 bg-[#f7f4ef] md:min-h-screen">
        <div
          className="h-10 w-10 animate-spin rounded-full"
          style={{ border: '3px solid #e8e0d0', borderTopColor: '#2d6a4f' }}
        />
        <p className="font-medium" style={{ color: '#a09080' }}>Loading family canvas...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)] bg-[#f7f4ef] md:h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Floating Toolbar (Left) */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="cursor-pointer rounded-xl bg-white p-3 shadow-md transition-all duration-300 hover:shadow-lg"
          style={{ border: '1px solid #e8e0d0', color: '#5a4a3a' }}
          title="Back to Dashboard"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="rounded-xl bg-white/90 px-5 py-3 shadow-md backdrop-blur-md" style={{ border: '1px solid #e8e0d0' }}>
          <h1 className="text-lg font-bold leading-none" style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}>{tree?.name}</h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#a09080' }}>Interactive Family Graph</p>
        </div>
      </div>

      {/* Add Person Button (Right) */}
      <div className="absolute top-6 right-6 z-10">
        <Link 
          to={`/trees/${treeId}/persons/new`}
          className="flex cursor-pointer items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300"
          style={{ background: '#1a3a2a' }}
        >
          <Plus size={18} />
          <span>Add Person</span>
        </Link>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="w-full h-full"
      >
        <Background color="#d4c9b0" gap={22} size={1} />
        <Controls className="!overflow-hidden !rounded-xl !border !bg-white !shadow-md" style={{ borderColor: '#e8e0d0' }} />
      </ReactFlow>
    </div>
  );
};

export default TreeView;
