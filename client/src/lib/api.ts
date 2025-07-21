import { apiRequest } from "./queryClient";

// Type definitions for API responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchResult {
  occupations: any[];
  synonyms: any[];
  taxonomyGroups: any[];
}



// API functions
export const api = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await fetch("/api/dashboard/stats", { credentials: "include" });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  // Global Search
  globalSearch: async (query: string): Promise<SearchResult> => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  // Occupations
  getOccupations: async (params: {
    search?: string;
    escoLevel?: string;
    careerLevel?: string;
    language?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });

    const response = await fetch(`/api/occupations?${searchParams.toString()}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  getOccupation: async (id: number) => {
    const response = await fetch(`/api/occupations/${id}`, { credentials: "include" });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  createOccupation: async (data: any) => {
    return apiRequest("POST", "/api/occupations", data);
  },

  updateOccupation: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/occupations/${id}`, data);
  },

  deleteOccupation: async (id: number) => {
    return apiRequest("DELETE", `/api/occupations/${id}`);
  },

  // Synonyms
  getSynonyms: async (params: {
    search?: string;
    language?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });

    const response = await fetch(`/api/synonyms?${searchParams.toString()}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  getSynonym: async (id: number) => {
    const response = await fetch(`/api/synonyms/${id}`, { credentials: "include" });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  createSynonym: async (data: any) => {
    return apiRequest("POST", "/api/synonyms", data);
  },

  updateSynonym: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/synonyms/${id}`, data);
  },

  deleteSynonym: async (id: number) => {
    return apiRequest("DELETE", `/api/synonyms/${id}`);
  },

  // Taxonomy Groups
  getTaxonomyGroups: async (params: {
    search?: string;
    level?: number;
    parentId?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, value.toString());
    });

    const response = await fetch(`/api/taxonomy-groups?${searchParams.toString()}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  getTaxonomyHierarchy: async () => {
    const response = await fetch("/api/taxonomy-groups/hierarchy", { credentials: "include" });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  getTaxonomyGroup: async (id: number) => {
    const response = await fetch(`/api/taxonomy-groups/${id}`, { credentials: "include" });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  createTaxonomyGroup: async (data: any) => {
    return apiRequest("POST", "/api/taxonomy-groups", data);
  },

  updateTaxonomyGroup: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/taxonomy-groups/${id}`, data);
  },

  deleteTaxonomyGroup: async (id: number) => {
    return apiRequest("DELETE", `/api/taxonomy-groups/${id}`);
  },

  // Taxonomy Sources
  getTaxonomySources: async () => {
    const response = await fetch("/api/taxonomy-sources", { credentials: "include" });
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  },

  createTaxonomySource: async (data: any) => {
    return apiRequest("POST", "/api/taxonomy-sources", data);
  },

  updateTaxonomySource: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/taxonomy-sources/${id}`, data);
  },

  deleteTaxonomySource: async (id: number) => {
    return apiRequest("DELETE", `/api/taxonomy-sources/${id}`);
  },



  // Relationships
  createSynonymRelationship: async (data: any) => {
    return apiRequest("POST", "/api/synonym-relationships", data);
  },

  deleteSynonymRelationship: async (id: number) => {
    return apiRequest("DELETE", `/api/synonym-relationships/${id}`);
  },

  createOccupationTaxonomyMapping: async (data: any) => {
    return apiRequest("POST", "/api/occupation-taxonomy-mappings", data);
  },

  deleteOccupationTaxonomyMapping: async (id: number) => {
    return apiRequest("DELETE", `/api/occupation-taxonomy-mappings/${id}`);
  },
};
