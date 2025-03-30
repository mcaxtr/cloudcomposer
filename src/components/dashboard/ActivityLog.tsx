import React from 'react';
import Card from '../ui/Card';
import { Clock } from 'lucide-react';

interface Activity {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
}

interface ActivityLogProps {
  activities: Activity[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  return (
    <Card title="Recent Activity" className="h-full">
      <div className="flow-root">
        <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
          {activities.map((activity) => (
            <li key={activity.id} className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.user}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {activity.action} {activity.resource}
                  </p>
                </div>
                <div className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
                  {activity.timestamp}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default ActivityLog;
