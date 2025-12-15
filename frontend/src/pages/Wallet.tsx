import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Wallet as WalletIcon, PlusCircle } from 'lucide-react';

const Wallet: React.FC = () => {
    const [balance, setBalance] = useState<number>(0);
    const [amount, setAmount] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const fetchBalance = async () => {
        try {
            const res = await api.get('/wallet/balance');
            setBalance(Number(res.data.balance) || 0);
        } catch (err) {
            console.error('Failed to fetch balance', err);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, []);

    const handleAddFunds = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val < 100) {
            setMessage('Minimum amount to add is ₹100');
            return;
        }

        try {
            await api.post('/wallet/add-funds', { amount: val });
            setMessage('Funds added successfully!');
            setAmount('');
            fetchBalance();
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to add funds');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-accent-cyan">My Wallet</h2>

            {/* Balance Card */}
            <div className="bg-dark-surface border border-accent-teal/30 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="flex items-center justify-between z-10 relative">
                    <div>
                        <p className="text-accent-teal text-sm font-medium uppercase tracking-wider">Master Wallet Balance</p>
                        <h3 className="text-4xl font-bold mt-2 text-white">₹{(balance || 0).toFixed(2)}</h3>
                    </div>
                    <div className="bg-accent-teal/20 p-3 rounded-full">
                        <WalletIcon className="w-8 h-8 text-accent-cyan" />
                    </div>
                </div>
            </div>

            {/* Add Funds Section */}
            <div className="bg-dark-surface rounded-xl shadow-sm border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Add Funds (Mock)</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
                            Amount (₹)
                        </label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-700 bg-dark-bg text-white shadow-sm focus:border-accent-teal focus:ring-accent-teal sm:text-sm p-2 border placeholder-gray-500 outline-none"
                            placeholder="Enter amount"
                        />
                    </div>
                    <button
                        onClick={handleAddFunds}
                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-teal hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal transition-colors"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Funds
                    </button>
                </div>
                {message && (
                    <p className={`mt-4 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}

            </div>

            {/* Withdraw Section */}
            <div className="bg-dark-surface rounded-xl shadow-sm border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Withdraw Funds</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-2">
                            Request a payout to your bank account. Admin approval required.
                        </p>
                        <a
                            href="/wallet/requests"
                            className="text-accent-cyan text-sm font-semibold hover:underline"
                        >
                            View Request History
                        </a>
                    </div>
                    <a
                        href="/wallet/requests"
                        className="flex items-center justify-center px-4 py-2 border border-accent-teal/50 text-sm font-medium rounded-md text-accent-cyan bg-dark-bg hover:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal transition-colors"
                    >
                        Request Payout
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Wallet;
