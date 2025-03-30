import React from 'react';
import { FolderTree, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import Card from '../ui/Card';

interface TreeNode {
  id: string;
  name: string;
  type: 'account' | 'region' | 'environment' | 'component' | 'service';
  children?: TreeNode[];
}

interface TerragruntStructureTreeProps {
  data: TreeNode[];
  onNodeSelect?: (node: TreeNode) => void;
}

const TreeNodeComponent: React.FC<{
  node: TreeNode;
  level: number;
  onNodeSelect?: (node: TreeNode) => void;
}> = ({ node, level, onNodeSelect }) => {
  const [isExpanded, setIsExpanded] = React.useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'account':
        return <Folder className="h-4 w-4 text-yellow-500" />;
      case 'region':
        return <Folder className="h-4 w-4 text-green-500" />;
      case 'environment':
        return <Folder className="h-4 w-4 text-blue-500" />;
      case 'component':
        return <Folder className="h-4 w-4 text-purple-500" />;
      case 'service':
        return <Folder className="h-4 w-4 text-red-500" />;
      default:
        return <Folder className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
          level > 0 ? 'ml-6' : ''
        }`}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="mr-1 focus:outline-none"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-4 mr-1"></span>
        )}
        <span className="mr-2">{getNodeIcon()}</span>
        <span className="text-sm">{node.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children?.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onNodeSelect={onNodeSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TerragruntStructureTree: React.FC<TerragruntStructureTreeProps> = ({
  data,
  onNodeSelect,
}) => {
  return (
    <Card title="Terragrunt Structure" className="h-full">
      <div className="flex items-center mb-4">
        <FolderTree className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Directory Structure</h3>
      </div>
      <div className="overflow-auto max-h-96">
        {data.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            level={0}
            onNodeSelect={onNodeSelect}
          />
        ))}
      </div>
    </Card>
  );
};

export default TerragruntStructureTree;
