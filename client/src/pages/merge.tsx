import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Occupation } from "../../../shared/schema";

export default function Merge() {
  const [sourceOccupationId, setSourceOccupationId] = useState<string>("");
  const [targetOccupationId, setTargetOccupationId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [targetSearchTerm, setTargetSearchTerm] = useState("");
  const [showAllSourceSynonyms, setShowAllSourceSynonyms] = useState(false);
  const [showAllTargetSynonyms, setShowAllTargetSynonyms] = useState(false);
  const { toast } = useToast();

  // Fetch occupations for source selection
  const { data: occupationsData } = useQuery({
    queryKey: ["/api/occupations", { search: searchTerm, limit: 100 }],
    queryFn: () => 
      fetch(`/api/occupations?search=${encodeURIComponent(searchTerm)}&limit=100`)
        .then(res => res.json())
  });

  // Fetch occupations for target selection
  const { data: targetOccupationsData } = useQuery({
    queryKey: ["/api/occupations", { search: targetSearchTerm, limit: 100 }],
    queryFn: () => 
      fetch(`/api/occupations?search=${encodeURIComponent(targetSearchTerm)}&limit=100`)
        .then(res => res.json())
  });

  const occupations = occupationsData?.data || [];
  const targetOccupations = targetOccupationsData?.data || [];

  // Get source occupation details
  const { data: sourceOccupation } = useQuery({
    queryKey: ["/api/occupations", sourceOccupationId],
    queryFn: () => 
      fetch(`/api/occupations/${sourceOccupationId}`)
        .then(res => res.json()),
    enabled: !!sourceOccupationId
  });

  // Get target occupation details  
  const { data: targetOccupation } = useQuery({
    queryKey: ["/api/occupations", targetOccupationId],
    queryFn: () => 
      fetch(`/api/occupations/${targetOccupationId}`)
        .then(res => res.json()),
    enabled: !!targetOccupationId
  });

  // Get source occupation synonyms
  const { data: sourceSynonyms } = useQuery({
    queryKey: ["/api/occupations", sourceOccupationId, "synonyms"],
    queryFn: () => 
      fetch(`/api/occupations/${sourceOccupationId}/synonyms`)
        .then(res => res.json()),
    enabled: !!sourceOccupationId
  });

  // Get target occupation synonyms
  const { data: targetSynonyms } = useQuery({
    queryKey: ["/api/occupations", targetOccupationId, "synonyms"],
    queryFn: () => 
      fetch(`/api/occupations/${targetOccupationId}/synonyms`)
        .then(res => res.json()),
    enabled: !!targetOccupationId
  });

  const mergeMutation = useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: string, targetId: string }) => {
      const response = await fetch("/api/occupations/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: parseInt(sourceId), targetId: parseInt(targetId) })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to merge occupations");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Occupations merged successfully"
      });
      setSourceOccupationId("");
      setTargetOccupationId("");
      queryClient.invalidateQueries({ queryKey: ["/api/occupations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tree"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleMerge = () => {
    if (!sourceOccupationId || !targetOccupationId) {
      toast({
        title: "Error",
        description: "Please select both source and target occupations",
        variant: "destructive"
      });
      return;
    }

    if (sourceOccupationId === targetOccupationId) {
      toast({
        title: "Error", 
        description: "Cannot merge an occupation with itself",
        variant: "destructive"
      });
      return;
    }

    mergeMutation.mutate({ sourceId: sourceOccupationId, targetId: targetOccupationId });
  };

  const canMerge = sourceOccupationId && targetOccupationId && sourceOccupationId !== targetOccupationId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Merge Occupations</h1>
        <p className="text-muted-foreground">
          Merge two occupations by transferring synonyms from source to target and deleting the source.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Occupation Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Source Occupation (will be deleted)
            </CardTitle>
            <CardDescription>
              Select the occupation to merge from. This occupation will be deleted after the merge.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Occupations</Label>
              <Input
                id="search"
                placeholder="Type to search occupations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source">Source Occupation</Label>
              <Select value={sourceOccupationId} onValueChange={setSourceOccupationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source occupation" />
                </SelectTrigger>
                <SelectContent>
                  {occupations.map((occupation: Occupation) => (
                    <SelectItem key={occupation.id} value={occupation.id.toString()}>
                      {occupation.preferredLabelEn || occupation.preferredLabelAr || `Occupation ${occupation.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sourceOccupation && (
              <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <h4 className="font-medium text-red-900">{sourceOccupation.preferredLabelEn}</h4>
                {sourceOccupation.preferredLabelAr && (
                  <p className="text-sm text-red-700">{sourceOccupation.preferredLabelAr}</p>
                )}
                {sourceOccupation.escoCode && (
                  <Badge variant="outline" className="mt-2">
                    {sourceOccupation.escoCode}
                  </Badge>
                )}
                
                {sourceSynonyms && sourceSynonyms.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-800">
                      Current Synonyms ({sourceSynonyms.length}):
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(showAllSourceSynonyms ? sourceSynonyms : sourceSynonyms.slice(0, 30)).map((synonym: any) => (
                        <Badge key={synonym.id} variant="secondary" className="text-xs">
                          {synonym.title}
                        </Badge>
                      ))}
                    </div>
                    {sourceSynonyms.length > 30 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-red-600 text-xs mt-1"
                        onClick={() => setShowAllSourceSynonyms(!showAllSourceSynonyms)}
                      >
                        {showAllSourceSynonyms ? 'Show less' : `Show ${sourceSynonyms.length - 30} more`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Occupation Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-green-500" />
              Target Occupation (will be kept)
            </CardTitle>
            <CardDescription>
              Select the occupation to merge into. This occupation will receive the synonyms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-search">Search Target Occupations</Label>
              <Input
                id="target-search"
                placeholder="Type to search target occupations..."
                value={targetSearchTerm}
                onChange={(e) => setTargetSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target">Target Occupation</Label>
              <Select value={targetOccupationId} onValueChange={setTargetOccupationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target occupation" />
                </SelectTrigger>
                <SelectContent>
                  {targetOccupations.map((occupation: Occupation) => (
                    <SelectItem 
                      key={occupation.id} 
                      value={occupation.id.toString()}
                      disabled={occupation.id.toString() === sourceOccupationId}
                    >
                      {occupation.preferredLabelEn || occupation.preferredLabelAr || `Occupation ${occupation.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetOccupation && (
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <h4 className="font-medium text-green-900">{targetOccupation.preferredLabelEn}</h4>
                {targetOccupation.preferredLabelAr && (
                  <p className="text-sm text-green-700">{targetOccupation.preferredLabelAr}</p>
                )}
                {targetOccupation.escoCode && (
                  <Badge variant="outline" className="mt-2">
                    {targetOccupation.escoCode}
                  </Badge>
                )}
                
                {targetSynonyms && targetSynonyms.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-800">
                      Current Synonyms ({targetSynonyms.length}):
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(showAllTargetSynonyms ? targetSynonyms : targetSynonyms.slice(0, 30)).map((synonym: any) => (
                        <Badge key={synonym.id} variant="secondary" className="text-xs">
                          {synonym.title}
                        </Badge>
                      ))}
                    </div>
                    {targetSynonyms.length > 30 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-green-600 text-xs mt-1"
                        onClick={() => setShowAllTargetSynonyms(!showAllTargetSynonyms)}
                      >
                        {showAllTargetSynonyms ? 'Show less' : `Show ${targetSynonyms.length - 30} more`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Merge Preview and Action */}
      {canMerge && (
        <Card>
          <CardHeader>
            <CardTitle>Merge Preview</CardTitle>
            <CardDescription>
              Review the merge operation before proceeding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action cannot be undone. The source occupation will be permanently deleted,
                and its labels and synonyms will be transferred to the target occupation.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Badge variant="destructive">Source (Delete)</Badge>
                  <p className="text-sm mt-1">{sourceOccupation?.preferredLabelEn}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <Badge variant="default">Target (Keep)</Badge>
                  <p className="text-sm mt-1">{targetOccupation?.preferredLabelEn}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-center">
              <Button 
                onClick={handleMerge}
                disabled={mergeMutation.isPending}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {mergeMutation.isPending ? "Merging..." : "Confirm Merge"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}