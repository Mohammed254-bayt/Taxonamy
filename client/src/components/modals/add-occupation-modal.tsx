import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { insertOccupationSchema, type InsertOccupation, type Synonym } from "@shared/schema";
import { Plus, X } from "lucide-react";

interface AddOccupationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddOccupationModal({ open, onOpenChange, onSuccess }: AddOccupationModalProps) {
  const { toast } = useToast();
  const [selectedSynonyms, setSelectedSynonyms] = useState<Synonym[]>([]);
  const [newSynonymEn, setNewSynonymEn] = useState("");
  const [synonymSearch, setSynonymSearch] = useState("");
  
  // Source selection state
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  
  // Relations state - only allow one relationship
  const [relationType, setRelationType] = useState<"group" | "occupation" | "">("");
  const [selectedRelation, setSelectedRelation] = useState<{id: number, name: string, type: "group" | "occupation", relationshipType: "contains" | "contained_by"} | null>(null);
  const [relationSearch, setRelationSearch] = useState("");

  const form = useForm<InsertOccupation>({
    resolver: zodResolver(insertOccupationSchema),
    defaultValues: {
      escoCode: "",
      preferredLabelEn: "",
      preferredLabelAr: "",
      descriptionEn: "",
      descriptionAr: "",
      minCareerLevel: 1, // Default to Entry Level
      maxCareerLevel: 2, // Default to Mid Career
      isGenericTitle: false,
    },
  });

  // Fetch existing synonyms for selection
  const { data: synonymsData } = useQuery({
    queryKey: ["/api/synonyms", { search: synonymSearch, limit: 50 }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      Object.entries(params as Record<string, any>).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });

      const response = await fetch(`${url}?${searchParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch synonyms");
      return response.json();
    },
  });

  // Fetch taxonomy groups for relations
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
    enabled: relationType === "group",
  });

  // Fetch occupations for relations
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
    enabled: relationType === "occupation",
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
  });

  const createOccupationWithSynonyms = useMutation({
    mutationFn: async (data: { 
      occupation: InsertOccupation; 
      synonymIds: number[]; 
      newSynonyms: { titleEn: string }[];
      relation: {id: number, name: string, type: "group" | "occupation", relationshipType: "contains" | "contained_by"} | null;
      sourceId: number | null;
    }) => {
      // Prepare synonyms data for single transaction
      const synonymsData = [
        // Existing synonyms
        ...data.synonymIds.map(id => ({
          id,
          isNew: false
        })),
        // New synonyms
        ...data.newSynonyms.map(newSyn => ({
          title: newSyn.titleEn,
          language: "en",
          isNew: true
        }))
      ];

      // Prepare parent relation data
      const parentRelation = data.relation ? {
        type: data.relation.type,
        id: data.relation.id
      } : null;

      // Send all data in a single transaction
      const occupation = await apiRequest("POST", "/api/occupations", {
        occupation: data.occupation,
        synonyms: synonymsData,
        parentRelation,
        sourceId: data.sourceId
      });

      return occupation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/occupations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/synonyms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tree"] });
      toast({ title: "Success", description: "Occupation created successfully with synonyms" });
      handleClose();
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create occupation", variant: "destructive" });
    },
  });

  const onSubmit = async (data: InsertOccupation) => {
    // Validate that English title is filled
    if (!data.preferredLabelEn?.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "English name is required", 
        variant: "destructive" 
      });
      return;
    }

    // Check if English title already exists
    try {
      const response = await apiRequest("GET", `/api/occupations?search=${encodeURIComponent(data.preferredLabelEn.trim())}`);
      const existingOccupations = await response.json();
      
      const exactMatch = existingOccupations.data.find((occ: any) => 
        occ.preferredLabelEn?.toLowerCase() === data.preferredLabelEn.trim().toLowerCase()
      );
      
      if (exactMatch) {
        toast({ 
          title: "Validation Error", 
          description: "An occupation with this English name already exists", 
          variant: "destructive" 
        });
        return;
      }
    } catch (error) {
      console.error("Error checking for duplicate occupation:", error);
    }

    // Separate existing synonyms from new ones
    const existingSynonyms = selectedSynonyms.filter(s => s.id < 1000000000000); // Real IDs are smaller
    const newSynonymsFromSelected = selectedSynonyms.filter(s => s.id >= 1000000000000); // Timestamp IDs are larger
    
    const newSynonyms = [];
    
    // Add synonyms that were created inline
    newSynonymsFromSelected.forEach(s => {
      newSynonyms.push({ titleEn: s.title });
    });
    
    // Add the current new synonym if any
    if (newSynonymEn.trim()) {
      newSynonyms.push({ titleEn: newSynonymEn.trim() });
    }

    createOccupationWithSynonyms.mutate({
      occupation: data,
      synonymIds: existingSynonyms.map(s => s.id),
      newSynonyms,
      relation: selectedRelation,
      sourceId: selectedSourceId
    });
  };

  const handleAddSynonym = (synonym: Synonym) => {
    if (!selectedSynonyms.find(s => s.id === synonym.id)) {
      setSelectedSynonyms([...selectedSynonyms, synonym]);
    }
  };

  const handleRemoveSynonym = (synonymId: number) => {
    setSelectedSynonyms(selectedSynonyms.filter(s => s.id !== synonymId));
  };

  const handleAddNewSynonym = () => {
    if (newSynonymEn.trim()) {
      const tempSynonym: Synonym = {
        id: Date.now(), // Temporary ID for display
        title: newSynonymEn.trim(),
        titleOrig: newSynonymEn.trim(),
        language: "en",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSelectedSynonyms([...selectedSynonyms, tempSynonym]);
      setNewSynonymEn("");
    }
  };

  const handleAddRelation = (item: any, relationshipType: "contains" | "contained_by") => {
    const name = relationType === "group" ? item.preferredLabelEn || item.gstId : item.preferredLabelEn;
    const relation = {
      id: item.id,
      name,
      type: relationType as "group" | "occupation",
      relationshipType
    };
    
    // Only allow one relationship at a time
    setSelectedRelation(relation);
  };

  const handleRemoveRelation = () => {
    setSelectedRelation(null);
  };

  const handleClose = () => {
    form.reset();
    setSelectedSynonyms([]);
    setNewSynonymEn("");
    setSynonymSearch("");
    setRelationType("");
    setSelectedRelation(null);
    setRelationSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Occupation</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Primary Fields - Occupation Names */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Occupation Names</h3>
              
              <FormField
                control={form.control}
                name="preferredLabelEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">English Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter the occupation name in English" 
                        className="text-lg"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredLabelAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Arabic Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="أدخل اسم المهنة بالعربية"
                        className="text-lg"
                        dir="rtl"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Synonyms Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Synonyms</CardTitle>
                <p className="text-sm text-gray-600">Add related terms and alternative names for this occupation</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Synonyms Display */}
                {selectedSynonyms.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Selected Synonyms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSynonyms.map((synonym) => (
                        <Badge key={synonym.id} variant="secondary" className="px-3 py-1">
                          <span>{synonym.title}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 p-0 h-4 w-4"
                            onClick={() => handleRemoveSynonym(synonym.id)}
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
                      onClick={handleAddNewSynonym}
                      disabled={!newSynonymEn.trim()}
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
                    value={synonymSearch}
                    onChange={(e) => setSynonymSearch(e.target.value)}
                  />
                  
                  {synonymsData?.data && synonymsData.data.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      {synonymsData.data
                        .filter((s: any) => !selectedSynonyms.find(sel => sel.id === s.id))
                        .map((synonym: any) => (
                          <div
                            key={synonym.id}
                            className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleAddSynonym(synonym)}
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

            {/* Source Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Source</CardTitle>
                <p className="text-sm text-gray-600">Select the source of this occupation data</p>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedSourceId?.toString() || ""} 
                  onValueChange={(value) => setSelectedSourceId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data source (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourcesData?.map((source: any) => (
                      <SelectItem key={source.id} value={source.id.toString()}>
                        {source.name} - {source.description || 'No description'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                          .filter((o: any) => !selectedRelation || !(selectedRelation.id === o.id && selectedRelation.type === "occupation"))
                          .map((occupation: any) => (
                            <div key={occupation.id} className="p-3 border-b">
                              <div className="font-medium">{occupation.preferredLabelEn}</div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddRelation(occupation, "contains")}
                                >
                                  Contains
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddRelation(occupation, "contained_by")}
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

            {/* Additional Details - Collapsible */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="escoCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ESCO Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 8211.1.1" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minCareerLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Career Level</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Min Level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Student/Internship</SelectItem>
                            <SelectItem value="1">Entry Level</SelectItem>
                            <SelectItem value="2">Mid Career</SelectItem>
                            <SelectItem value="3">Management</SelectItem>
                            <SelectItem value="4">Director/Head</SelectItem>
                            <SelectItem value="5">Senior Executive</SelectItem>
                            <SelectItem value="6">Fresh Graduate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxCareerLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Career Level</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Max Level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Student/Internship</SelectItem>
                            <SelectItem value="1">Entry Level</SelectItem>
                            <SelectItem value="2">Mid Career</SelectItem>
                            <SelectItem value="3">Management</SelectItem>
                            <SelectItem value="4">Director/Head</SelectItem>
                            <SelectItem value="5">Senior Executive</SelectItem>
                            <SelectItem value="6">Fresh Graduate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3}
                          placeholder="Enter detailed description in English" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descriptionAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arabic Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3}
                          placeholder="أدخل وصف تفصيلي بالعربية"
                          dir="rtl"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOccupationWithSynonyms.isPending}>
                {createOccupationWithSynonyms.isPending ? "Creating..." : "Create Occupation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
