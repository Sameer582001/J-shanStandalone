
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Trash2, Plus, Megaphone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface NewsItem {
    id: number;
    title: string;
    content: string;
    is_active: boolean;
    created_at: string;
}

const AdminNews: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchNews = async () => {
        try {
            const res = await api.get('/news'); // Admin route for all news
            setNews(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/news', { title, content });
            setMessage('Announcement published successfully!');
            setTitle('');
            setContent('');
            fetchNews();
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to publish');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await api.delete(`/news/${id}`);
            fetchNews();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
                <Megaphone className="w-6 h-6" />
                News & Announcements
            </h2>

            {/* Create Form */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-card-foreground">Publish New Announcement</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. System Maintenance"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border placeholder-muted-foreground outline-none min-h-[100px]"
                            placeholder="Enter announcement details..."
                            required
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        {loading ? 'Publishing...' : 'Publish Announcement'}
                    </Button>
                </form>
                {message && (
                    <p className={`mt-4 text-sm font-medium ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* News List */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-card-foreground">Active Announcements</h3>
                </div>
                {news.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No announcements found.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {news.map((item) => (
                            <div key={item.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-muted/10 transition">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-foreground text-lg">{item.title}</h4>
                                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{item.content}</p>
                                    <p className="text-xs text-muted-foreground/60 mt-2">
                                        Posted on {new Date(item.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-500/10 transition"
                                    title="Delete"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminNews;
