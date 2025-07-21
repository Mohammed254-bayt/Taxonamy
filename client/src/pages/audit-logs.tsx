import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar,
  Filter,
  Download,
  BarChart3,
  Search,
  ChevronDown,
  Eye,
  Clock,
  User,
  Database,
  Activity,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface AuditLog {
  id: number;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  oldValues: string | null;
  newValues: string | null;
  changedFields: string | null;
  userId: string | null;
  sessionId: string | null;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
}

interface AuditStats {
  total: number;
  byTable: Array<{ tableName: string; count: number }>;
  byOperation: Array<{ operation: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

const TABLE_DISPLAY_NAMES: Record<string, string> = {
  occupations: "Occupations",
  synonyms: "Synonyms",
  taxonomy_sources: "Taxonomy Sources",
  taxonomy_groups: "Taxonomy Groups",
  taxonomy_relationships: "Taxonomy Relationships",
  occupation_synonyms: "Occupation Synonyms",
  occupation_source_mapping: "Occupation Source Mapping",
  synonym_source_mapping: "Synonym Source Mapping",
};

const OPERATION_COLORS = {
  INSERT: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};

const OPERATION_ICONS = {
  INSERT: "🟢",
  UPDATE: "🔵", 
  DELETE: "🔴",
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    tableName: "all",
    operation: "all",
    userId: "",
    recordId: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    limit: 50,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit logs
  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== 0 && value !== "all") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
  });

  // Fetch audit statistics
  const { data: stats } = useQuery<AuditStats>({
    queryKey: ["audit-stats"],
    queryFn: async () => {
      const response = await fetch("/api/audit-logs/stats");
      if (!response.ok) throw new Error("Failed to fetch audit stats");
      return response.json();
    },
  });

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : Number(value), // Reset page when other filters change, ensure page is number
    }));
  };

  const clearFilters = () => {
    setFilters({
      tableName: "all",
      operation: "all",
      userId: "",
      recordId: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
      limit: 50,
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatJsonValue = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  const getChangedFieldsDisplay = (log: AuditLog) => {
    if (!log.changedFields) return [];
    try {
      return JSON.parse(log.changedFields);
    } catch {
      return [];
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Track all database changes and user activities</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Active Table</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byTable[0]?.tableName ? TABLE_DISPLAY_NAMES[stats.byTable[0].tableName] || stats.byTable[0].tableName : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byTable[0]?.count || 0} changes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentActivity.find(a => a.date === new Date().toISOString().split('T')[0])?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">changes today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operation Mix</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-1">
                {stats.byOperation.map((op) => (
                  <div key={op.operation} className="text-xs">
                    <span>{OPERATION_ICONS[op.operation as keyof typeof OPERATION_ICONS]}</span>
                    <span className="ml-1">{op.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Filter audit logs by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Table</label>
                <Select value={filters.tableName} onValueChange={(value) => handleFilterChange("tableName", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tables</SelectItem>
                    {stats?.byTable.map((table) => (
                      <SelectItem key={table.tableName} value={table.tableName}>
                        {TABLE_DISPLAY_NAMES[table.tableName] || table.tableName} ({table.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Operation</label>
                <Select value={filters.operation} onValueChange={(value) => handleFilterChange("operation", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All operations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All operations</SelectItem>
                    <SelectItem value="INSERT">INSERT</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">User ID</label>
                <Input
                  placeholder="Enter user ID"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Record ID</label>
                <Input
                  placeholder="Enter record ID"
                  value={filters.recordId}
                  onChange={(e) => handleFilterChange("recordId", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => refetch()}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            {auditLogs && `Showing ${auditLogs.data?.length || 0} of ${auditLogs.total || 0} entries`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs?.data?.map((log: AuditLog) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className={OPERATION_COLORS[log.operation]}>
                        {log.operation}
                      </Badge>
                      <div>
                        <div className="font-medium">
                          {TABLE_DISPLAY_NAMES[log.tableName] || log.tableName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Record ID: {log.recordId}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userId || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Audit Log Details
                            </DialogTitle>
                            <DialogDescription>
                              {log.operation} operation on {TABLE_DISPLAY_NAMES[log.tableName] || log.tableName}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedLog && (
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="old-values">Old Values</TabsTrigger>
                                <TabsTrigger value="new-values">New Values</TabsTrigger>
                                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Table</label>
                                    <p className="text-sm text-gray-600">
                                      {TABLE_DISPLAY_NAMES[selectedLog.tableName] || selectedLog.tableName}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Record ID</label>
                                    <p className="text-sm text-gray-600">{selectedLog.recordId}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Operation</label>
                                    <Badge className={OPERATION_COLORS[selectedLog.operation]}>
                                      {selectedLog.operation}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Timestamp</label>
                                    <p className="text-sm text-gray-600">
                                      {formatTimestamp(selectedLog.timestamp)}
                                    </p>
                                  </div>
                                  {getChangedFieldsDisplay(selectedLog).length > 0 && (
                                    <div className="col-span-2">
                                      <label className="text-sm font-medium">Changed Fields</label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {getChangedFieldsDisplay(selectedLog).map((field: string, index: number) => (
                                          <Badge key={index} variant="outline">{field}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="old-values">
                                <div>
                                  <h4 className="font-medium mb-2">Old Values</h4>
                                  {selectedLog.oldValues ? (
                                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                                      {JSON.stringify(formatJsonValue(selectedLog.oldValues), null, 2)}
                                    </pre>
                                  ) : (
                                    <p className="text-gray-500 italic">No old values (INSERT operation)</p>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="new-values">
                                <div>
                                  <h4 className="font-medium mb-2">New Values</h4>
                                  {selectedLog.newValues ? (
                                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                                      {JSON.stringify(formatJsonValue(selectedLog.newValues), null, 2)}
                                    </pre>
                                  ) : (
                                    <p className="text-gray-500 italic">No new values (DELETE operation)</p>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="metadata" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">User ID</label>
                                    <p className="text-sm text-gray-600">{selectedLog.userId || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Session ID</label>
                                    <p className="text-sm text-gray-600 break-all">
                                      {selectedLog.sessionId || 'Unknown'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">IP Address</label>
                                    <p className="text-sm text-gray-600">{selectedLog.ipAddress || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">User Agent</label>
                                    <p className="text-sm text-gray-600 break-all">
                                      {selectedLog.userAgent || 'Unknown'}
                                    </p>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
              
              {auditLogs?.data?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No audit logs found matching your criteria.
                </div>
              )}
            </div>
          )}
          
          {/* Pagination */}
          {auditLogs && auditLogs.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Page {auditLogs.page} of {auditLogs.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange("page", Math.max(1, auditLogs.page - 1))}
                  disabled={auditLogs.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange("page", Math.min(auditLogs.totalPages, auditLogs.page + 1))}
                  disabled={auditLogs.page >= auditLogs.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 