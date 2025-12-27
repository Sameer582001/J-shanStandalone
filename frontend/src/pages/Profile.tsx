
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
    const [addressData, setAddressData] = useState({
        address: '',
        city: '',
        state: '',
        zip: ''
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
            if (res.data.address_line || res.data.address_locked) {
                setAddressData({
                    address: res.data.address_line || '',
                    city: res.data.city || '',
                    state: res.data.state || '',
                    zip: res.data.zip_code || ''
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

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddressData({ ...addressData, [e.target.name]: e.target.value });
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

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('Are you sure? Address details cannot be edited once saved.')) return;

        try {
            await api.put('/profile/address', addressData);
            toast.success('Address saved successfully');
            fetchProfile(); // Refresh to lock
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update address');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading profile...</div>;

    const isLocked = profile?.bank_details_locked;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                My Profile
            </h1>

            {/* Basic Info */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-full bg-primary/20 text-primary">
                        <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-card-foreground">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Full Name</label>
                        <div className="text-lg font-medium text-foreground">{profile?.full_name}</div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">User ID</label>
                        <div className="text-lg font-medium text-foreground">{profile?.id}</div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Email</label>
                        <div className="text-lg font-medium text-foreground">{profile?.email}</div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Mobile</label>
                        <div className="text-lg font-medium text-foreground">{profile?.mobile}</div>
                    </div>
                </div>
            </div>

            {/* Bank Details */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-lg relative">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-card-foreground">Bank Account Details</h2>
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
                            <label className="text-sm text-muted-foreground">Account Holder Name</label>
                            <input
                                type="text"
                                name="account_holder_name"
                                value={formData.account_holder_name}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter account holder name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Account Number</label>
                            <input
                                type="text"
                                name="account_number"
                                value={formData.account_number}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter account number"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">IFSC Code</label>
                            <input
                                type="text"
                                name="ifsc_code"
                                value={formData.ifsc_code}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter IFSC code"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Bank Name</label>
                            <input
                                type="text"
                                name="bank_name"
                                value={formData.bank_name}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter bank name"
                                required
                            />
                        </div>
                    </div>

                    {!isLocked && (
                        <div className="flex items-center gap-4 pt-4 border-t border-border">
                            <div className="flex-1 flex items-center gap-2 text-yellow-500/80 text-sm">
                                <Lock className="w-4 h-4" />
                                <span>Note: Details will be locked after saving.</span>
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Save Details
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Address Details */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-lg relative">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
                            {/* Use Save or a Map icon if imported, reusing Save for now or generic Shield */}
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-card-foreground">Delivery Address</h2>
                    </div>
                    {profile?.address_locked && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
                            <Shield className="w-4 h-4" />
                            <span>Verified & Locked</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleAddressSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Address Line (House No, Street, Area)</label>
                            <input
                                type="text"
                                name="address"
                                value={addressData.address}
                                onChange={handleAddressChange}
                                disabled={profile?.address_locked}
                                className={`w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground ${profile?.address_locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="Enter full address"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={addressData.city}
                                    onChange={handleAddressChange}
                                    disabled={profile?.address_locked}
                                    className={`w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground ${profile?.address_locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="City"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={addressData.state}
                                    onChange={handleAddressChange}
                                    disabled={profile?.address_locked}
                                    className={`w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground ${profile?.address_locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="State"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Zip / Pin Code</label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={addressData.zip}
                                    onChange={handleAddressChange}
                                    disabled={profile?.address_locked}
                                    className={`w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground ${profile?.address_locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="000000"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {!profile?.address_locked && (
                        <div className="flex items-center gap-4 pt-4 border-t border-border">
                            <div className="flex-1 flex items-center gap-2 text-yellow-500/80 text-sm">
                                <Lock className="w-4 h-4" />
                                <span>Note: Address will be locked after saving.</span>
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Save Address
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Profile;
