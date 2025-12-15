import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/register', {
                fullName,
                email,
                mobile,
                password,
            });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-accent-cyan">Create your account</h2>
                <p className="mt-2 text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-accent-teal hover:text-teal-400">
                        Sign in
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
                        <label htmlFor="fullName" className="sr-only">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-dark-bg text-white placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-accent-teal focus:border-accent-teal focus:z-10 sm:text-sm"
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
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-dark-bg text-white placeholder-gray-500 focus:outline-none focus:ring-accent-teal focus:border-accent-teal focus:z-10 sm:text-sm"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
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
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-dark-bg text-white placeholder-gray-500 focus:outline-none focus:ring-accent-teal focus:border-accent-teal focus:z-10 sm:text-sm"
                            placeholder="Phone Number (e.g., 9876543210)"
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
                            autoComplete="new-password"
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
                        Register
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Register;
