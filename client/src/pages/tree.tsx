import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

// Simple skeleton component for loading state
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}

interface TreeNode {
  id: number;
  name: string;
  type: 'group' | 'occupation';
  hasChildren: boolean;
  childCount: number;
  description?: string;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  onToggle: (node: TreeNode) => void;
  isExpanded: boolean;
  expandedNodes: Set<string>;
}

function TreeItem({ node, level, onToggle, isExpanded, expandedNodes }: TreeItemProps) {
  const entityType = node.type === 'group' ? 'esco_group' : 'occupation';
  const { data: children, isLoading } = useQuery<TreeNode[]>({
    queryKey: [`/api/tree/children/${entityType}/${node.id}`],
    enabled: isExpanded && node.hasChildren,
  });

  console.log(`TreeItem ${node.name}: isExpanded=${isExpanded}, hasChildren=${node.hasChildren}, childrenData=${children?.length || 0}, isLoading=${isLoading}`);

  const handleToggle = () => {
    if (node.hasChildren) {
      console.log(`Toggling node: ${node.name}, current expanded: ${isExpanded}`);
      onToggle(node);
    }
  };

  const getIcon = () => {
    if (node.type === 'group') {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-amber-600" />
      ) : (
        <Folder className="h-4 w-4 text-amber-600" />
      );
    } else {
      return <Briefcase className="h-4 w-4 text-blue-600" />;
    }
  };

  const getExpandIcon = () => {
    if (!node.hasChildren) return <div className="w-4 h-4" />;
    
    return isExpanded ? (
      <ChevronDown className="h-4 w-4 text-gray-500" />
    ) : (
      <ChevronRight className="h-4 w-4 text-gray-500" />
    );
  };

  return (
    <div>
      <div 
        className={`flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleToggle}
      >
        {getExpandIcon()}
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{node.name}</span>
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {node.childCount}
            </span>
          </div>
          {node.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
              {node.description}
            </p>
          )}
        </div>
      </div>
      
      {isExpanded && node.hasChildren && (
        <div>
          {isLoading ? (
            <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            children?.map((child: TreeNode) => (
              <TreeItem
                key={`${child.type}-${child.id}`}
                node={child}
                level={level + 1}
                onToggle={onToggle}
                isExpanded={expandedNodes.has(`${child.type}-${child.id}`)}
                expandedNodes={expandedNodes}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Tree() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data: rootNodes, isLoading, error } = useQuery<TreeNode[]>({
    queryKey: ['/api/tree/roots'],
    retry: 3,
  });

  const handleToggle = (node: TreeNode) => {
    const nodeKey = `${node.type}-${node.id}`;
    console.log(`handleToggle called for ${nodeKey}, current expanded:`, expandedNodes.has(nodeKey));
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeKey)) {
        newSet.delete(nodeKey);
        console.log(`Removing ${nodeKey} from expanded nodes`);
      } else {
        newSet.add(nodeKey);
        console.log(`Adding ${nodeKey} to expanded nodes`);
      }
      console.log(`New expanded nodes:`, Array.from(newSet));
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Taxonomy Tree</h1>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Taxonomy Tree</h1>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            Error loading taxonomy tree. Please try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Taxonomy Tree</h1>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Hierarchical view of occupation groups and classifications
        </span>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">ESCO Taxonomy Structure</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Click on groups to expand and explore the hierarchical classification system
          </p>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto">
          {rootNodes && rootNodes.length > 0 ? (
            <div className="p-2">
              {rootNodes.map((node: TreeNode) => (
                <TreeItem
                  key={`${node.type}-${node.id}`}
                  node={node}
                  level={0}
                  onToggle={handleToggle}
                  isExpanded={expandedNodes.has(`${node.type}-${node.id}`)}
                  expandedNodes={expandedNodes}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No taxonomy data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}