
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
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

            <Card className="glass-card border-none shadow-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{viewStatus === 'OPEN' ? 'Open Tickets' : 'Resolved History'}</CardTitle>
                        <Badge variant="outline" className="px-3 py-1">
                            {tickets.length} {viewStatus === 'OPEN' ? 'Pending' : 'Resolved'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {tickets.length === 0 ? (
                        <div className="text-center p-12 flex flex-col items-center justify-center space-y-4">
                            <div className={`${viewStatus === 'OPEN' ? 'bg-green-500/10 text-green-500' : 'bg-muted/10 text-muted-foreground'} p-4 rounded-full`}>
                                {viewStatus === 'OPEN' ? <CheckCircle className="h-12 w-12" /> : <History className="h-12 w-12" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {viewStatus === 'OPEN' ? 'All Caught Up!' : 'No History Found'}
                                </h3>
                                <p className="text-muted-foreground">
                                    {viewStatus === 'OPEN' ? 'No open tickets at the moment.' : 'No resolved tickets yet.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md border border-white/10 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead className="w-[200px]">User</TableHead>
                                        <TableHead className="w-[250px]">Subject</TableHead>
                                        <TableHead className="hidden md:table-cell">Date</TableHead>
                                        {viewStatus === 'CLOSED' && <TableHead className="hidden md:table-cell">Closed At</TableHead>}
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.map((ticket) => (
                                        <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{ticket.id}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                        {ticket.user_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span>{ticket.user_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <span className="font-medium">{ticket.subject}</span>
                                                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                                                        {ticket.description}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </TableCell>
                                            {viewStatus === 'CLOSED' && (
                                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                                    {ticket.closed_at ? new Date(ticket.closed_at).toLocaleDateString() : '-'}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-right">
                                                <Button
                                                    onClick={() => setSelectedTicket(ticket)}
                                                    className={`h-8 px-3 text-xs ${viewStatus === 'OPEN' ? "bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none" : "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"}`}
                                                >
                                                    {viewStatus === 'OPEN' ? 'Review & Close' : 'View Details'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
