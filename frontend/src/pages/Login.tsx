import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login: React.FC = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
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
                <h2 className="text-3xl font-extrabold text-accent-cyan">Sign in to your account</h2>
                <p className="mt-2 text-sm text-gray-400">
                    Or{' '}
                    <Link to="/register" className="font-medium text-accent-teal hover:text-teal-400">
                        create a new account
                    </Link>
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
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
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-dark-bg text-white placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-accent-teal focus:border-accent-teal focus:z-10 sm:text-sm"
                            placeholder="Phone Number"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-dark-bg text-white placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-accent-teal focus:border-accent-teal focus:z-10 sm:text-sm"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent-teal hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal transition-colors"
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
