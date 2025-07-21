import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SynonymsTable } from "@/components/tables/synonyms-table";
import { AddSynonymModal } from "@/components/modals/add-synonym-modal";
import { Download, Plus } from "lucide-react";
import type { Synonym } from "@shared/schema";

interface SynonymsResponse {
  data: Synonym[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TaxonomySource {
  id: number;
  name: string;
}

export default function Synonyms() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch taxonomy sources for the filter dropdown
  const { data: sourcesData } = useQuery<TaxonomySource[]>({
    queryKey: ["/api/taxonomy-sources"],
  });

  const { data, isLoading, refetch } = useQuery<SynonymsResponse>({
    queryKey: [
      "/api/synonyms",
      {
        search: searchTerm,
        language: selectedLanguage === "all" ? "" : selectedLanguage,
        sourceId: selectedSource === "all" || selectedSource === "without-source" ? "" : selectedSource,
        withoutSource: selectedSource === "without-source" ? "true" : "",
        page: currentPage,
        limit: 50,
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


  return (
    <div className="space-y-6">
      <Card>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Synonyms Management</h3>
            <div className="flex space-x-3">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Synonym
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search synonyms..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select value={selectedLanguage} onValueChange={(value) => {
              setSelectedLanguage(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
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
          
          {/* Results count */}
          {!isLoading && data && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {data.data.length} of {data.total.toLocaleString()} synonyms
            </div>
          )}
        </div>

        {/* Table */}
        <SynonymsTable
          data={data?.data || []}
          isLoading={isLoading}
          total={data?.total || 0}
          page={currentPage}
          totalPages={data?.totalPages || 1}
          onPageChange={setCurrentPage}
          onRefresh={refetch}
        />
      </Card>

      <AddSynonymModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          refetch();
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
