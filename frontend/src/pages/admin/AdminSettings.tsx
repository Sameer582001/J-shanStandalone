import React, { useState } from 'react';
import api from '../../api/axios';
import { Lock, Search, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const AdminSettings: React.FC = () => {
    const [userIdOrEmail, setUserIdOrEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
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
            // Optional: Clear fields? Maybe keep ID for reference.
            setNewPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-accent-cyan flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Admin Settings
            </h2>

            {/* Password Reset Card */}
            <div className="bg-dark-surface rounded-xl shadow-lg border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800 bg-gray-800/20">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-accent-teal" />
                        Force User Password Reset
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Reset any user's password without needing their old password.
                    </p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleResetPassword} className="space-y-6 max-w-lg">

                        {/* Target User Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Target User (ID or Email)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={userIdOrEmail}
                                    onChange={(e) => setUserIdOrEmail(e.target.value)}
                                    className="block w-full pl-10 rounded-md border-gray-700 bg-dark-bg text-white shadow-sm focus:border-accent-teal focus:ring-accent-teal sm:text-sm p-2.5 outline-none placeholder-gray-500"
                                    placeholder="e.g., 2 or user@example.com"
                                />
                            </div>
                        </div>

                        {/* New Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="block w-full pl-10 rounded-md border-gray-700 bg-dark-bg text-white shadow-sm focus:border-accent-teal focus:ring-accent-teal sm:text-sm p-2.5 outline-none placeholder-gray-500"
                                    placeholder="Enter new secure password"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Status Message */}
                        {message && (
                            <div className={`p-4 rounded-md flex items-start ${message.type === 'success' ? 'bg-green-900/40 text-green-200 border border-green-800' : 'bg-red-900/40 text-red-200 border border-red-800'}`}>
                                {message.type === 'success' ? (
                                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">{message.text}</span>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-teal hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Can add more settings cards here later (e.g. System Toggle, Payout Limits) */}
        </div>
    );
};

export default AdminSettings;
