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
                <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden h-full">
                    <div className="p-6 border-b border-border bg-muted/20">
                        <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                            <Lock className="w-5 h-5 mr-2 text-primary" />
                            Force User Password Reset
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Reset any user's password without needing their old password.
                        </p>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            {/* Inputs ... (Refactored to be cleaner if needed, but keeping existing structure) */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Target User (ID or Email)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        required
                                        value={userIdOrEmail}
                                        onChange={(e) => setUserIdOrEmail(e.target.value)}
                                        className="block w-full pl-10 rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 outline-none"
                                        placeholder="e.g., 2 or user@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full pl-10 rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 outline-none"
                                        placeholder="Enter new secure password"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            {message && (
                                <div className={`p-3 rounded-md flex items-start text-sm ${message.type === 'success' ? 'bg-green-900/40 text-green-200 border border-green-800' : 'bg-red-900/40 text-red-200 border border-red-800'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2 mt-0.5" /> : <AlertCircle className="w-4 h-4 mr-2 mt-0.5" />}
                                    <span>{message.text}</span>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2 px-4 rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none transition-all ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Node Management Card */}
                <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden h-full flex flex-col">
                    <div className="p-6 border-b border-border bg-muted/20">
                        <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-purple-400" />
                            Node Management
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Critical actions for managing node ownership and structure.
                        </p>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
                        <div className="bg-purple-900/10 border border-purple-800/30 rounded-lg p-4">
                            <h4 className="font-semibold text-purple-200 mb-2">Transfer Ownership</h4>
                            <p className="text-xs text-purple-300/70 mb-4">
                                Transfer a node and all its rebirths to a new user. The wallet balance will also be transferred.
                            </p>
                            <button
                                onClick={() => setShowTransferModal(true)}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                            >
                                Open Transfer Tool
                            </button>
                        </div>
                    </div>
                </div>

                {/* QR Payment Settings Card */}
                <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden h-full flex flex-col md:col-span-2">
                    <div className="p-6 border-b border-border bg-muted/20">
                        <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-yellow-500" />
                            Payment Settings (QR Code)
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
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
