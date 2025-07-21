import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, User, ArrowUp, ArrowDown, Tag } from "lucide-react";
import type { Occupation } from "@shared/schema";

interface ViewOccupationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupation: Occupation | null;
}

interface OccupationDetails {
  occupation: Occupation;
  parent: {
    type: 'occupation' | 'esco_group';
    id: number;
    label: string;
    code: string;
  } | null;
  children: Array<{
    id: number;
    preferredLabelEn: string;
    preferredLabelAr: string | null;
    escoCode: string | null;
    synonyms: string[];
  }>;
}

export function ViewOccupationModal({ open, onOpenChange, occupation }: ViewOccupationModalProps) {
  const { data, isLoading } = useQuery<OccupationDetails>({
    queryKey: ["/api/occupations", occupation?.id, "details"],
    queryFn: async ({ queryKey }) => {
      const [, id] = queryKey;
      const response = await fetch(`/api/occupations/${id}/details`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!occupation?.id && open,
  });

  const { data: synonymsData, isLoading: synonymsLoading } = useQuery<Array<{ id: number; title: string }>>({
    queryKey: ["/api/occupations", occupation?.id, "synonyms"],
    queryFn: async ({ queryKey }) => {
      const [, id] = queryKey;
      const response = await fetch(`/api/occupations/${id}/synonyms`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!occupation?.id && open,
  });

  if (!occupation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Occupation Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Separator />
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {data.occupation.preferredLabelEn || "Untitled"}
                </h3>
                {data.occupation.preferredLabelAr && (
                  <p className="text-gray-600 mt-1" dir="rtl">
                    {data.occupation.preferredLabelAr}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ID:</span>
                  <span className="ml-2 text-gray-900">{data.occupation.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">ESCO Code:</span>
                  <span className="ml-2 font-mono text-gray-900">
                    {data.occupation.escoCode || "N/A"}
                  </span>
                </div>
              </div>

              {data.occupation.descriptionEn && (
                <div>
                  <span className="font-medium text-gray-700 block mb-2">Description (EN):</span>
                  <p className="text-gray-900 text-sm leading-relaxed">
                    {data.occupation.descriptionEn}
                  </p>
                </div>
              )}

              {data.occupation.descriptionAr && (
                <div>
                  <span className="font-medium text-gray-700 block mb-2">Description (AR):</span>
                  <p className="text-gray-900 text-sm leading-relaxed" dir="rtl">
                    {data.occupation.descriptionAr}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Synonyms Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Current Synonyms ({synonymsData?.length || 0})
              </h4>
              
              {synonymsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              ) : synonymsData && synonymsData.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {synonymsData.map((synonym) => (
                      <Badge key={synonym.id} variant="secondary" className="text-sm">
                        {synonym.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  No synonyms found for this occupation
                </div>
              )}
            </div>

            <Separator />

            {/* Parent Information */}
            {data.parent && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Parent
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {data.parent.type === 'occupation' ? (
                      <User className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Building2 className="h-4 w-4 text-green-600" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {data.parent.label}
                        </span>
                        <Badge variant={data.parent.type === 'occupation' ? 'default' : 'secondary'}>
                          {data.parent.type === 'occupation' ? 'Occupation' : 'ESCO Group'}
                        </Badge>
                      </div>
                      {data.parent.code && (
                        <span className="text-sm text-gray-500 font-mono">
                          {data.parent.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Children Information */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <ArrowDown className="h-4 w-4" />
                Child Occupations ({data.children.length})
              </h4>
              
              {data.children.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  No child occupations found
                </div>
              ) : (
                <div className="space-y-3">
                  {data.children.map((child) => (
                    <div key={child.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {child.preferredLabelEn || "Untitled"}
                          </h5>
                          {child.preferredLabelAr && (
                            <p className="text-gray-600 text-sm" dir="rtl">
                              {child.preferredLabelAr}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>ID: {child.id}</span>
                          {child.escoCode && (
                            <span className="font-mono">ESCO: {child.escoCode}</span>
                          )}
                        </div>

                        {child.synonyms.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 block mb-1">
                              Synonyms:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {child.synonyms.map((synonym, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {synonym}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load occupation details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}