import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { insertSynonymSchema, type InsertSynonym } from "@shared/schema";

interface AddSynonymModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddSynonymModal({ open, onOpenChange, onSuccess }: AddSynonymModalProps) {
  const { toast } = useToast();

  const form = useForm<InsertSynonym>({
    resolver: zodResolver(insertSynonymSchema),
    defaultValues: {
      title: "",
      language: "en",
      titleOrig: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSynonym) => {
      await apiRequest("POST", "/api/synonyms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/synonyms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Synonym created successfully" });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create synonym", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertSynonym) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Synonym</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Synonym Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter synonym title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titleOrig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Title (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter original title if different" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Save Synonym"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
