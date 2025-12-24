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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Entry Form */}
                <div className="glass-panel p-6 rounded-xl border border-border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Enter User Details
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                            <input
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full bg-background/50 border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-background/50 border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Mobile</label>
                                <input
                                    name="mobile"
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className="w-full bg-background/50 border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Sponsor Code (Referral)</label>
                            <input
                                name="sponsorCode"
                                value={formData.sponsorCode}
                                onChange={handleChange}
                                placeholder="e.g. JSE-XXXXXX"
                                className="w-full bg-background/50 border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono tracking-wider uppercase"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                This user will be placed under this Sponsor in the 3x4 Matrix.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
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
                    <div className="bg-card/50 p-6 rounded-xl border border-border">
                        <h3 className="font-semibold mb-2">How to use:</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Enter the exact details from your old database.</li>
                            <li><strong>Sponsor Code</strong> determines where they sit in the tree.</li>
                            <li>The system will <strong>Auto-Credit ₹1,750</strong> and purchase a node immediately.</li>
                            <li>Password is auto-generated and emailed to them.</li>
                            <li>Tree logic runs normally (Generating commissions for uplines).</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-6 rounded-xl border border-white/10 h-[300px] overflow-y-auto font-mono text-xs">
                        <h3 className="text-muted-foreground mb-4 sticky top-0 bg-black/40 pb-2 border-b border-white/10 w-full">Activity Log</h3>
                        {logs.length === 0 && <span className="text-muted-foreground/50 italic">No activity yet...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.includes('[ERROR]') ? 'text-red-400' : 'text-green-400'}`}>
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
