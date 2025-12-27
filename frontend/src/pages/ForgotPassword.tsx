import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Lock, Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success('OTP sent to your email!');
            setStep(2);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            toast.success('Password reset successfully!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative visited-cursor-pointer">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px]" />
            </div>

            <Card className="w-full max-w-md glass-card border-none shadow-2xl relative z-10 bg-white/10 backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                        {step === 1 ? 'Reset Password' : 'New Password'}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm mt-2">
                        {step === 1 ? 'Enter your registered email to receive an OTP.' : 'Enter the code sent to your email.'}
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all rounded-xl font-bold text-lg shadow-lg shadow-primary/25"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5 ml-2" /></>}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">OTP Code</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-center text-2xl tracking-[0.5em] font-mono text-primary font-bold placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white transition-all rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Reset Password <CheckCircle className="w-5 h-5 ml-2" /></>}
                            </Button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-white/50 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Login
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;
