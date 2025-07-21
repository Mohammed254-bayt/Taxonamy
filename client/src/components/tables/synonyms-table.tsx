import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Synonym } from "@shared/schema";
import { Edit, Trash2, Languages } from "lucide-react";
import { EditSynonymModal } from "@/components/modals/edit-synonym-modal";

interface SynonymWithSource extends Synonym {
  sourceName?: string | null;
  sourceId?: number | null;
}

interface SynonymsTableProps {
  data: SynonymWithSource[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const getLanguageLabel = (lang: string) => {
  switch (lang) {
    case "en":
      return "English";
    case "ar":
      return "العربية";
    default:
      return lang.toUpperCase();
  }
};

const getLanguageColor = (lang: string) => {
  switch (lang) {
    case "en":
      return "bg-blue-100 text-blue-800";
    case "ar":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function SynonymsTable({
  data,
  isLoading,
  total,
  page,
  totalPages,
  onPageChange,
  onRefresh,
}: SynonymsTableProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingSynonym, setEditingSynonym] = useState<Synonym | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/synonyms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/synonyms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Synonym deleted successfully" });
      onRefresh();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete synonym", variant: "destructive" });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id));
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this synonym?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (synonym: Synonym) => {
    setEditingSynonym(synonym);
    setIsEditModalOpen(true);
  };

  const renderPagination = () => {
    const pages = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <span>
              Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            
            {startPage > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                >
                  1
                </Button>
                {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
              </>
            )}
            
            {pages.map(pageNum => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
            
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length === data.length && data.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No synonyms found
                </TableCell>
              </TableRow>
            ) : (
              data.map((synonym) => (
                <TableRow key={synonym.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(synonym.id)}
                      onCheckedChange={(checked) => 
                        handleSelectItem(synonym.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Languages className="h-4 w-4 text-gray-400" />
                      <span 
                        className="text-sm font-medium text-gray-900"
                        dir={synonym.language === "ar" ? "rtl" : "ltr"}
                      >
                        {synonym.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getLanguageColor(synonym.language)}
                    >
                      {getLanguageLabel(synonym.language)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {synonym.sourceName ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {synonym.sourceName}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No source</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(synonym.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(synonym)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(synonym.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 0 && renderPagination()}
      
      <EditSynonymModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        synonym={editingSynonym}
        onSuccess={onRefresh}
      />
    </div>
  );
}
