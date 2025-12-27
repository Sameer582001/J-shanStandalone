import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');

    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSendOtp = async () => {
        if (!email) {
            setError('Please enter your email first');
            return;
        }
        setOtpLoading(true);
        setError('');
        try {
            await api.post('/auth/send-otp', { email });
            setOtpSent(true);
            setTimer(30); // 30 second cooldown

            // Simple timer
            const interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!otpSent) {
            setError('Please verify your email first');
            return;
        }
        try {
            await api.post('/auth/register', {
                fullName,
                email,
                mobile,
                otp,
                // Password is auto-generated on backend
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 5000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-green-900/20 border border-green-500 rounded-lg text-center">
                <h3 className="text-xl font-bold text-green-400 mb-2">Registration Successful!</h3>
                <p className="text-slate-300">
                    A secure password has been sent to <strong>{email}</strong>.
                </p>
                <p className="text-sm text-slate-400 mt-4">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    Create <span className="text-gradient-primary">Account</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary hover:text-primary/90">
                        Sign in
                    </Link>
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 px-4 py-3 rounded-xl flex items-center shadow-sm backdrop-blur-sm" role="alert">
                        <span className="block sm:inline font-medium">{error}</span>
                    </div>
                )}
                <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label htmlFor="fullName" className="sr-only">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-input bg-background/50 text-foreground placeholder-muted-foreground rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="email-address" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-input bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* OTP Section */}
                    {otpSent && (
                        <div>
                            <label htmlFor="otp" className="sr-only">
                                Verification Code
                            </label>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-input bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Enter 6-digit Code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="flex justify-end px-1 py-1">
                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpLoading || timer > 0 || !email}
                            className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
                        >
                            {otpLoading ? 'Sending...' : otpSent ? (timer > 0 ? `Resend Check in ${timer}s` : 'Resend Code') : 'Verify Email'}
                        </button>
                    </div>

                    <div>
                        <label htmlFor="mobile" className="sr-only">
                            Phone Number
                        </label>
                        <input
                            id="mobile"
                            name="mobile"
                            type="tel"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-input bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                            placeholder="Phone Number (e.g., 9876543210)"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>

                </div>

                <div>
                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                        Register
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Register;
