import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

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
    status?: 'ACTIVE' | 'INACTIVE'; // Added for compatibility
    total_earned?: number; // Added for compatibility
    direct_referrals_count?: number; // Added for compatibility
}

interface TreeCanvasProps {
    nodes: TreeNodeData[];
    highlightNodeId?: string;
    highlightColor?: string;
    childNodeIds?: string[];
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

    childNodeIds = [],
    onNodeClick,
}: TreeCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<TreeNodeData | null>(null);
    const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
    const [renderedNodes, setRenderedNodes] = useState<RenderedNode[]>([]);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number } | null>(null);
    const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);

    // Responsive sizing based on screen width
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const NODE_RADIUS = isMobile ? 18 : 25;
    const LEVEL_HEIGHT = isMobile ? 80 : 120;
    const HORIZONTAL_SPACING = isMobile ? 50 : 80;

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        ctx.scale(dpr, dpr);

        // --- Drawing Logic Inside Effect ---

        const buildTree = () => {
            // Use 'any' to bypass strict intersection checks between TreeNodeData children (string[]) vs internal children (object[])
            const nodeMap = new Map<string, any>();

            nodes.forEach(node => {
                nodeMap.set(node.id, { ...node, children: [] });
            });

            nodes.forEach(node => {
                if (node.parent_id && nodeMap.has(node.parent_id)) {
                    const parent = nodeMap.get(node.parent_id)!;
                    parent.children.push(nodeMap.get(node.id)!);
                }
            });

            // Sort children by position to maintain correct tree structure
            nodeMap.forEach(node => {
                node.children.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
            });

            const roots = Array.from(nodeMap.values()).filter(
                node => !node.parent_id || !nodeMap.has(node.parent_id)
            );

            return roots.length > 0 ? roots : [];
        };

        const calculateNodePositions = (
            node: any,
            level: number,
            x: number,
            positions: Map<string, { x: number; y: number }>,
            visited: Set<string> = new Set()
        ): number => {
            if (visited.has(node.id)) return x;
            visited.add(node.id);

            const y = level * LEVEL_HEIGHT + 60;

            if (node.children.length === 0) {
                positions.set(node.id, { x, y });
                return x + HORIZONTAL_SPACING;
            }

            let currentX = x;
            const childXPositions: number[] = [];

            node.children.forEach((child: any) => {
                const childCenterX = calculateNodePositions(
                    child,
                    level + 1,
                    currentX,
                    positions,
                    visited
                );
                childXPositions.push((positions.get(child.id)?.x || currentX));
                currentX = childCenterX;
            });

            const nodeX = childXPositions.length > 0
                ? (childXPositions[0] + childXPositions[childXPositions.length - 1]) / 2
                : x;

            positions.set(node.id, { x: nodeX, y });

            return currentX;
        };

        const drawTree = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(offset.x, offset.y);
            ctx.scale(scale, scale);

            const roots = buildTree();

            // If we have nodes but calculation failed (loops?), restore and return
            if (nodes.length > 0 && roots.length === 0) {
                ctx.restore();
                return;
            }

            const positions = new Map<string, { x: number; y: number }>();
            let totalWidth = 0;

            roots.forEach((root, index) => {
                const startX = totalWidth;
                totalWidth = calculateNodePositions(root, 0, startX, positions);
                if (index < roots.length - 1) {
                    totalWidth += HORIZONTAL_SPACING * 2;
                }
            });

            const centerOffset = (width / scale - totalWidth) / 2;
            positions.forEach((pos) => {
                pos.x += centerOffset;
            });

            const nodeMap = new Map<string, TreeNodeData>();
            nodes.forEach(node => nodeMap.set(node.id, node));

            // Draw connections
            nodes.forEach(node => {
                if (node.parent_id && positions.has(node.id) && positions.has(node.parent_id)) {
                    const parentPos = positions.get(node.parent_id)!;
                    const childPos = positions.get(node.id)!;

                    ctx.beginPath();
                    ctx.moveTo(parentPos.x, parentPos.y);
                    ctx.lineTo(childPos.x, childPos.y);
                    ctx.strokeStyle = '#4b5563'; // Gray-600 for darker theme lines
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            const rendered: RenderedNode[] = [];
            positions.forEach((pos, nodeId) => {
                const node = nodeMap.get(nodeId);
                if (!node) return;

                // Default Colors (Gray)
                let outerColor = '#374151'; // Gray-700
                let innerColor = '#030712'; // Gray-950
                let strokeColor = '#6b7280'; // Gray-500 (Default Outer Ring)
                let strokeWidth = 2;

                // Status-based Colors
                if (node.status === 'ACTIVE') {
                    outerColor = '#0f766e'; // Teal-700
                    innerColor = '#042f2e'; // Teal-950 (Darker)
                } else if (node.status === 'INACTIVE') {
                    outerColor = '#991b1b'; // Red-800
                    innerColor = '#450a0a'; // Red-950 (Darker)
                }

                // Highlight currently logged-in node with Purple Ring
                if (nodeId === highlightNodeId) {
                    strokeWidth = 4;
                    strokeColor = '#a855f7'; // Purple-500
                }

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, Math.PI * 2);

                // Create Radial Gradient (Center Darker -> Outer Status Color)
                const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, NODE_RADIUS);
                gradient.addColorStop(0, innerColor);
                gradient.addColorStop(1, outerColor);

                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.stroke();

                ctx.fillStyle = '#e5e7eb'; // Light text for node labels
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const label = node.member_name.split('-')[1]?.slice(0, 4) || node.member_name.slice(0, 4);

                ctx.fillText(label, pos.x, pos.y - 2);

                rendered.push({ node, x: pos.x, y: pos.y, radius: NODE_RADIUS });
            });

            setRenderedNodes(rendered);
            ctx.restore();
        };

        drawTree(ctx, rect.width, rect.height);
    }, [nodes, scale, offset, highlightNodeId, childNodeIds, isMobile, NODE_RADIUS, LEVEL_HEIGHT, HORIZONTAL_SPACING]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;

        let found = false;
        for (const rendered of renderedNodes) {
            const dx = x - rendered.x;
            const dy = y - rendered.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= rendered.radius) {
                setHoveredNode(rendered.node);
                canvasRef.current.style.cursor = 'pointer';
                found = true;
                break;
            }
        }

        if (!found) {
            setHoveredNode(null);
            canvasRef.current.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grab';
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;

        for (const rendered of renderedNodes) {
            const dx = x - rendered.x;
            const dy = y - rendered.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= rendered.radius) {
                setSelectedNode(rendered.node);
                if (onNodeClick) {
                    onNodeClick(rendered.node);
                }
                break;
            }
        }
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.3, Math.min(3, prev * delta)));
    };

    // Touch handlers for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 1) {
            // Single touch - start panning
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        } else if (e.touches.length === 2) {
            // Two touches - start pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            setTouchStart({
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
                distance,
            });
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging && lastTouch) {
            // Single touch - panning
            const dx = e.touches[0].clientX - lastTouch.x;
            const dy = e.touches[0].clientY - lastTouch.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        } else if (e.touches.length === 2 && touchStart) {
            // Two touches - pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            const scaleChange = distance / touchStart.distance;
            setScale(prev => Math.max(0.3, Math.min(3, prev * scaleChange)));
            setTouchStart({
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
                distance,
            });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        setTouchStart(null);
        setLastTouch(null);
    };

    const handleReset = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    return (
        <div className="relative w-full h-full" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="w-full h-full bg-dark-surface rounded-lg touch-none shadow-inner border border-gray-800"
                style={{
                    cursor: 'grab',
                    touchAction: 'none'
                }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                <button
                    onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
                    className="p-2 bg-dark-surface hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 shadow-sm transition-colors"
                    aria-label="Zoom in"
                >
                    +
                </button>
                <button
                    onClick={() => setScale(prev => Math.max(0.3, prev * 0.8))}
                    className="p-2 bg-dark-surface hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 shadow-sm transition-colors"
                    aria-label="Zoom out"
                >
                    -
                </button>
                <button
                    onClick={handleReset}
                    className="px-3 py-2 bg-dark-surface hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 shadow-sm transition-colors text-xs font-medium"
                    aria-label="Reset view"
                >
                    Reset
                </button>
            </div>

            {/* Hover Tooltip */}
            {hoveredNode && (
                <div
                    className="absolute pointer-events-none bg-dark-surface border border-gray-700 rounded-xl p-3 shadow-2xl z-30"
                    style={{
                        left: '50%',
                        bottom: '20px',
                        transform: 'translateX(-50%)',
                        minWidth: '180px',
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${hoveredNode.status === 'ACTIVE' ? 'bg-accent-teal' : 'bg-red-500'}`}></div>
                        <p className="font-bold text-white">{hoveredNode.member_name}</p>
                    </div>

                    <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex justify-between">
                            <span>Refs:</span>
                            <span className="font-semibold text-accent-cyan">{hoveredNode.direct_referrals_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Level:</span>
                            <span className="font-semibold text-accent-cyan">{hoveredNode.current_level}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Node Details */}
            {selectedNode && (
                <div className="absolute top-4 left-4 bg-dark-surface border border-gray-700 rounded-xl p-4 shadow-2xl max-w-xs z-30 animate-in fade-in slide-in-from-left-4 duration-200">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-white">{selectedNode.member_name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedNode.status === 'ACTIVE' ? 'bg-teal-900/50 text-teal-200' : 'bg-red-900/50 text-red-200'}`}>
                                {selectedNode.status}
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-gray-500 hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-gray-700">
                            <span className="text-gray-400">ID:</span>
                            <span className="font-medium text-gray-200">{selectedNode.id}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-700">
                            <span className="text-gray-400">Direct Referrals:</span>
                            <span className="font-medium text-accent-cyan">{selectedNode.direct_referrals_count || 0}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-dark-surface/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-xs text-gray-400 z-20 shadow-sm hidden md:block">
                <p className="flex items-center gap-2"><span className="w-4 h-4 border border-gray-600 rounded flex items-center justify-center">🖱️</span> Drag to pan</p>
                <p className="flex items-center gap-2 mt-1"><span className="w-4 h-4 border border-gray-600 rounded flex items-center justify-center">🔍</span> Scroll to zoom</p>
            </div>
        </div>
    );
}
