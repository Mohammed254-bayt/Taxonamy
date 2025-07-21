import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Occupation, Synonym } from "@shared/schema";
import { X, Plus } from "lucide-react";

interface EditOccupationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupation: Occupation;
  onSuccess?: () => void;
}

export function EditOccupationModal({ open, onOpenChange, occupation, onSuccess }: EditOccupationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    escoCode: occupation.escoCode || "",
    uri: occupation.uri || "",
    scopeNote: occupation.scopeNote || "",
    preferredLabelEn: occupation.preferredLabelEn || "",
    preferredLabelAr: occupation.preferredLabelAr || "",
    definition: occupation.definition || "",
    descriptionAr: occupation.descriptionAr || "",
    descriptionEn: occupation.descriptionEn || "",
    gstId: occupation.gstId || "",
    isGenericTitle: occupation.isGenericTitle || false,
    minCareerLevel: occupation.minCareerLevel?.toString() || "none",
    maxCareerLevel: occupation.maxCareerLevel?.toString() || "none",
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Confirmation state for destructive actions
  const [synonymToDelete, setSynonymToDelete] = useState<Synonym | null>(null);
  const [relationshipChangeConfirm, setRelationshipChangeConfirm] = useState<{
    oldRelation: any;
    newRelation: any;
  } | null>(null);
  
  // Synonym management state
  const [occupationSynonyms, setOccupationSynonyms] = useState<Synonym[]>([]);
  const [newSynonymEn, setNewSynonymEn] = useState("");
  const [availableSynonyms, setAvailableSynonyms] = useState<Synonym[]>([]);
  const [synonymSearchTerm, setSynonymSearchTerm] = useState("");
  
  // Relationship management state - matching Add form structure
  const [relationType, setRelationType] = useState<"group" | "occupation" | "">("");
  const [selectedRelation, setSelectedRelation] = useState<{
    id: number; 
    name: string; 
    type: "group" | "occupation"; 
    relationshipType: "contains" | "contained_by";
  } | null>(null);
  const [relationSearch, setRelationSearch] = useState("");
  
  // Source selection state
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [currentSourceMapping, setCurrentSourceMapping] = useState<any | null>(null);

  // Fetch occupation's current synonyms
  const { data: synonymRelationships } = useQuery({
    queryKey: ["/api/occupations", occupation.id, "synonyms"],
    queryFn: () => 
      fetch(`/api/occupations/${occupation.id}/synonyms`, {
        credentials: "include",
      }).then(res => res.json()),
    enabled: open,
  });

  // Fetch occupation's current taxonomy relationships
  const { data: taxonomyRelationships } = useQuery({
    queryKey: ["/api/taxonomy-relationships", occupation.id],
    enabled: open,
  });

  // Fetch available synonyms for adding
  const { data: synonymsData } = useQuery({
    queryKey: ["/api/synonyms", { search: synonymSearchTerm }],
    enabled: open,
  });

  // Fetch taxonomy groups for relations - matching Add form
  const { data: taxonomyGroupsData } = useQuery({
    queryKey: ["/api/taxonomy-groups", { search: relationSearch }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      Object.entries(params as Record<string, any>).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });

      const response = await fetch(`${url}?${searchParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch taxonomy groups");
      return response.json();
    },
    enabled: open && relationType === "group",
  });

  // Fetch occupations for relations - matching Add form
  const { data: occupationsData } = useQuery({
    queryKey: ["/api/occupations", { search: relationSearch, limit: 50 }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      Object.entries(params as Record<string, any>).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });

      const response = await fetch(`${url}?${searchParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch occupations");
      return response.json();
    },
    enabled: open && relationType === "occupation",
  });

  // Fetch taxonomy sources for source selection
  const { data: sourcesData } = useQuery({
    queryKey: ["/api/taxonomy-sources"],
    queryFn: async () => {
      const response = await fetch("/api/taxonomy-sources", {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch taxonomy sources");
      return response.json();
    },
    enabled: open,
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        escoCode: occupation.escoCode || "",
        uri: occupation.uri || "",
        scopeNote: occupation.scopeNote || "",
        preferredLabelEn: occupation.preferredLabelEn || "",
        preferredLabelAr: occupation.preferredLabelAr || "",
        definition: occupation.definition || "",
        descriptionAr: occupation.descriptionAr || "",
        descriptionEn: occupation.descriptionEn || "",
        gstId: occupation.gstId || "",
        isGenericTitle: occupation.isGenericTitle || false,
        minCareerLevel: occupation.minCareerLevel?.toString() || "none",
        maxCareerLevel: occupation.maxCareerLevel?.toString() || "none",
      });
      setShowConfirmation(false);
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
    }
  }, [open, occupation]);

  // Load occupation synonyms when modal opens
  useEffect(() => {
    if (open && synonymRelationships) {
      console.log("Synonym relationships data:", synonymRelationships);
      if (Array.isArray(synonymRelationships)) {
        setOccupationSynonyms(synonymRelationships);
      }
    }
  }, [open, synonymRelationships]);

  // Load current relationship when modal opens
  useEffect(() => {
    if (open && taxonomyRelationships && Array.isArray(taxonomyRelationships)) {
      const relationship = taxonomyRelationships.find((rel: any) => 
        rel.sourceEntityType === "occupation" && rel.sourceEntityId === occupation.id
      );
      
      if (relationship) {
        setSelectedRelation({
          id: relationship.targetEntityId,
          name: relationship.targetEntityType === "esco_group" ? "Group" : "Occupation",
          type: relationship.targetEntityType === "esco_group" ? "group" : "occupation",
          relationshipType: relationship.relationshipType
        });
        setRelationType(relationship.targetEntityType === "esco_group" ? "group" : "occupation");
      }
    }
  }, [open, taxonomyRelationships, occupation.id]);

  // Load current source mapping when modal opens
  useEffect(() => {
    if (open && currentSourceMappingData) {
      setSelectedSourceId(currentSourceMappingData.sourceId);
      setCurrentSourceMapping(currentSourceMappingData);
    } else if (open) {
      setSelectedSourceId(null);
      setCurrentSourceMapping(null);
    }
  }, [open, currentSourceMappingData]);

  // Update available synonyms list
  useEffect(() => {
    if (synonymsData?.data) {
      const filtered = synonymsData.data.filter((synonym: Synonym) => 
        !occupationSynonyms.find(os => os.id === synonym.id)
      );
      setAvailableSynonyms(filtered);
    }
  }, [synonymsData, occupationSynonyms]);

  // Synonym management mutations
  const addSynonymMutation = useMutation({
    mutationFn: async (synonymId: number) => {
      // Check for duplicate synonym titles
      const synonymToAdd = availableSynonyms.find(s => s.id === synonymId);
      if (synonymToAdd) {
        const existingSynonym = occupationSynonyms.find(os => 
          os.title.toLowerCase() === synonymToAdd.title.toLowerCase()
        );
        
        if (existingSynonym) {
          throw new Error(`A synonym with the title "${synonymToAdd.title}" already exists for this occupation`);
        }
      }

      await apiRequest("POST", "/api/occupation-synonyms", {
        synonymId,
        occupationId: occupation.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/occupations", occupation.id, "synonyms"] });
      toast({ title: "Success", description: "Synonym added to occupation" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add synonym", 
        variant: "destructive" 
      });
    }
  });

  const removeSynonymMutation = useMutation({
    mutationFn: async (synonymId: number) => {
      const relationships = synonymRelationships || [];
      const relationshipToDelete = relationships.find((rel: any) => rel.synonymId === synonymId);
      // Find the occupation-synonym relationship to delete
      const occupationSynonymToDelete = await fetch(`/api/occupation-synonyms?occupationId=${occupation.id}&synonymId=${synonymId}`, {
        credentials: "include",
      });
      
      if (occupationSynonymToDelete.ok) {
        const relationships = await occupationSynonymToDelete.json();
        if (relationships.length > 0) {
          await apiRequest("DELETE", `/api/occupation-synonyms/${relationships[0].id}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/occupations", occupation.id, "synonyms"] });
      setSynonymToDelete(null);
      toast({ title: "Success", description: "Synonym removed from occupation" });
    },
    onError: () => {
      setSynonymToDelete(null);
      toast({ title: "Error", description: "Failed to remove synonym", variant: "destructive" });
    }
  });

  // Handle synonym deletion with confirmation
  const handleRemoveSynonym = (synonym: Synonym) => {
    setSynonymToDelete(synonym);
  };

  const confirmSynonymDeletion = () => {
    if (synonymToDelete) {
      removeSynonymMutation.mutate(synonymToDelete.id);
    }
  };

  const createNewSynonymMutation = useMutation({
    mutationFn: async (title: string) => {
      // Check for duplicate synonym titles
      const existingSynonym = occupationSynonyms.find(os => 
        os.title.toLowerCase() === title.toLowerCase()
      );
      
      if (existingSynonym) {
        throw new Error(`A synonym with the title "${title}" already exists for this occupation`);
      }

      const synonymResponse = await apiRequest("POST", "/api/synonyms", {
        title,
        language: "en"
      });
      const synonym = await synonymResponse.json();
      
      await apiRequest("POST", "/api/occupation-synonyms", {
        synonymId: synonym.id,
        occupationId: occupation.id
      });
      
      return synonym;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/occupations", occupation.id, "synonyms"] });
      setNewSynonymEn("");
      toast({ title: "Success", description: "New synonym created and added" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create synonym", 
        variant: "destructive" 
      });
    }
  });

  // Relationship management mutations
  const updateRelationshipMutation = useMutation({
    mutationFn: async (newRelation: {
      id: number;
      name: string;
      type: "group" | "occupation";
      relationshipType: "contains" | "contained_by";
    }) => {
      // Use the new transactional API endpoint
      const response = await apiRequest("PUT", `/api/occupations/${occupation.id}/relationship`, {
        parentType: newRelation.type === "group" ? "esco_group" : "occupation",
        parentId: newRelation.id
      });
      return response;
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxonomy-relationships", occupation.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/occupations", occupation.id, "details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tree"] });
      
      // Extract success message from API response
      let successMessage = "Relationship updated successfully";
      try {
        const responseData = await response.json();
        if (responseData.message) {
          successMessage = responseData.message;
        }
      } catch {
        // If response parsing fails, use default message
      }
      
      toast({ title: "Success", description: successMessage });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to update relationship";
      
      if (error.message) {
        // Extract the actual error message from the API response
        // Format is "400: {\"message\":\"...\"}" so we need to parse it
        const match = error.message.match(/^\d+:\s*(.+)$/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            errorMessage = parsed.message || errorMessage;
          } catch {
            // If JSON parsing fails, use the full message after status code
            errorMessage = match[1];
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const cleanData = { ...data };
      
      // Convert empty strings to null for optional fields, but preserve required fields
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === "" && key !== "preferredLabelEn") {
          cleanData[key] = null;
        }
      });
      
      // Ensure English label is never null or empty
      if (!cleanData.preferredLabelEn || cleanData.preferredLabelEn.trim() === "") {
        throw new Error("English label is required and cannot be empty");
      }

      // Convert career levels to integers or null
      cleanData.minCareerLevel = cleanData.minCareerLevel === "" || cleanData.minCareerLevel === "none" ? null : parseInt(cleanData.minCareerLevel);
      cleanData.maxCareerLevel = cleanData.maxCareerLevel === "" || cleanData.maxCareerLevel === "none" ? null : parseInt(cleanData.maxCareerLevel);

      // Include sourceId in the update data
      cleanData.sourceId = selectedSourceId;

      const response = await fetch(`/api/occupations/${occupation.id}`, {
        method: "PUT",
        body: JSON.stringify(cleanData),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/occupations"] });
      toast({
        title: "Success",
        description: "Occupation updated successfully",
      });
      onOpenChange(false);
      setShowConfirmation(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update occupation",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Relationship management helper functions - matching Add form
  const handleAddRelation = (item: any, relationshipType: "contains" | "contained_by") => {
    const name = relationType === "group" ? item.preferredLabelEn || item.gstId : item.preferredLabelEn;
    const newRelation = {
      id: item.id,
      name,
      type: relationType as "group" | "occupation",
      relationshipType
    };
    
    // Check if there's an existing relationship to confirm change
    if (selectedRelation && selectedRelation.id !== newRelation.id) {
      setRelationshipChangeConfirm({
        oldRelation: selectedRelation,
        newRelation: newRelation
      });
    } else {
      // No existing relationship or same relationship, proceed directly
      updateRelationshipMutation.mutate(newRelation);
    }
  };

  const handleRemoveRelation = () => {
    if (selectedRelation) {
      setRelationshipChangeConfirm({
        oldRelation: selectedRelation,
        newRelation: null
      });
    }
  };

  const confirmRelationshipChange = () => {
    if (relationshipChangeConfirm) {
      if (relationshipChangeConfirm.newRelation) {
        updateRelationshipMutation.mutate(relationshipChangeConfirm.newRelation);
      } else {
        setSelectedRelation(null);
        // Call API to remove relationship if needed
        toast({ title: "Success", description: "Relationship removed" });
      }
      setRelationshipChangeConfirm(null);
    }
  };

  const handleSubmit = () => {
    if (!isInitialized) return;
    
    const changedFields = getChangedFields();
    if (changedFields.length === 0) {
      toast({ 
        title: "No Changes", 
        description: "No changes were made to save.",
        variant: "default" 
      });
      return;
    }
    
    setShowConfirmation(true);
  };

  const confirmUpdate = () => {
    updateMutation.mutate(formData);
  };

  const getChangedFields = () => {
    const changes: string[] = [];
    
    if (formData.escoCode !== (occupation.escoCode || "")) changes.push("ESCO Code");
    if (formData.uri !== (occupation.uri || "")) changes.push("URI");
    if (formData.scopeNote !== (occupation.scopeNote || "")) changes.push("Scope Note");
    if (formData.preferredLabelEn !== (occupation.preferredLabelEn || "")) changes.push("English Label");
    if (formData.preferredLabelAr !== (occupation.preferredLabelAr || "")) changes.push("Arabic Label");
    if (formData.definition !== (occupation.definition || "")) changes.push("Definition");
    if (formData.descriptionAr !== (occupation.descriptionAr || "")) changes.push("Arabic Description");
    if (formData.descriptionEn !== (occupation.descriptionEn || "")) changes.push("English Description");
    if (formData.gstId !== (occupation.gstId || "")) changes.push("GST ID");
    if (formData.isGenericTitle !== (occupation.isGenericTitle || false)) changes.push("Generic Title");
    if (formData.minCareerLevel !== (occupation.minCareerLevel?.toString() || "")) changes.push("Min Career Level");
    if (formData.maxCareerLevel !== (occupation.maxCareerLevel?.toString() || "")) changes.push("Max Career Level");
    
    // Check for source changes
    const currentSourceId = currentSourceMapping?.sourceId || null;
    if (selectedSourceId !== currentSourceId) changes.push("Source");

    return changes;
  };

  if (showConfirmation) {
    const changedFields = getChangedFields();
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to update the following fields for "{occupation.preferredLabelEn}":
            </p>
            
            {changedFields.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm">
                {changedFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No changes detected</p>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => setShowConfirmation(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmUpdate} 
                disabled={updateMutation.isPending || changedFields.length === 0}
                className="flex-1"
              >
                {updateMutation.isPending ? "Saving..." : "Confirm Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Occupation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Primary Fields - Occupation Names */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Occupation Names</h3>
            
            <div>
              <Label htmlFor="preferredLabelEn" className="text-base font-medium">English Label *</Label>
              <Input
                id="preferredLabelEn"
                value={formData.preferredLabelEn}
                onChange={(e) => handleInputChange("preferredLabelEn", e.target.value)}
                className="text-lg"
                required
              />
            </div>

            <div>
              <Label htmlFor="preferredLabelAr" className="text-base font-medium">Arabic Label</Label>
              <Input
                id="preferredLabelAr"
                value={formData.preferredLabelAr}
                onChange={(e) => handleInputChange("preferredLabelAr", e.target.value)}
                className="text-lg"
                dir="rtl"
              />
            </div>

            {/* Source Selection */}
            <div>
              <Label htmlFor="source" className="text-base font-medium">Source</Label>
              <Select 
                value={selectedSourceId ? selectedSourceId.toString() : ""} 
                onValueChange={(value) => setSelectedSourceId(value === "no-source" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-source">No Source</SelectItem>
                  {sourcesData?.map((source: any) => (
                    <SelectItem key={source.id} value={source.id.toString()}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Synonyms Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Synonyms</CardTitle>
              <p className="text-sm text-gray-600">Add related terms and alternative names for this occupation</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Synonyms Display */}
              {occupationSynonyms.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Current Synonyms:</h4>
                  <div className="flex flex-wrap gap-2">
                    {occupationSynonyms.map((synonym) => (
                      <Badge key={synonym.id} variant="secondary" className="px-3 py-1">
                        <span>{synonym.title}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 p-0 h-4 w-4"
                          onClick={() => handleRemoveSynonym(synonym)}
                          disabled={removeSynonymMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Synonym */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Add New Synonym:</h4>
                <div className="flex gap-3">
                  <Input
                    placeholder="English or Arabic synonym"
                    value={newSynonymEn}
                    onChange={(e) => setNewSynonymEn(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => createNewSynonymMutation.mutate(newSynonymEn)}
                    disabled={!newSynonymEn.trim() || createNewSynonymMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Select Existing Synonyms */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Or Select Existing Synonyms:</h4>
                <Input
                  placeholder="Search existing synonyms..."
                  value={synonymSearchTerm}
                  onChange={(e) => setSynonymSearchTerm(e.target.value)}
                />
                
                {availableSynonyms.length > 0 && synonymSearchTerm && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {availableSynonyms
                      .filter(s => s.title?.toLowerCase().includes(synonymSearchTerm.toLowerCase()))
                      .slice(0, 5)
                      .map((synonym: any) => (
                        <div
                          key={synonym.id}
                          className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => addSynonymMutation.mutate(synonym.id)}
                        >
                          <div className="font-medium">{synonym.title}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manage Relations Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage Relations</CardTitle>
              <p className="text-sm text-gray-600">Link this occupation to groups or other occupations</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Relation Display */}
              {selectedRelation && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Selected Relation:</h4>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="px-3 py-1 mr-2">
                      {selectedRelation.name} ({selectedRelation.type}) - {selectedRelation.relationshipType}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-4 w-4 p-0"
                        onClick={() => handleRemoveRelation()}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </div>
                </div>
              )}

              {/* Relation Type Selection */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Select Relation Type:</h4>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={relationType === "group" ? "default" : "outline"}
                    onClick={() => {
                      setRelationType("group");
                      setRelationSearch("");
                    }}
                  >
                    Link to Group
                  </Button>
                  <Button
                    type="button"
                    variant={relationType === "occupation" ? "default" : "outline"}
                    onClick={() => {
                      setRelationType("occupation");
                      setRelationSearch("");
                    }}
                  >
                    Link to Occupation
                  </Button>
                </div>
              </div>

              {/* Search and Select Items */}
              {relationType && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">
                    Search {relationType === "group" ? "Groups" : "Occupations"}:
                  </h4>
                  <Input
                    placeholder={`Search ${relationType === "group" ? "taxonomy groups" : "occupations"}...`}
                    value={relationSearch}
                    onChange={(e) => setRelationSearch(e.target.value)}
                  />
                  
                  {relationType === "group" && taxonomyGroupsData && taxonomyGroupsData.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      {taxonomyGroupsData
                        .filter((g: any) => !selectedRelation || !(selectedRelation.id === g.id && selectedRelation.type === "group"))
                        .map((group: any) => (
                          <div key={group.id} className="p-3 border-b">
                            <div className="font-medium">{group.preferredLabelEn || group.gstId}</div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddRelation(group, "contains")}
                              >
                                Group Contains This Occupation
                              </Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {relationType === "occupation" && occupationsData?.data && occupationsData.data.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      {occupationsData.data
                        .filter((o: any) => o.id !== occupation.id && (!selectedRelation || !(selectedRelation.id === o.id && selectedRelation.type === "occupation")))
                        .map((occ: any) => (
                          <div key={occ.id} className="p-3 border-b">
                            <div className="font-medium">{occ.preferredLabelEn}</div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddRelation(occ, "contains")}
                              >
                                Contains
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddRelation(occ, "contained_by")}
                              >
                                Contained By
                              </Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="escoCode">ESCO Code</Label>
                  <Input
                    id="escoCode"
                    value={formData.escoCode}
                    onChange={(e) => handleInputChange("escoCode", e.target.value)}
                    placeholder="e.g., 8211.1.1"
                  />
                </div>

                <div>
                  <Label htmlFor="gstId">GST ID</Label>
                  <Input
                    id="gstId"
                    value={formData.gstId}
                    onChange={(e) => handleInputChange("gstId", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="uri">URI</Label>
                <Input
                  id="uri"
                  value={formData.uri}
                  onChange={(e) => handleInputChange("uri", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minCareerLevel">Min Career Level</Label>
                  <Select
                    value={formData.minCareerLevel.toString()}
                    onValueChange={(value) => handleInputChange("minCareerLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Min Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="0">Student/Internship</SelectItem>
                      <SelectItem value="1">Entry Level</SelectItem>
                      <SelectItem value="2">Mid Career</SelectItem>
                      <SelectItem value="3">Management</SelectItem>
                      <SelectItem value="4">Director/Head</SelectItem>
                      <SelectItem value="5">Senior Executive</SelectItem>
                      <SelectItem value="6">Fresh Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxCareerLevel">Max Career Level</Label>
                  <Select
                    value={formData.maxCareerLevel.toString()}
                    onValueChange={(value) => handleInputChange("maxCareerLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Max Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="0">Student/Internship</SelectItem>
                      <SelectItem value="1">Entry Level</SelectItem>
                      <SelectItem value="2">Mid Career</SelectItem>
                      <SelectItem value="3">Management</SelectItem>
                      <SelectItem value="4">Director/Head</SelectItem>
                      <SelectItem value="5">Senior Executive</SelectItem>
                      <SelectItem value="6">Fresh Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="definition">Definition</Label>
                <Textarea
                  id="definition"
                  value={formData.definition}
                  onChange={(e) => handleInputChange("definition", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="descriptionEn">English Description</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => handleInputChange("descriptionEn", e.target.value)}
                  rows={3}
                  placeholder="Enter detailed description in English"
                />
              </div>

              <div>
                <Label htmlFor="descriptionAr">Arabic Description</Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => handleInputChange("descriptionAr", e.target.value)}
                  rows={3}
                  placeholder="أدخل وصف تفصيلي بالعربية"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="scopeNote">Scope Note</Label>
                <Textarea
                  id="scopeNote"
                  value={formData.scopeNote}
                  onChange={(e) => handleInputChange("scopeNote", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isGenericTitle"
                  checked={formData.isGenericTitle}
                  onCheckedChange={(checked) => handleInputChange("isGenericTitle", checked)}
                />
                <Label htmlFor="isGenericTitle">Is Generic Title</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Update Occupation"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Synonym Deletion Confirmation Dialog */}
      <AlertDialog open={!!synonymToDelete} onOpenChange={(open) => !open && setSynonymToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Synonym Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the synonym "{synonymToDelete?.title}" from this occupation? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSynonymDeletion}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Synonym
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Relationship Change Confirmation Dialog */}
      <AlertDialog open={!!relationshipChangeConfirm} onOpenChange={(open) => !open && setRelationshipChangeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Relationship Change</AlertDialogTitle>
            <AlertDialogDescription>
              {relationshipChangeConfirm?.newRelation ? (
                <>
                  Are you sure you want to change the taxonomy relationship from "{relationshipChangeConfirm.oldRelation?.name}" 
                  to "{relationshipChangeConfirm.newRelation?.name}"? This will update the occupation's hierarchy.
                </>
              ) : (
                <>
                  Are you sure you want to remove the taxonomy relationship with "{relationshipChangeConfirm?.oldRelation?.name}"? 
                  This will disconnect the occupation from its current taxonomy group.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRelationshipChange}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {relationshipChangeConfirm?.newRelation ? "Change Relationship" : "Remove Relationship"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}