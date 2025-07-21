import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Synonym } from "@shared/schema";

interface TaxonomySource {
  id: number;
  name: string;
}

interface EditSynonymModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  synonym: Synonym | null;
  onSuccess?: () => void;
}

export function EditSynonymModal({ open, onOpenChange, synonym, onSuccess }: EditSynonymModalProps) {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("en");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const { toast } = useToast();

  // Fetch taxonomy sources for the dropdown
  const { data: sourcesData } = useQuery<TaxonomySource[]>({
    queryKey: ["/api/taxonomy-sources"],
  });

  // Fetch current synonym details with source information
  const { data: synonymData } = useQuery({
    queryKey: ["/api/synonyms", synonym?.id],
    queryFn: async () => {
      if (!synonym?.id) return null;
      const response = await fetch(`/api/synonyms/${synonym.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch synonym details");
      return response.json();
    },
    enabled: !!synonym?.id,
  });

  useEffect(() => {
    if (synonymData) {
      setTitle(synonymData.title || "");
      setLanguage(synonymData.language || "en");
      
      // Set current source if available
      if (synonymData.sourceId) {
        setSelectedSource(synonymData.sourceId.toString());
      } else {
        setSelectedSource("no-source");
      }
    } else if (synonym) {
      // Fallback to passed synonym data if detailed fetch fails
      setTitle(synonym.title);
      setLanguage(synonym.language);
      setSelectedSource("no-source");
    } else {
      setTitle("");
      setLanguage("en");
      setSelectedSource("no-source");
    }
  }, [synonym, synonymData]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!synonym) return;
      
      const updateData: any = {
        title: title.trim(),
        language
      };
      
      // Include sourceId if selected (but not "no-source")
      if (selectedSource && selectedSource !== "no-source") {
        updateData.sourceId = parseInt(selectedSource);
      } else if (selectedSource === "no-source") {
        updateData.sourceId = null; // Explicitly remove source
      }
      
      await apiRequest("PUT", `/api/synonyms/${synonym.id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/synonyms"] });
      toast({ title: "Success", description: "Synonym updated successfully" });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update synonym", 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    updateMutation.mutate();
  };

  const handleClose = () => {
    onOpenChange(false);
    setTitle("");
    setLanguage("en");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Synonym</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter synonym title"
              dir={language === "ar" ? "rtl" : "ltr"}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select source (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-source">No Source</SelectItem>
                {sourcesData?.map((source) => (
                  <SelectItem key={source.id} value={source.id.toString()}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Synonym"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}