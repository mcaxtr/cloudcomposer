import React from 'react';
import StatCard from '../components/dashboard/StatCard';
import ActivityLog from '../components/dashboard/ActivityLog';
import S3BucketConfig from '../components/terragrunt/S3BucketConfig';
import { useS3 } from '../context/S3Context';
import { 
  Server, 
  Layers, 
  Globe, 
  Users, 
  AlertTriangle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Link } from 'react-router-dom';

// Mock data
const mockActivities = [
  {
    id: '1',
    user: 'Admin User',
    action: 'Created',
    resource: 'VPC Component in prod',
    timestamp: '5 minutes ago'
  },
  {
    id: '2',
    user: 'Admin User',
    action: 'Updated',
    resource: 'RDS Component in prod',
    timestamp: '1 hour ago'
  },
  {
    id: '3',
    user: 'Admin User',
    action: 'Created',
    resource: 'API Service in prod',
    timestamp: '3 hours ago'
  },
  {
    id: '4',
    user: 'Admin User',
    action: 'Created',
    resource: 'development Account',
    timestamp: '1 day ago'
  },
  {
    id: '5',
    user: 'Admin User',
    action: 'Created',
    resource: 'production Account',
    timestamp: '2 days ago'
  }
];

const DashboardPage: React.FC = () => {
  const { isConfigured } = useS3();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      
      {!isConfigured && (
        <Alert 
          variant="warning" 
          title="S3 Bucket Not Configured"
        >
          Please configure your S3 bucket to start managing Terragrunt infrastructure.
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Accounts"
          value="2"
          icon={<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        />
        <StatCard
          title="Total Regions"
          value="3"
          icon={<Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        />
        <StatCard
          title="Total Components"
          value="4"
          icon={<Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        />
        <StatCard
          title="Total Services"
          value="1"
          icon={<Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isConfigured ? (
          <S3BucketConfig />
        ) : (
          <Card 
            title="Quick Actions" 
            className="h-full"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Manage your infrastructure components and services with these quick actions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/components">
                  <Button 
                    variant="outline" 
                    fullWidth 
                    leftIcon={<Layers className="h-5 w-5" />}
                    rightIcon={<ArrowUpRight className="h-4 w-4" />}
                  >
                    Manage Components
                  </Button>
                </Link>
                
                <Link to="/services">
                  <Button 
                    variant="outline" 
                    fullWidth 
                    leftIcon={<Server className="h-5 w-5" />}
                    rightIcon={<ArrowUpRight className="h-4 w-4" />}
                  >
                    Manage Services
                  </Button>
                </Link>
                
                <Link to="/structure/accounts">
                  <Button 
                    variant="outline" 
                    fullWidth 
                    leftIcon={<Users className="h-5 w-5" />}
                    rightIcon={<ArrowUpRight className="h-4 w-4" />}
                  >
                    Manage Accounts
                  </Button>
                </Link>
                
                <Link to="/structure/regions">
                  <Button 
                    variant="outline" 
                    fullWidth 
                    leftIcon={<Globe className="h-5 w-5" />}
                    rightIcon={<ArrowUpRight className="h-4 w-4" />}
                  >
                    Manage Regions
                  </Button>
                </Link>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Recent Deployments</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">VPC Component</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">prod environment</p>
                      </div>
                    </div>
                    <Badge variant="success">Success</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">RDS Component</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">prod environment</p>
                      </div>
                    </div>
                    <Badge variant="success">Success</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        <ActivityLog activities={mockActivities} />
      </div>
    </div>
  );
};

export default DashboardPage;
