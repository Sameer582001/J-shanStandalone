import { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';

// Define the Node Type based on Backend Response
interface Node {
    id: number;
    referralCode: string;
    status: 'ACTIVE' | 'INACTIVE';
    walletBalance: string;
    selfPoolTeam?: number;
    autoPoolTeam?: number;
    direct_referrals_count: number;
}

interface NodeContextType {
    activeNode: Node | null;
    switchNode: (node: Node) => void;
    clearActiveNode: () => void;
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

export const NodeProvider = ({ children }: { children: ReactNode }) => {
    const [activeNode, setActiveNode] = useState<Node | null>(null);

    // Initialize from localStorage if available
    useEffect(() => {
        const storedNode = localStorage.getItem('activeNode');
        if (storedNode) {
            try {
                setActiveNode(JSON.parse(storedNode));
            } catch (e) {
                console.error("Failed to parse stored active node", e);
                localStorage.removeItem('activeNode');
            }
        }
    }, []);

    const switchNode = useCallback((node: Node) => {
        setActiveNode(node);
        localStorage.setItem('activeNode', JSON.stringify(node));
    }, []);

    const clearActiveNode = useCallback(() => {
        setActiveNode(null);
        localStorage.removeItem('activeNode');
    }, []);

    return (
        <NodeContext.Provider value={{ activeNode, switchNode, clearActiveNode }}>
            {children}
        </NodeContext.Provider>
    );
};

export const useNode = () => {
    const context = useContext(NodeContext);
    if (!context) {
        throw new Error('useNode must be used within a NodeProvider');
    }
    return context;
};
