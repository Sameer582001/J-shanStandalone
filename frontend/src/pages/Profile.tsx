
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { User, Shield, Lock, CreditCard, Save } from 'lucide-react';

const Profile: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',
        bank_name: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setProfile(res.data);
            if (res.data.account_number) {
                setFormData({
                    account_holder_name: res.data.account_holder_name || '',
                    account_number: res.data.account_number || '',
                    ifsc_code: res.data.ifsc_code || '',
                    bank_name: res.data.bank_name || ''
                });
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('Are you sure? Bank details cannot be edited once saved.')) return;

        try {
            await api.put('/profile/bank', formData);
            toast.success('Bank details saved successfully');
            fetchProfile(); // Refresh to lock
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update details');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading profile...</div>;

    const isLocked = profile?.bank_details_locked;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-teal to-accent-cyan">
                My Profile
            </h1>

            {/* Basic Info */}
            <div className="bg-dark-surface p-6 rounded-xl border border-gray-800 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-full bg-accent-teal/20 text-accent-teal">
                        <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm text-gray-400">Full Name</label>
                        <div className="text-lg font-medium text-white">{profile?.full_name}</div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-gray-400">User ID</label>
                        <div className="text-lg font-medium text-white">{profile?.id}</div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-gray-400">Email</label>
                        <div className="text-lg font-medium text-white">{profile?.email}</div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-gray-400">Mobile</label>
                        <div className="text-lg font-medium text-white">{profile?.mobile}</div>
                    </div>
                </div>
            </div>

            {/* Bank Details */}
            <div className="bg-dark-surface p-6 rounded-xl border border-gray-800 shadow-lg relative">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Bank Account Details</h2>
                    </div>
                    {isLocked && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
                            <Shield className="w-4 h-4" />
                            <span>Verified & Locked</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Account Holder Name</label>
                            <input
                                type="text"
                                name="account_holder_name"
                                value={formData.account_holder_name}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all text-white placeholder-gray-500 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter account holder name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Account Number</label>
                            <input
                                type="text"
                                name="account_number"
                                value={formData.account_number}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all text-white placeholder-gray-500 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter account number"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">IFSC Code</label>
                            <input
                                type="text"
                                name="ifsc_code"
                                value={formData.ifsc_code}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all text-white placeholder-gray-500 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter IFSC code"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Bank Name</label>
                            <input
                                type="text"
                                name="bank_name"
                                value={formData.bank_name}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all text-white placeholder-gray-500 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter bank name"
                                required
                            />
                        </div>
                    </div>

                    {!isLocked && (
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                            <div className="flex-1 flex items-center gap-2 text-yellow-500/80 text-sm">
                                <Lock className="w-4 h-4" />
                                <span>Note: Details will be locked after saving.</span>
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-teal to-accent-cyan text-black font-semibold shadow-lg shadow-accent-teal/20 hover:shadow-accent-teal/40 transition-all flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Save Details
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Profile;
