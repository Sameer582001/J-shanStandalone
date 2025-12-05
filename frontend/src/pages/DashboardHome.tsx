import React from 'react';

const DashboardHome: React.FC = () => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Total Earnings</h3>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">$0.00</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Direct Referrals</h3>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Team Size</h3>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">0</p>
                </div>
            </div>
            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <p className="text-gray-500">No recent activity found.</p>
            </div>
        </div>
    );
};

export default DashboardHome;
