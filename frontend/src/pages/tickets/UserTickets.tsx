
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { toast } from 'react-hot-toast';

const UserTickets: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to load tickets');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ subject, description })
            });

            const data = await res.json();

            if (res.ok) {
                setSubject('');
                setDescription('');
                fetchTickets(); // Refresh list
                toast.success('Ticket submitted successfully!');
            } else {
                toast.error(data.message || 'Failed to submit ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-[calc(100vh-100px)]">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Support Center
                </h2>
                <p className="text-muted-foreground">Raise a ticket and track your requests.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Create Ticket Form - Left Side */}
                <Card className="glass-card lg:col-span-1 h-fit border-white/20 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-primary">New Ticket</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Subject</label>
                                <Input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Brief issue summary"
                                    required
                                    className="bg-white/50 backdrop-blur border-slate-200 focus:border-primary/50 focus:ring-primary/20 text-slate-900 placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Description</label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detailed explanation..."
                                    required
                                    className="min-h-[120px] bg-white/50 backdrop-blur border-slate-200 focus:border-primary/50 focus:ring-primary/20 text-slate-900 placeholder:text-slate-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                            >
                                {loading ? 'Submitting...' : 'Submit Ticket'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Ticket History - Right Side */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-semibold text-foreground px-1">My Tickets</h3>

                    <div className="space-y-3">
                        {tickets.length === 0 ? (
                            <div className="glass-panel p-8 text-center rounded-xl border-dashed border-2 border-slate-300">
                                <p className="text-muted-foreground">No tickets found. Raise one to get started.</p>
                            </div>
                        ) : (
                            tickets.map((ticket) => (
                                <div key={ticket.id} className="glass-panel p-5 rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20 group">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                                    {ticket.subject}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    ID: #{ticket.id} • {new Date(ticket.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <Badge
                                                className={`px-3 py-1 rounded-full font-bold shadow-sm ${ticket.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                                    ticket.status === 'PENDING' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                                        'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                                variant="outline"
                                            >
                                                {ticket.status}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-foreground/80 leading-relaxed bg-white/30 p-3 rounded-lg border border-white/20">
                                            {ticket.description}
                                        </p>

                                        {ticket.status === 'CLOSED' && ticket.admin_response && (
                                            <div className="mt-2 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                                    <p className="text-xs font-bold text-primary uppercase tracking-wide">Admin Response</p>
                                                </div>
                                                <p className="text-sm text-foreground/90 font-medium">
                                                    {ticket.admin_response}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-2 text-right">
                                                    Closed: {new Date(ticket.closed_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTickets;
