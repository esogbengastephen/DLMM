import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface ActivityItem {
  id: string;
  event: string;
  pool: string;
  amount: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'text-[#00d4aa]';
    case 'pending':
      return 'text-yellow-400';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">EVENT</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">POOL</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">AMOUNT</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">TIME</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <span className={getStatusColor(activity.status)}>
                      {activity.event}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">{activity.pool}</td>
                  <td className="py-3 px-4 text-white">{activity.amount}</td>
                  <td className="py-3 px-4 text-gray-400">{activity.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  );
};