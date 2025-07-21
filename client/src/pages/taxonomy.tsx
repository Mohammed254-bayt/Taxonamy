import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaxonomyTree } from "@/components/tree/taxonomy-tree";
import type { TaxonomyGroup } from "@shared/schema";

export default function Taxonomy() {
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<TaxonomyGroup | null>(null);

  const { data: hierarchy, isLoading } = useQuery<TaxonomyGroup[]>({
    queryKey: ["/api/taxonomy-groups/hierarchy"],
  });

  const { data: taxonomyDetails } = useQuery<TaxonomyGroup & { children: TaxonomyGroup[] }>({
    queryKey: ["/api/taxonomy-groups", selectedTaxonomy?.id],
    enabled: !!selectedTaxonomy?.id,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree Navigation */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Taxonomy Hierarchy</h3>
          </div>
          <div className="p-4">
            <TaxonomyTree
              data={hierarchy || []}
              isLoading={isLoading}
              selectedId={selectedTaxonomy?.id}
              onSelect={setSelectedTaxonomy}
            />
          </div>
        </Card>

        {/* Taxonomy Details */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedTaxonomy?.preferredLabelEn || "Select a taxonomy group"}
                  </h3>
                  {selectedTaxonomy?.code && (
                    <p className="text-sm text-gray-500 mt-1">
                      Code: {selectedTaxonomy.code}
                    </p>
                  )}
                </div>
                {selectedTaxonomy && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button size="sm">
                      Add Child
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {selectedTaxonomy ? (
              <div className="p-6 space-y-6">
                {/* Description */}
                {(selectedTaxonomy.definition || selectedTaxonomy.scopeNote) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {selectedTaxonomy.definition || selectedTaxonomy.scopeNote}
                    </div>
                  </div>
                )}

                {/* Multi-language Labels */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Labels</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">English:</span>
                      <p className="text-sm text-gray-900">
                        {selectedTaxonomy.preferredLabelEn}
                      </p>
                    </div>
                    {selectedTaxonomy.preferredLabelAr && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Arabic:</span>
                        <p className="text-sm text-gray-900" dir="rtl">
                          {selectedTaxonomy.preferredLabelAr}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Children */}
                {taxonomyDetails?.children && taxonomyDetails.children.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Child Groups ({taxonomyDetails.children.length})
                    </h4>
                    <div className="space-y-1">
                      {taxonomyDetails.children.map((child) => (
                        <div
                          key={child.id}
                          className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
                          onClick={() => setSelectedTaxonomy(child)}
                        >
                          {child.code && `${child.code} - `}{child.preferredLabelEn}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {taxonomyDetails?.children?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Sub-groups</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedTaxonomy.level || 0}
                      </div>
                      <div className="text-xs text-gray-500">Level</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedTaxonomy.escoLevel || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">ESCO Level</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>Select a taxonomy group from the tree to view details</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
