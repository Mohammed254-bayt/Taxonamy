import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaxonomyGroup } from "@shared/schema";
import { ChevronDown, ChevronRight, GitBranch, Briefcase, Users, Folder } from "lucide-react";

interface TaxonomyTreeProps {
  data: TaxonomyGroup[];
  isLoading: boolean;
  selectedId?: number;
  onSelect: (taxonomy: TaxonomyGroup) => void;
}

interface TreeNodeProps {
  node: TaxonomyGroup;
  children: TaxonomyGroup[];
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  onSelect: (taxonomy: TaxonomyGroup) => void;
}

function TreeNode({ 
  node, 
  children, 
  level, 
  isSelected, 
  isExpanded, 
  onToggle, 
  onSelect 
}: TreeNodeProps) {
  const hasChildren = children.length > 0;
  const paddingLeft = level * 24;

  const getIcon = () => {
    if (level === 0) return GitBranch;
    if (level === 1) return Briefcase;
    return Users;
  };

  const getIconColor = () => {
    if (level === 0) return "text-red-600";
    if (level === 1) return "text-blue-600";
    return "text-green-600";
  };

  const Icon = getIcon();

  return (
    <div>
      <div
        className={`flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer ${
          isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
        }`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}
        
        <Icon className={`h-4 w-4 ${getIconColor()}`} />
        
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate">
            {node.preferredLabelEn}
          </span>
          {hasChildren && (
            <span className="text-xs text-gray-500 ml-2">
              ({children.length})
            </span>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => {
            const grandChildren = data.filter((item: TaxonomyGroup) => item.parentId === child.id);
            return (
              <TreeNode
                key={child.id}
                node={child}
                children={grandChildren}
                level={level + 1}
                isSelected={selectedId === child.id}
                isExpanded={expandedNodes.has(child.id)}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TaxonomyTree({ data, isLoading, selectedId, onSelect }: TaxonomyTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1, 2])); // Expand first few by default

  const handleToggle = (id: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  // Build hierarchy from flat data
  const buildHierarchy = (items: TaxonomyGroup[]) => {
    const filtered = searchTerm
      ? items.filter(item =>
          item.preferredLabelEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.preferredLabelAr?.includes(searchTerm) ||
          item.code?.includes(searchTerm)
        )
      : items;

    return filtered.filter(item => !item.parentId || item.parentId === 0);
  };

  const rootNodes = buildHierarchy(data);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Input placeholder="Search taxonomy..." disabled />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2 p-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search taxonomy..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="max-h-96 overflow-y-auto space-y-1">
        {rootNodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No taxonomy groups found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          rootNodes.map((node) => {
            const children = data.filter(item => item.parentId === node.id);
            return (
              <TreeNode
                key={node.id}
                node={node}
                children={children}
                level={0}
                isSelected={selectedId === node.id}
                isExpanded={expandedNodes.has(node.id)}
                onToggle={handleToggle}
                onSelect={onSelect}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
