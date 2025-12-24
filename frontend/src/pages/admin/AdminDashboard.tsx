import React from 'react';

const AdminDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">System Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Card 1 */}
                <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-muted-foreground text-sm font-medium uppercase">Total Users</h3>
                    <p className="text-3xl font-bold text-foreground mt-2">1,234</p>
                    <span className="text-green-500 text-sm">+12% from last week</span>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-muted-foreground text-sm font-medium uppercase">Total Nodes</h3>
                    <p className="text-3xl font-bold text-foreground mt-2">856</p>
                    <span className="text-green-500 text-sm">+5% from last week</span>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-muted-foreground text-sm font-medium uppercase">System Revenue</h3>
                    <p className="text-3xl font-bold text-foreground mt-2">₹45,000</p>
                    <span className="text-muted-foreground text-sm">Pending Payouts: ₹12,000</span>
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
