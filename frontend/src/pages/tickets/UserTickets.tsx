
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
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Support Tickets
            </h2>

            {/* Create Ticket Form */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Raise a Concern</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground">Subject</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Briefly describe the issue"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Description</label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide more details..."
                                required
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading ? 'Submitting...' : 'Submit Ticket'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Ticket History */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">My Tickets</h3>
                {tickets.length === 0 ? (
                    <p className="text-muted-foreground">No tickets raised yet.</p>
                ) : (
                    tickets.map((ticket) => (
                        <Card key={ticket.id} className="glass-card overflow-hidden">
                            <div className="p-4 flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-lg">{ticket.subject}</h4>
                                        <Badge variant={ticket.status === 'CLOSED' ? 'secondary' : 'default'}
                                            className={ticket.status === 'OPEN' ? 'bg-green-500' : ''}
                                        >
                                            {ticket.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">{ticket.description}</p>

                                    {ticket.status === 'CLOSED' && ticket.admin_response && (
                                        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-primary mb-1">Admin Response:</p>
                                            <p className="text-sm">{ticket.admin_response}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Closed: {new Date(ticket.closed_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserTickets;
