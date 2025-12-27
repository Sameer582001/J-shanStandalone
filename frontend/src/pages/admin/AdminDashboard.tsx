import React from 'react';
import { Users, Layers, IndianRupee } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">System Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Card 1 */}
                <div className="glass-card p-6 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="w-24 h-24 text-primary" />
                    </div>
                    <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Users</h3>
                    <div className="flex items-end gap-2 mt-2">
                        <p className="text-4xl font-bold text-foreground">1,234</p>
                        <span className="text-emerald-500 text-sm font-medium mb-1 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">+12%</span>
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="glass-card p-6 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Layers className="w-24 h-24 text-secondary" />
                    </div>
                    <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Nodes</h3>
                    <div className="flex items-end gap-2 mt-2">
                        <p className="text-4xl font-bold text-foreground">856</p>
                        <span className="text-emerald-500 text-sm font-medium mb-1 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">+5%</span>
                    </div>
                </div>

                {/* Stat Card 3 */}
                <div className="glass-card p-6 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <IndianRupee className="w-24 h-24 text-amber-500" />
                    </div>
                    <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">System Revenue</h3>
                    <p className="text-4xl font-bold text-foreground mt-2">₹45,000</p>
                    <p className="text-muted-foreground text-sm mt-1">Pending Payouts: <span className="text-foreground font-medium">₹12,000</span></p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="text-muted-foreground text-sm">
                    <p>No recent activity logs available.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
