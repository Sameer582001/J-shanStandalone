import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ShieldAlert } from 'lucide-react';

const AdminLogin: React.FC = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [showInitForm, setShowInitForm] = useState(false);
    const [initData, setInitData] = useState({
        adminMobile: '', adminPassword: '',
        rootName: '', rootEmail: '', rootMobile: '', rootPassword: ''
    });

    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await api.get('/admin/system-status');
                if (res.data.initialized === false) {
                    setShowInitForm(true);
                }
            } catch (error) {
                console.error('Failed to check system status');
            }
        };
        checkStatus();
    }, []);

    const handleInitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/admin/seed-root', initData);
            setShowInitForm(false);
            alert('System Initialized Successfully! Please Login.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Initialization failed');
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/login', { mobile, password });
            const { token, user } = response.data.data;

            if (user.role !== 'ADMIN') {
                setError('Access Denied: Not an Admin Account');
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('role', user.role);
            navigate('/admin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Admin Login failed');
        }
    };

    if (showInitForm) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                            Initialize System
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-400">
                            Create the Root User to begin.
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleInitSubmit}>
                        {error && (
                            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative">
                                {error}
                            </div>
                        )}
                        <div className="bg-gray-800 p-4 rounded-md space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase">1. System Admin (For Login)</h3>
                            <input
                                type="text" required placeholder="Admin Mobile"
                                className="appearance-none block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                value={initData.adminMobile} onChange={e => setInitData({ ...initData, adminMobile: e.target.value })}
                            />
                            <input
                                type="password" required placeholder="Admin Password"
                                className="appearance-none block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                value={initData.adminPassword} onChange={e => setInitData({ ...initData, adminPassword: e.target.value })}
                            />
                        </div>

                        <div className="bg-gray-800 p-4 rounded-md space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase">2. Root User (First Member)</h3>
                            <input
                                type="text" required placeholder="Root User Name"
                                className="appearance-none block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                value={initData.rootName} onChange={e => setInitData({ ...initData, rootName: e.target.value })}
                            />
                            <input
                                type="email" required placeholder="Root User Email"
                                className="appearance-none block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                value={initData.rootEmail} onChange={e => setInitData({ ...initData, rootEmail: e.target.value })}
                            />
                            <input
                                type="text" required placeholder="Root User Mobile (Log in ID)"
                                className="appearance-none block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                value={initData.rootMobile} onChange={e => setInitData({ ...initData, rootMobile: e.target.value })}
                            />
                            <input
                                type="text" required placeholder="Root User Password"
                                className="appearance-none block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                value={initData.rootPassword} onChange={e => setInitData({ ...initData, rootPassword: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                        >
                            Initialize System
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 text-indigo-500 flex justify-center">
                        <ShieldAlert className="w-12 h-12" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Restricted Access
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Authorized Personnel Only
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                    {error && (
                        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="mobile" className="sr-only">
                                Admin ID
                            </label>
                            <input
                                id="mobile"
                                name="mobile"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Admin Mobile"
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
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Authenticate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
