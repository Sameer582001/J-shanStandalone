import React, { useState } from 'react';
import { UserPlus, Save, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const AdminMigration = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        sponsorCode: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [logs, setLogs] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/admin/migrate-user', formData);
            setSuccess(`Success! User ${formData.email} migrated. Node ID: ${res.data.nodeId}`);
            setLogs(prev => [`[SUCCESS] Migrated ${formData.fullName} (${formData.email}) -> Node ${res.data.referralCode}`, ...prev]);

            // Clear form for next entry
            setFormData({
                fullName: '',
                email: '',
                mobile: '',
                sponsorCode: '' // Keep sponsor? No, likely changes if building depth.
            });
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            setError(msg);
            setLogs(prev => [`[ERROR] Failed ${formData.email}: ${msg}`, ...prev]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Migration Tool</h1>
                    <p className="text-muted-foreground mt-1">Manually re-onboard users from old system.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Entry Form */}
                <div className="glass-panel p-8 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md bg-white/60">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-foreground border-b border-primary/10 pb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        Enter User Details
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-1">Full Name</label>
                            <input
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full bg-white/50 border border-input rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-foreground mb-1">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-white/50 border border-input rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-foreground mb-1">Mobile</label>
                                <input
                                    name="mobile"
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className="w-full bg-white/50 border border-input rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                    placeholder="+91 9876543210"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-foreground mb-1">Sponsor Code (Referral)</label>
                            <input
                                name="sponsorCode"
                                value={formData.sponsorCode}
                                onChange={handleChange}
                                placeholder="e.g. JSE-XXXXXX"
                                className="w-full bg-white/50 border border-input rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all font-mono tracking-wider uppercase placeholder:text-muted-foreground/50 shadow-sm"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-2 ml-1">
                                This user will be placed under this Sponsor in the 3x4 Matrix.
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-sm flex items-start gap-3 shadow-inner">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm flex items-start gap-3 shadow-inner">
                                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="font-medium">{success}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Migrate & Activate Node
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Logs / Instructions */}
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl border border-white/20 bg-white/40 backdrop-blur-md">
                        <h3 className="font-bold mb-3 text-lg text-foreground">How to use:</h3>
                        <ul className="space-y-2 text-sm text-foreground/80">
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span>Enter the <strong className="text-foreground">exact details</strong> from your old database.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span><strong className="text-foreground">Sponsor Code</strong> determines where they sit in the tree.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span>The system will <strong className="text-emerald-600">Auto-Credit ₹1,750</strong> and purchase a node immediately.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span>Password is auto-generated and emailed to them.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span>Tree logic runs normally (Generating commissions for uplines).</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700/50 h-[400px] overflow-y-auto font-mono text-xs shadow-inner custom-scrollbar relative">
                        <h3 className="text-slate-400 mb-4 sticky top-0 bg-slate-900 pb-2 border-b border-slate-800 w-full flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Activity Log
                        </h3>
                        {logs.length === 0 && <span className="text-slate-600 italic block py-4 text-center">Waiting for migration tasks...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-2 p-2 rounded border-l-2 ${log.includes('[ERROR]') ? 'text-rose-300 border-rose-500 bg-rose-900/10' : 'text-emerald-300 border-emerald-500 bg-emerald-900/10'}`}>
                                <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminMigration;
