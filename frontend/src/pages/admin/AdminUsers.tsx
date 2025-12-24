import React, { useEffect, useState } from 'react';
import { Layers, Ghost } from 'lucide-react';
import { UserNodesModal } from '../../components/admin/UserNodesModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    // Modal State
    const [selectedUser, setSelectedUser] = useState<{ id: number; name: string } | null>(null);
    const [isNodesModalOpen, setIsNodesModalOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?page=${page}&limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotalPages(Math.ceil(data.total / 20));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const handleViewNodes = (user: any) => {
        setSelectedUser({ id: user.id, name: user.full_name });
        setIsNodesModalOpen(true);
    };

    const handleGhostLogin = async (userId: number) => {
        if (!confirm("Are you sure you want to log in as this user? You will be logged out of Admin.")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/impersonate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();

            if (res.ok) {
                // Set User Session
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                toast.success(`Logged in as ${data.user.name}`);
                navigate('/dashboard');
                window.location.reload(); // Force reload to update context/sidebar
            } else {
                toast.error(data.message || 'Ghost login failed');
            }
        } catch (error) {
            console.error('Ghost Login Error:', error);
            toast.error('Network error requesting ghost login');
        }
    };

    return (
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-bold mb-4 text-secondary">User Management</h2>

            {loading ? (
                <p className="text-muted-foreground">Loading users...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-card rounded-lg overflow-hidden border border-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-muted-foreground font-medium">ID</th>
                                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Name</th>
                                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Email</th>
                                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Mobile</th>
                                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Role</th>
                                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Nodes</th>
                                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Balance</th>
                                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Joined</th>
                                <th className="px-4 py-3 text-center text-muted-foreground font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-muted/10 transition">
                                    <td className="px-4 py-3">{user.id}</td>
                                    <td className="px-4 py-3">{user.full_name}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">{user.mobile}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-primary font-semibold">{user.node_count}</td>
                                    <td className="px-4 py-3">₹{user.master_wallet_balance}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleViewNodes(user)}
                                            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors group"
                                            title="View Nodes"
                                        >
                                            <Layers className="w-4 h-4" />
                                        </button>
                                        {user.role !== 'ADMIN' && (
                                            <button
                                                onClick={() => handleGhostLogin(user.id)}
                                                className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors group"
                                                title="Ghost Login"
                                            >
                                                <Ghost className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-4 flex justify-between items-center">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="bg-card border border-border px-4 py-2 rounded disabled:opacity-50 hover:bg-muted transition-colors"
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="bg-card border border-border px-4 py-2 rounded disabled:opacity-50 hover:bg-muted transition-colors"
                >
                    Next
                </button>
            </div>

            {/* User Nodes Modal */}
            <UserNodesModal
                isOpen={isNodesModalOpen}
                onClose={() => setIsNodesModalOpen(false)}
                userId={selectedUser?.id || null}
                userName={selectedUser?.name || ''}
            />
        </div>
    );
};

export default AdminUsers;
