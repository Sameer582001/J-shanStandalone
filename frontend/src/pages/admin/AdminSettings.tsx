import React, { useState } from 'react';
import api from '../../api/axios';
import { Lock, Search, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { TransferNodeModal } from './TransferNodeModal';

const AdminSettings: React.FC = () => {
    const [userIdOrEmail, setUserIdOrEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        // ... (existing code)
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Determine if input is ID or Email
            const payload: any = { newPassword };
            if (userIdOrEmail.includes('@')) {
                payload.email = userIdOrEmail;
            } else {
                payload.userId = userIdOrEmail;
            }

            const res = await api.post('/admin/reset-password', payload);
            setMessage({ type: 'success', text: res.data.message || 'Password reset successfully' });
            setNewPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-secondary flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Admin Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Password Reset Card */}
                <div className="glass-card rounded-2xl shadow-xl border border-white/20 overflow-hidden backdrop-blur-md bg-white/60 h-full">
                    <div className="p-6 border-b border-primary/10 bg-primary/5">
                        <h3 className="text-lg font-bold text-foreground flex items-center">
                            <div className="p-2 bg-primary/10 rounded-lg mr-3">
                                <Lock className="w-5 h-5 text-primary" />
                            </div>
                            Force User Password Reset
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 ml-12">
                            Reset any user's password without needing their old password.
                        </p>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Target User (ID or Email)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        required
                                        value={userIdOrEmail}
                                        onChange={(e) => setUserIdOrEmail(e.target.value)}
                                        className="block w-full pl-10 px-4 py-3 rounded-xl border border-input bg-white/50 text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="e.g., 2 or user@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full pl-10 px-4 py-3 rounded-xl border border-input bg-white/50 text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Enter new secure password"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            {message && (
                                <div className={`p-4 rounded-xl flex items-start text-sm border backdrop-blur-sm shadow-sm ${message.type === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-700 border-rose-500/20'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />}
                                    <span className="font-medium">{message.text}</span>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary hover:shadow-primary/25 transform transition-all hover:-translate-y-0.5 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Node Management Card */}
                <div className="glass-card rounded-2xl shadow-xl border border-white/20 overflow-hidden backdrop-blur-md bg-white/60 h-full flex flex-col">
                    <div className="p-6 border-b border-purple-500/10 bg-purple-500/5">
                        <h3 className="text-lg font-bold text-foreground flex items-center">
                            <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
                                <Shield className="w-5 h-5 text-purple-600" />
                            </div>
                            Node Management
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 ml-12">
                            Critical actions for managing node ownership and structure.
                        </p>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
                        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                            <h4 className="font-bold text-purple-900 mb-2 text-lg">Transfer Ownership</h4>
                            <p className="text-sm text-purple-700/80 mb-6 leading-relaxed">
                                Transfer a node and all its rebirths to a new user. The wallet balance will also be transferred to the new owner.
                            </p>
                            <button
                                onClick={() => setShowTransferModal(true)}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-200 hover:shadow-purple-300 flex items-center justify-center transform hover:-translate-y-0.5"
                            >
                                Open Transfer Tool
                            </button>
                        </div>
                    </div>
                </div>

                {/* QR Payment Settings Card */}
                <div className="glass-card rounded-2xl shadow-xl border border-white/20 overflow-hidden backdrop-blur-md bg-white/60 h-full flex flex-col md:col-span-2">
                    <div className="p-6 border-b border-amber-500/10 bg-amber-500/5">
                        <h3 className="text-lg font-bold text-foreground flex items-center">
                            <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
                                <Shield className="w-5 h-5 text-amber-600" />
                            </div>
                            Payment Settings (QR Code)
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 ml-12">
                            Manage the QR Code and UPI ID displayed to users for adding funds.
                        </p>
                    </div>
                    <div className="p-6">
                        <QrSettingsForm />
                    </div>
                </div>
            </div>

            <TransferNodeModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
        </div>
    );
};

// Internal Component for QR Form
function QrSettingsForm() {
    const [payeeName, setPayeeName] = useState('');
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        // Fetch current settings
        const fetchSettings = async () => {
            try {
                const res = await api.get('/funds/qr');
                setPayeeName(res.data.payeeName || '');
                setUpiId(res.data.upiId || '');
            } catch (error) {
                console.error('Error fetching QR settings', error);
            }
        };
        fetchSettings();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await api.post('/funds/admin/qr', { payeeName, upiId });
            setMessage({ type: 'success', text: 'Payment Settings updated successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Payee Name (Checking Name)</label>
                    <input
                        type="text"
                        value={payeeName}
                        onChange={e => setPayeeName(e.target.value)}
                        className="w-full bg-background border border-input rounded px-3 py-2 text-foreground outline-none focus:border-primary"
                        placeholder="e.g. John Doe / My Business"
                    />
                    <p className="text-xs text-muted-foreground mt-1">This name will appear when users scan the QR.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">UPI ID (Required)</label>
                    <input
                        type="text"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        className="w-full bg-background border border-input rounded px-3 py-2 text-foreground outline-none focus:border-primary"
                        placeholder="merchant@upi"
                        required
                    />
                </div>
            </div>
            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-900/40 text-green-200' : 'bg-red-900/40 text-red-200'}`}>
                    {message.text}
                </div>
            )}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded shadow-lg transition-colors"
                >
                    {loading ? 'Saving...' : 'Save Payment Settings'}
                </button>
            </div>
        </form>
    );
}

export default AdminSettings;
