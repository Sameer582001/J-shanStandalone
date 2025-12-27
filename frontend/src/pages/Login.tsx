import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/login', { mobile, password });
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('role', response.data.data.user.role);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    Sign in to <span className="text-gradient-primary">J-Shan</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Or{' '}
                    <Link to="/register" className="font-medium text-primary hover:text-primary/90">
                        create a new account
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
                        <label htmlFor="mobile" className="sr-only">
                            Phone Number
                        </label>
                        <input
                            id="mobile"
                            name="mobile"
                            type="tel"
                            autoComplete="tel"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-input bg-background/50 text-foreground placeholder-muted-foreground rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                            placeholder="Phone Number"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-input bg-background/50 text-foreground placeholder-muted-foreground rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm pr-10"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none z-20"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <div className="text-sm">
                        <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/90">
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
