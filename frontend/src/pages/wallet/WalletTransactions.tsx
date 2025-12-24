import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { ArrowDownLeft, ArrowUpRight, History, Search } from 'lucide-react';

interface Transaction {
    id: number;
    amount: string;
    type: 'CREDIT' | 'DEBIT';
    description: string;
    status: string;
    created_at: string;
}

const WalletTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    useEffect(() => {
        fetchTransactions(1, true);
    }, []);

    const fetchTransactions = async (pageNum: number, isInitial: boolean = false) => {
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await api.get(`/wallet/transactions?page=${pageNum}&limit=${LIMIT}`);
            const newTx = res.data;

            if (newTx.length < LIMIT) {
                setHasMore(false);
            }

            setTransactions(prev => isInitial ? newTx : [...prev, ...newTx]);
            setPage(pageNum);

        } catch (error) {
            console.error('Failed to fetch wallet transactions', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        fetchTransactions(page + 1);
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center">
                        <History className="w-6 h-6 mr-2 text-secondary" />
                        Master Wallet History
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track your deposits, withdrawals, and transfers.
                    </p>
                </div>

                {/* Search / Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-card border border-border text-foreground pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-secondary w-full md:w-64"
                    />
                </div>
            </header>

            {/* Transactions Table */}
            <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Date & Time</th>
                                <th className="px-6 py-4 font-medium">Description</th>
                                <th className="px-6 py-4 font-medium text-center">Type</th>
                                <th className="px-6 py-4 font-medium text-right">Amount</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading && page === 1 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        Loading history...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                            {new Date(tx.created_at).toLocaleString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground">
                                            {tx.description}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {tx.type === 'CREDIT' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400">
                                                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                                                    IN
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-500">
                                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                                    OUT
                                                </span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-bold text-right font-mono ${tx.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 text-xs font-medium rounded bg-muted text-muted-foreground">
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load More Button */}
                {!loading && hasMore && (
                    <div className="px-6 py-4 border-t border-border flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="text-secondary hover:text-secondary/80 text-sm font-medium flex items-center transition-colors disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading...' : 'Load More Transactions'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletTransactions;
