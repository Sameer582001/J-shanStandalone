
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { CheckCircle, XCircle, History, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminTickets: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewStatus, setViewStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');

    useEffect(() => {
        fetchTickets();
    }, [viewStatus]);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/admin?status=${viewStatus}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            } else {
                toast.error('Failed to load tickets');
            }
        } catch (error) {
            console.error('Error fetching admin tickets:', error);
            toast.error('Network error loading tickets');
        }
    };

    const handleCloseTicket = async () => {
        if (!selectedTicket || !response) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/admin/${selectedTicket.id}/close`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ response })
            });

            if (res.ok) {
                setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
                setSelectedTicket(null);
                setResponse('');
                toast.success('Ticket resolved successfully');
            } else {
                toast.error('Failed to resolve ticket');
            }
        } catch (error) {
            console.error('Error closing ticket:', error);
            toast.error('Error resolving ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                    Support Tickets & History
                </h2>
                <p className="text-muted-foreground">Manage ongoing inquiries and view past resolutions.</p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex bg-muted/30 p-1 rounded-lg w-fit border border-white/5">
                <button
                    onClick={() => setViewStatus('OPEN')}
                    className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-all ${viewStatus === 'OPEN'
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:bg-white/5'
                        }`}
                >
                    <Inbox className="w-4 h-4 mr-2" />
                    Open Pending
                </button>
                <button
                    onClick={() => setViewStatus('CLOSED')}
                    className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-all ${viewStatus === 'CLOSED'
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:bg-white/5'
                        }`}
                >
                    <History className="w-4 h-4 mr-2" />
                    Closed History
                </button>
            </div>

            <Card className="glass-card border border-white/20 shadow-xl overflow-hidden backdrop-blur-md bg-white/60">
                <CardHeader className="bg-primary/5 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                            {viewStatus === 'OPEN' ? <Inbox className="w-5 h-5 text-primary" /> : <History className="w-5 h-5 text-primary" />}
                            {viewStatus === 'OPEN' ? 'Open Tickets' : 'Resolved History'}
                        </CardTitle>
                        <Badge variant="outline" className={`px-3 py-1 border rounded-full ${viewStatus === 'OPEN' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary border-secondary/20'}`}>
                            {tickets.length} {viewStatus === 'OPEN' ? 'Pending' : 'Resolved'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {tickets.length === 0 ? (
                        <div className="text-center p-12 flex flex-col items-center justify-center space-y-4">
                            <div className={`${viewStatus === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/30 text-muted-foreground'} p-6 rounded-full ring-8 ring-white/5`}>
                                {viewStatus === 'OPEN' ? <CheckCircle className="h-12 w-12" /> : <History className="h-12 w-12" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {viewStatus === 'OPEN' ? 'All Caught Up!' : 'No History Found'}
                                </h3>
                                <p className="text-muted-foreground mt-1">
                                    {viewStatus === 'OPEN' ? 'No open tickets at the moment. Great job!' : 'No resolved tickets yet.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-primary/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider w-[80px]">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider w-[200px]">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider hidden md:table-cell">Date</th>
                                        {viewStatus === 'CLOSED' && <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider hidden md:table-cell">Closed At</th>}
                                        <th className="px-6 py-4 text-right text-xs font-bold text-primary uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-primary/5 transition-colors duration-200">
                                            <td className="px-6 py-4 font-mono text-xs font-medium text-muted-foreground">
                                                #{ticket.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-xs font-bold border border-white/20 shadow-sm">
                                                        {ticket.user_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="font-semibold text-sm text-foreground">{ticket.user_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className="font-bold text-sm text-foreground">{ticket.subject}</span>
                                                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                                                        {ticket.description}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-xs font-medium text-muted-foreground">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </td>
                                            {viewStatus === 'CLOSED' && (
                                                <td className="px-6 py-4 hidden md:table-cell text-xs font-medium text-muted-foreground">
                                                    {ticket.closed_at ? new Date(ticket.closed_at).toLocaleDateString() : '-'}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    onClick={() => setSelectedTicket(ticket)}
                                                    className={`h-8 px-4 text-xs font-bold rounded-lg transition-all ${viewStatus === 'OPEN'
                                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
                                                        : "bg-white/50 text-foreground border border-white/20 hover:bg-white/80"}`}
                                                >
                                                    {viewStatus === 'OPEN' ? 'Review' : 'View'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Resolve/View Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    Ticket #{selectedTicket.id}
                                    <Badge variant={selectedTicket.status === 'OPEN' ? 'default' : 'secondary'} className="text-xs font-normal">
                                        {selectedTicket.status}
                                    </Badge>
                                </h3>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>From: {selectedTicket.user_name}</span>
                                    <span>•</span>
                                    <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-md"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                                <p className="font-medium text-lg">{selectedTicket.subject}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                                <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedTicket.description}
                                </div>
                            </div>

                            {/* Show Admin Response if Closed */}
                            {selectedTicket.status === 'CLOSED' && selectedTicket.admin_response ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-green-500 uppercase tracking-wider flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3" /> Resolution
                                    </label>
                                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedTicket.admin_response}
                                        <div className="mt-2 text-[10px] text-muted-foreground border-t border-green-500/20 pt-2">
                                            Resolved on {new Date(selectedTicket.closed_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Show Response Input if Open
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                        Your Response <span className="text-red-500">*</span>
                                    </label>
                                    <Textarea
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        placeholder="Type your resolution here..."
                                        className="min-h-[120px] resize-none focus-visible:ring-primary"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                            <Button
                                className="bg-transparent hover:bg-muted text-foreground"
                                onClick={() => setSelectedTicket(null)}
                            >
                                Close
                            </Button>
                            {selectedTicket.status === 'OPEN' && (
                                <Button
                                    onClick={handleCloseTicket}
                                    disabled={!response || loading}
                                    className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                                >
                                    {loading ? 'Resolving...' : 'Resolve & Close'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTickets;
