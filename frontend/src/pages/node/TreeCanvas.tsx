import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getLevelName, getLevelColor } from '../../utils/levelUtils';

export interface TreeNodeData {
    id: string;
    member_id: string;
    member_name: string;
    email?: string;
    is_child_node: boolean;
    tree_layer: number;
    current_level: number;
    is_journey_complete: boolean;
    parent_id?: string | null;
    position?: number;
    children?: string[];
    status?: 'ACTIVE' | 'INACTIVE';
    total_earned?: number;
    direct_referrals_count?: number;
    is_rebirth?: boolean;
    owner_user_id?: number;
    origin_node_id?: number | null;
}

interface TreeCanvasProps {
    nodes: TreeNodeData[];
    highlightNodeId?: string;
    highlightColor?: string;
    childNodeIds?: string[];
    checkOwnerId?: number; // Kept for optionality, but main check is below
    originIdToCheck?: number; // New Prop: The "Mother Node" ID
    onNodeClick?: (node: TreeNodeData) => void;
}

interface RenderedNode {
    node: TreeNodeData;
    x: number;
    y: number;
    radius: number;
}

export default function TreeCanvas({
    nodes,
    highlightNodeId,
    checkOwnerId,
    originIdToCheck,
    onNodeClick,
}: TreeCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<TreeNodeData | null>(null);
    const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number } | null>(null);
    const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);

    const [isMobile, setIsMobile] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setDimensions({ width, height });
                setIsMobile(window.innerWidth < 768);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.max(0.3, Math.min(3, prev * delta)));
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, []);

    const NODE_RADIUS = isMobile ? 22 : 30; // Slightly larger for touch
    const LEVEL_HEIGHT = isMobile ? 90 : 130;
    const HORIZONTAL_SPACING = isMobile ? 60 : 90;

    const layout = React.useMemo(() => {
        if (!dimensions.width || !dimensions.height) return [];

        const { width } = dimensions;

        const nodeMap = new Map<string, any>();
        nodes.forEach(node => nodeMap.set(node.id, { ...node, children: [] }));
        nodes.forEach(node => {
            if (node.parent_id && nodeMap.has(node.parent_id)) {
                nodeMap.get(node.parent_id).children.push(nodeMap.get(node.id));
            }
        });
        nodeMap.forEach(node => {
            node.children.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        });
        const roots = Array.from(nodeMap.values()).filter(n => !n.parent_id || !nodeMap.has(n.parent_id));

        if (roots.length === 0 && nodes.length > 0) return [];

        const positions = new Map<string, { x: number; y: number }>();
        const calculatePositions = (curr: any, lvl: number, startX: number) => {
            const y = lvl * LEVEL_HEIGHT + 60;
            if (curr.children.length === 0) {
                positions.set(curr.id, { x: startX, y });
                return startX + HORIZONTAL_SPACING;
            }
            let currentX = startX;
            const childrenX: number[] = [];
            curr.children.forEach((child: any) => {
                const childCenter = calculatePositions(child, lvl + 1, currentX);
                childrenX.push(positions.get(child.id)?.x || currentX);
                currentX = childCenter;
            });
            const nodeX = (childrenX[0] + childrenX[childrenX.length - 1]) / 2;
            positions.set(curr.id, { x: nodeX, y });
            return currentX;
        };

        let totalWidth = 0;
        roots.forEach((root, idx) => {
            totalWidth = calculatePositions(root, 0, totalWidth);
            if (idx < roots.length - 1) totalWidth += HORIZONTAL_SPACING;
        });

        const centerAdjustment = (width / scale - totalWidth) / 2;

        const finalNodes: RenderedNode[] = [];
        positions.forEach((pos, id) => {
            const node = nodeMap.get(id);
            if (node) {
                finalNodes.push({
                    node,
                    x: pos.x + centerAdjustment,
                    y: pos.y,
                    radius: NODE_RADIUS
                });
            }
        });
        return finalNodes;
    }, [nodes, dimensions.width, dimensions.height, scale, NODE_RADIUS, LEVEL_HEIGHT, HORIZONTAL_SPACING]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !dimensions.width || !dimensions.height) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        const nodeMap = new Map(layout.map(n => [n.node.id, n]));
        layout.forEach(item => {
            const node = item.node;
            if (node.parent_id) {
                const parent = nodeMap.get(node.parent_id);
                if (parent) {
                    ctx.beginPath();
                    ctx.moveTo(parent.x, parent.y);
                    ctx.lineTo(item.x, item.y);
                    ctx.strokeStyle = '#4b5563';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        });

        layout.forEach(item => {
            const { x, y, radius, node } = item;
            let outer = '#374151'; let inner = '#030712'; let stroke = '#6b7280'; let width = 2;

            if (node.status === 'ACTIVE') {
                outer = '#10b981'; // Emerald-500
                inner = '#064e3b'; // Emerald-900
            } else if (node.status === 'INACTIVE') {
                outer = '#f43f5e'; // Rose-500
                inner = '#881337'; // Rose-900
            }

            // Rebirth Customization: Amber
            // STRICT RULE: Only highlight Rebirth nodes that originated from the CURRENTLY VIEWED MOTHER NODE
            const isMyRebirth = node.is_rebirth &&
                originIdToCheck &&
                node.origin_node_id &&
                (Number(node.origin_node_id) === Number(originIdToCheck));

            if (isMyRebirth) {
                inner = '#78350f'; // Amber-900
                outer = '#f59e0b'; // Amber-500
            }

            if (node.id === highlightNodeId) { stroke = '#d946ef'; width = 4; } // Secondary (Magenta)

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
            g.addColorStop(0, inner);
            g.addColorStop(1, outer);
            ctx.fillStyle = g;
            ctx.fill();
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            // Scale font slightly but keep it readable. 
            // On mobile, we want it crisp.
            const fontSize = isMobile ? 11 : 12;
            ctx.font = `bold ${fontSize}px "Outfit", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Add subtle shadow for text readability
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;

            // Parse Label: Handle 'JSE-CODE' vs 'RB-TYPE-CODE'
            const parts = node.member_name.split('-');
            const label = parts[0] === 'RB' ? parts[2] : parts[1];
            // Show more chars if possible
            ctx.fillText(label?.slice(0, 6) || node.member_name.slice(0, 5), x, y + 1);

            // Reset shadow
            ctx.shadowBlur = 0;
        });

        ctx.restore();
    }, [layout, offset, scale, dimensions, highlightNodeId, checkOwnerId, originIdToCheck]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setOffset(p => ({ x: p.x + dx, y: p.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - offset.x) / scale;
        const mouseY = (e.clientY - rect.top - offset.y) / scale;

        let foundNode: TreeNodeData | null = null;
        for (const item of layout) {
            const dist = Math.hypot(mouseX - item.x, mouseY - item.y);
            if (dist <= item.radius) {
                foundNode = item.node;
                break;
            }
        }

        if (foundNode?.id !== hoveredNode?.id) {
            setHoveredNode(foundNode);
            canvasRef.current.style.cursor = foundNode ? 'pointer' : 'grab';
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        e.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(false);
        e.currentTarget.style.cursor = 'grab';
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;

        for (const item of layout) {
            if (Math.hypot(x - item.x, y - item.y) <= item.radius) {
                setSelectedNode(item.node);
                onNodeClick?.(item.node);
                break;
            }
        }
    };

    // Native Event Listeners for robust non-passive touch handling
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onTouchStart = (e: TouchEvent) => {
            // Prevent default only if necessary, but usually touch-action: none handles it.
            // keeping it safe:
            // e.preventDefault(); 
            if (e.touches.length === 1) {
                setIsDragging(true);
                setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            } else if (e.touches.length === 2) {
                const d = Math.hypot(
                    e.touches[1].clientX - e.touches[0].clientX,
                    e.touches[1].clientY - e.touches[0].clientY
                );
                setTouchStart({ x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2, distance: d });
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault(); // CRITICAL: Stop browser scrolling/refresh behavior
            if (e.touches.length === 1 && isDragging && lastTouch) {
                const dx = e.touches[0].clientX - lastTouch.x;
                const dy = e.touches[0].clientY - lastTouch.y;
                setOffset(p => ({ x: p.x + dx, y: p.y + dy }));
                setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            } else if (e.touches.length === 2 && touchStart) {
                const d = Math.hypot(
                    e.touches[1].clientX - e.touches[0].clientX,
                    e.touches[1].clientY - e.touches[0].clientY
                );
                const scaleChange = d / touchStart.distance;
                setScale(p => Math.max(0.3, Math.min(3, p * scaleChange)));
                setTouchStart(prev => prev ? { ...prev, distance: d } : null);
            }
        };

        const onTouchEnd = () => {
            setIsDragging(false);
            setTouchStart(null);
            setLastTouch(null);
        };

        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);
        canvas.addEventListener('touchcancel', onTouchEnd);

        return () => {
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
            canvas.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [isDragging, lastTouch, touchStart]); // Re-bind when state refs change (or use refs for state to avoid re-binding)

    const handleReset = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    /* React events removed for Touch, kept for Mouse */
    return (
        <div className="relative w-full h-full" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="w-full h-full rounded-lg touch-none"
                style={{
                    cursor: 'grab',
                    touchAction: 'none',
                    background: 'transparent' // Let the glass-card container show through
                }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
            />

            {/* Controls - Moved to Bottom Right for thumb access on mobile */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20">
                <button
                    onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
                    className="p-3 md:p-2 bg-white/80 backdrop-blur hover:bg-white text-primary rounded-full border border-white/20 shadow-lg transition-all active:scale-95 hover:shadow-primary/20"
                    aria-label="Zoom in"
                >
                    <span className="text-xl leading-none font-bold">+</span>
                </button>
                <button
                    onClick={() => setScale(prev => Math.max(0.3, prev * 0.8))}
                    className="p-3 md:p-2 bg-white/80 backdrop-blur hover:bg-white text-primary rounded-full border border-white/20 shadow-lg transition-all active:scale-95 hover:shadow-primary/20"
                    aria-label="Zoom out"
                >
                    <span className="text-xl leading-none font-bold">-</span>
                </button>
                <button
                    onClick={handleReset}
                    className="p-3 md:px-3 md:py-2 bg-white/80 backdrop-blur hover:bg-white text-primary rounded-full md:rounded-lg border border-white/20 shadow-lg transition-all text-xs font-bold active:scale-95 flex items-center justify-center hover:shadow-primary/20"
                    aria-label="Reset view"
                >
                    <span className="md:hidden">⟲</span>
                    <span className="hidden md:inline">Reset</span>
                </button>
            </div>

            {/* Hover Tooltip - Styled */}
            {hoveredNode && (
                <div
                    className="absolute pointer-events-none bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl z-30"
                    style={{
                        left: '50%',
                        bottom: '20px',
                        transform: 'translateX(-50%)',
                        minWidth: '180px',
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${hoveredNode.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                        <p className="font-bold text-gray-800">{hoveredNode.member_name}</p>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                            <span>Refs:</span>
                            <span className="font-semibold text-secondary">{hoveredNode.direct_referrals_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Level:</span>
                            <span className={`font-semibold ${getLevelColor(hoveredNode.current_level)}`}>{getLevelName(hoveredNode.current_level)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Node Details - Styled */}
            {selectedNode && (
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl max-w-xs z-30 animate-in fade-in slide-in-from-left-4 duration-200">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">{selectedNode.member_name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${selectedNode.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {selectedNode.status}
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-gray-400 hover:text-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-400">ID:</span>
                            <span className="font-medium text-gray-800">{selectedNode.id}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-400">Direct Referrals:</span>
                            <span className="font-medium text-secondary">{selectedNode.direct_referrals_count || 0}</span>
                        </div>
                        {selectedNode.is_rebirth && selectedNode.origin_node_id && (
                            <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-400">Origin Node:</span>
                                <span className="font-medium text-amber-500">{selectedNode.origin_node_id}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-4 bg-white/50 backdrop-blur-md border border-white/20 rounded-lg p-2 text-[10px] text-gray-500 z-10 shadow-sm pointer-events-none select-none">
                <p> Pinch to Zoom • Drag to Pan</p>
            </div>
        </div>
    );
}
