import React, { useEffect, useState, useMemo } from 'react';
import { useNode } from '../../context/NodeContext';
import api from '../../api/axios';
import { Network, Activity, Layers, Users, Globe } from 'lucide-react';
import TreeCanvas, { type TreeNodeData } from './TreeCanvas';

// Interface matching the API response
interface ApiTreeNode {
    id: number;
    referral_code: string;
    status: 'ACTIVE' | 'INACTIVE';
    direct_referrals_count: number;
    children: ApiTreeNode[];
    level: number;
    current_level: number;
    is_rebirth?: boolean;
    owner_user_id: number;
    origin_node_id?: number | null; // Added
    // self_pool_parent_id / auto_pool_parent_id are implicit in structure
}

type ViewType = 'SELF' | 'AUTO';

const NodeGenealogy: React.FC = () => {
    const { activeNode } = useNode();
    const [flatNodes, setFlatNodes] = useState<TreeNodeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewType, setViewType] = useState<ViewType>('SELF');

    // Stats Calculation
    const stats = useMemo(() => {
        const total = flatNodes.length;
        const active = flatNodes.filter(n => n.status === 'ACTIVE').length;
        const depth = flatNodes.reduce((max, n) => Math.max(max, n.tree_layer), 0);
        return { total, active, depth };
    }, [flatNodes]);

    // Flattening Helper
    const flattenNodes = (node: ApiTreeNode, parentId: string | null = null, level: number = 1): TreeNodeData[] => {
        const current: TreeNodeData = {
            id: node.id.toString(),
            member_id: node.id.toString(),
            member_name: node.referral_code,
            status: node.status,
            direct_referrals_count: node.direct_referrals_count,
            is_child_node: false, // Default logic
            tree_layer: level,
            current_level: node.current_level, // Use strict Financial Level from DB
            is_journey_complete: node.status === 'ACTIVE', // Mapping for legacy prop
            is_rebirth: !!node.is_rebirth,
            owner_user_id: node.owner_user_id,
            origin_node_id: node.origin_node_id, // Map it
            parent_id: parentId,
            children: node.children?.map(c => c.id.toString()) || []
        };

        let result = [current];

        if (node.children) {
            node.children.forEach(child => {
                result = result.concat(flattenNodes(child, current.id, level + 1));
            });
        }

        return result;
    };

    useEffect(() => {
        if (!activeNode) return;

        const fetchGenealogy = async () => {
            setLoading(true);
            try {
                const isGlobal = viewType === 'AUTO';
                const res = await api.get(`/nodes/${activeNode.id}/genealogy?type=${viewType}${isGlobal ? '&global=true' : ''}`);
                const rootNode: ApiTreeNode = res.data;
                // Since the API returns a root node with recursive children
                // We need to flatten it, assuming the root fetched has NO parent we care about in this view (or parent is null)
                const flattened = flattenNodes(rootNode, null, 1);
                setFlatNodes(flattened);
            } catch (err: any) {
                // If 404/Empty
                setFlatNodes([]);
                if (err.response?.status !== 404) {
                    setError('Failed to load genealogy tree');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchGenealogy();
    }, [activeNode, viewType]);

    if (!activeNode) return null;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">

            {/* Header & Stats Compact Row */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div>
                    <h1 className="text-xl font-bold text-secondary">Genealogy</h1>
                    <p className="text-sm text-muted-foreground">
                        {viewType === 'SELF' ? 'Sponsor Tree' : 'Auto Pool Matrix'}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex gap-2 overflow-x-auto pb-1 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border shadow-sm min-w-max">
                        <Network className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Total:</span>
                        <span className="font-bold text-foreground">{stats.total}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border shadow-sm min-w-max">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Active:</span>
                        <span className="font-bold text-foreground">{stats.active}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border shadow-sm min-w-max">
                        <Layers className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">Depth:</span>
                        <span className="font-bold text-foreground">{stats.depth}</span>
                    </div>
                </div>

                {/* Toggle */}
                <div className="flex bg-card p-1 rounded-lg border border-border shadow-sm">
                    <button
                        onClick={() => setViewType('SELF')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewType === 'SELF'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Users className="w-3 h-3 mr-1.5" />
                        Self Pool
                    </button>
                    <button
                        onClick={() => setViewType('AUTO')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewType === 'AUTO'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Globe className="w-3 h-3 mr-1.5" />
                        Auto Pool
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-hidden bg-background rounded-xl border border-border relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-muted-foreground text-sm">Building Matrix...</span>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4">
                        {error}
                    </div>
                ) : flatNodes.length > 0 ? (
                    <TreeCanvas
                        nodes={flatNodes}
                        highlightNodeId={activeNode.id.toString()}
                        originIdToCheck={activeNode.id} // Proper fix: Pass Active ID as origin-to-match
                        childNodeIds={[]}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-gray-400">
                        <Network className="w-10 h-10 opacity-20" />
                        <p>No nodes found in this view.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NodeGenealogy;
