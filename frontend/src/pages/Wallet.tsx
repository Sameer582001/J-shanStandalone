import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Wallet as WalletIcon, PlusCircle } from 'lucide-react';

const Wallet: React.FC = () => {
    const [balance, setBalance] = useState<number>(0);

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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-secondary">My Wallet</h2>

            {/* Balance Card */}
            <div className="bg-card border border-primary/30 rounded-xl shadow-lg p-6 text-card-foreground relative overflow-hidden">
                <div className="flex items-center justify-between z-10 relative">
                    <div>
                        <p className="text-primary text-sm font-medium uppercase tracking-wider">Master Wallet Balance</p>
                        <h3 className="text-4xl font-bold mt-2 text-foreground">₹{(balance || 0).toFixed(2)}</h3>
                    </div>
                    <div className="bg-primary/20 p-3 rounded-full">
                        <WalletIcon className="w-8 h-8 text-secondary" />
                    </div>
                </div>
            </div>

            {/* Add Funds Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Add Funds</h3>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                            Add funds to your Master Wallet using QR Code or UPI.
                        </p>
                    </div>
                    <a
                        href="/wallet/add-funds"
                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Money
                    </a>
                </div>
            </div>

            {/* Withdraw Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Withdraw Funds</h3>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                            Request a payout to your bank account. Admin approval required.
                        </p>
                        <a
                            href="/wallet/requests"
                            className="text-secondary text-sm font-semibold hover:underline"
                        >
                            View Request History
                        </a>
                    </div>
                    <a
                        href="/wallet/requests"
                        className="flex items-center justify-center px-4 py-2 border border-primary/50 text-sm font-medium rounded-md text-secondary bg-background hover:bg-card focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                        Request Payout
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Wallet;
