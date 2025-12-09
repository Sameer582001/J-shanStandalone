import React, { useEffect, useState } from 'react';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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

    return (
        <div className="bg-gray-800 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">User Management</h2>

            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                        <thead className="bg-gray-600">
                            <tr>
                                <th className="px-4 py-3 text-left">ID</th>
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Email</th>
                                <th className="px-4 py-3 text-left">Mobile</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-left">Nodes</th>
                                <th className="px-4 py-3 text-left">Balance</th>
                                <th className="px-4 py-3 text-left">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-600 transition">
                                    <td className="px-4 py-3">{user.id}</td>
                                    <td className="px-4 py-3">{user.full_name}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">{user.mobile}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-red-500' : 'bg-green-500'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-indigo-400 font-semibold">{user.node_count}</td>
                                    <td className="px-4 py-3">₹{user.master_wallet_balance}</td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
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
                    className="bg-gray-600 px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-500"
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="bg-gray-600 px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-500"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AdminUsers;
