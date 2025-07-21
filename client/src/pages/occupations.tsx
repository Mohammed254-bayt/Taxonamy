import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OccupationsTable } from "@/components/tables/occupations-table";
import { AddOccupationModal } from "@/components/modals/add-occupation-modal";
import { EditOccupationModal } from "@/components/modals/edit-occupation-modal";
import { ViewOccupationModal } from "@/components/modals/view-occupation-modal";
import { Download, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Occupation } from "@shared/schema";

interface OccupationsResponse {
  data: Occupation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TaxonomySource {
  id: number;
  name: string;
}

export default function Occupations() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [showUnlinkedOnly, setShowUnlinkedOnly] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSource, showUnlinkedOnly]);

  // Fetch taxonomy sources for the filter dropdown
  const { data: sourcesData } = useQuery<TaxonomySource[]>({
    queryKey: ["/api/taxonomy-sources"],
  });

  const { data, isLoading, refetch } = useQuery<OccupationsResponse>({
    queryKey: [
      "/api/occupations",
      {
        search: searchTerm,
        sourceId: selectedSource === "all" || selectedSource === "without-source" ? "" : selectedSource,
        withoutSource: selectedSource === "without-source" ? "true" : "",
        page: currentPage,
        limit: 50,
        unlinked: showUnlinkedOnly,
      },
    ],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      
      Object.entries(params as Record<string, any>).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });

      const response = await fetch(`${url}?${searchParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  const handleEdit = (occupation: Occupation) => {
    setSelectedOccupation(occupation);
    setShowEditModal(true);
  };

  const handleView = (occupation: Occupation) => {
    setSelectedOccupation(occupation);
    setShowViewModal(true);
  };



  return (
    <div className="space-y-6">
      <Card>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Occupations Management</h3>
              <p className="text-sm text-gray-500 mt-1">
                {isLoading ? "Loading..." : (
                  showUnlinkedOnly 
                    ? `${data?.total || 0} unlinked occupations found${searchTerm ? ` matching "${searchTerm}"` : ""}`
                    : `${data?.total || 0} occupations found${searchTerm ? ` matching "${searchTerm}"` : ""}`
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Occupation
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Search occupations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedSource} onValueChange={(value) => {
                setSelectedSource(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="without-source">Without Source</SelectItem>
                  {sourcesData?.map((source) => (
                    <SelectItem key={source.id} value={source.id.toString()}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unlinked-filter"
                checked={showUnlinkedOnly}
                onCheckedChange={(checked) => setShowUnlinkedOnly(checked === true)}
              />
              <Label htmlFor="unlinked-filter" className="text-sm text-gray-700">
                Show unlinked occupations only
              </Label>
            </div>
          </div>
        </div>

        {/* Table */}
        <OccupationsTable
          data={data?.data || []}
          isLoading={isLoading}
          total={data?.total || 0}
          page={currentPage}
          totalPages={data?.totalPages || 1}
          onPageChange={setCurrentPage}
          onRefresh={refetch}
          onEdit={handleEdit}
          onView={handleView}
        />
      </Card>

      <AddOccupationModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          refetch();
          setShowAddModal(false);
        }}
      />

      {selectedOccupation && (
        <EditOccupationModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          occupation={selectedOccupation}
          onSuccess={() => {
            refetch();
            setShowEditModal(false);
            setSelectedOccupation(null);
          }}
        />
      )}

      <ViewOccupationModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        occupation={selectedOccupation}
      />
    </div>
  );
}
