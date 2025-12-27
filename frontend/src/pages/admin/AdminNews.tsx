
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Trash2, Plus, Megaphone } from 'lucide-react';


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
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <Megaphone className="w-6 h-6 text-primary" />
                </div>
                News & Announcements
            </h2>

            {/* Create Form */}
            <div className="glass-card p-8 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md bg-white/60">
                <h3 className="text-xl font-bold mb-6 text-foreground border-b border-primary/10 pb-4">Publish New Announcement</h3>
                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-1">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. System Maintenance"
                            className="w-full bg-white/50 border border-input rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-1">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-white/50 border border-input rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm min-h-[120px] resize-none"
                            placeholder="Enter announcement details..."
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? 'Publishing...' : (
                            <>
                                <Plus className="w-5 h-5" />
                                Publish Announcement
                            </>
                        )}
                    </button>
                </form>
                {message && (
                    <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${message.includes('success')
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
                        {message}
                    </div>
                )}
            </div>

            {/* News List */}
            <div className="glass-card rounded-2xl border border-white/20 shadow-xl overflow-hidden backdrop-blur-md bg-white/60">
                <div className="px-8 py-6 border-b border-primary/10 bg-primary/5">
                    <h3 className="text-lg font-bold text-foreground">Active Announcements</h3>
                </div>
                {news.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <Megaphone className="w-8 h-8 opacity-20" />
                        </div>
                        <p>No active announcements found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {news.map((item) => (
                            <div key={item.id} className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-white/40 transition-colors group">
                                <div className="space-y-2 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-primary text-xl">{item.title}</h4>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-white/20 bg-white/30 px-2 py-0.5 rounded-full">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-foreground/80 text-sm whitespace-pre-wrap leading-relaxed max-w-4xl">{item.content}</p>
                                    <p className="text-xs text-muted-foreground/60">
                                        Posted on {new Date(item.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-rose-400 hover:text-rose-600 p-3 rounded-xl hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
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
