import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AddOccupationModal } from "@/components/modals/add-occupation-modal";

import { useState } from "react";
import { Briefcase, Tag, CheckCircle, Clock, Building2, TrendingUp, Link2Off, Trophy, Award, Download, Database } from "lucide-react";
import { useLocation } from "wouter";

interface DashboardStats {
  totalOccupations: number;
  totalSynonyms: number;
}

interface SourceStats {
  sourceId: number;
  sourceName: string;
  occupationCount: number;
}

interface SynonymSourceStats {
  sourceId: number;
  sourceName: string;
  synonymCount: number;
}

interface OccupationMetrics {
  occupationId: number;
  preferredLabelEn: string;
  synonymCount: number;
}

interface RecentOccupation {
  id: number;
  preferredLabelEn: string | null;
  escoCode: string | null;
  createdAt: string;
}

interface RecentSynonym {
  id: number;
  title: string;
  createdAt: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [showAddOccupationModal, setShowAddOccupationModal] = useState(false);


  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: occupationStats, isLoading: isLoadingOccupationStats } = useQuery<SourceStats[]>({
    queryKey: ["/api/dashboard/occupation-count-per-source"],
  });

  const { data: synonymStats, isLoading: isLoadingSynonymStats } = useQuery<SynonymSourceStats[]>({
    queryKey: ["/api/dashboard/synonym-count-per-source"],
  });

  const { data: avgSynonymsData, isLoading: isLoadingAvgSynonyms } = useQuery<{ averageSynonymsPerOccupation: number }>({
    queryKey: ["/api/dashboard/average-synonyms-per-occupation"],
  });

  const { data: unlinkedCountData, isLoading: isLoadingUnlinkedCount } = useQuery<{ unlinkedOccupationCount: number }>({
    queryKey: ["/api/dashboard/unlinked-occupations-count"],
  });

  const { data: mostSynonymsOccupation, isLoading: isLoadingMostSynonyms } = useQuery<OccupationMetrics | null>({
    queryKey: ["/api/dashboard/occupation-most-synonyms"],
  });

  const { data: fewestSynonymsOccupation, isLoading: isLoadingFewestSynonyms } = useQuery<OccupationMetrics | null>({
    queryKey: ["/api/dashboard/occupation-fewest-synonyms"],
  });

  // Recent Activity Queries
  const { data: recentOccupations, isLoading: isLoadingRecentOccupations } = useQuery<RecentOccupation[]>({
    queryKey: ["/api/dashboard/last-added-occupations"],
  });

  const { data: recentSynonyms, isLoading: isLoadingRecentSynonyms } = useQuery<RecentSynonym[]>({
    queryKey: ["/api/dashboard/last-added-synonyms"],
  });

  // Data Completeness Queries
  const { data: occupationsWithoutSourceData, isLoading: isLoadingOccupationsWithoutSource } = useQuery<{ occupationsWithoutSource: number }>({
    queryKey: ["/api/dashboard/occupations-without-source"],
  });

  const { data: synonymsWithoutSourceData, isLoading: isLoadingSynonymsWithoutSource } = useQuery<{ synonymsWithoutSource: number }>({
    queryKey: ["/api/dashboard/synonyms-without-source"],
  });

  const StatCard = ({ icon: Icon, title, value, color }: { 
    icon: any; 
    title: string; 
    value?: number; 
    color: string; 
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-semibold text-gray-900">
                {value?.toLocaleString() || 0}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ icon: Icon, title, onClick }: {
    icon: any;
    title: string;
    onClick: () => void;
  }) => (
    <Button
      variant="outline"
      className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors"
      onClick={onClick}
    >
      <Icon className="h-8 w-8 text-blue-500 mb-2" />
      <span className="text-sm font-medium text-gray-700">{title}</span>
    </Button>
  );



  const recentActivities = [
    {
      type: "success",
      message: "System initialized with database schema",
      time: "Just now",
    },
    {
      type: "info",
      message: "Ready for data import and management",
      time: "Just now",
    },
    {
      type: "warning",
      message: "Import your CSV data to get started",
      time: "Just now",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-medium text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Briefcase}
          title="Total Occupations"
          value={stats?.totalOccupations}
          color="bg-blue-50 text-blue-500"
        />
        <StatCard
          icon={Tag}
          title="Total Synonyms"
          value={stats?.totalSynonyms}
          color="bg-orange-50 text-orange-500"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Synonyms per Occupation"
          value={avgSynonymsData?.averageSynonymsPerOccupation}
          color="bg-green-50 text-green-500"
        />
        <StatCard
          icon={Link2Off}
          title="Unlinked Occupations"
          value={unlinkedCountData?.unlinkedOccupationCount}
          color="bg-red-50 text-red-500"
        />
        <StatCard
          icon={Database}
          title="Occupations Without Source"
          value={occupationsWithoutSourceData?.occupationsWithoutSource}
          color="bg-purple-50 text-purple-500"
        />
        <StatCard
          icon={Database}
          title="Synonyms Without Source"
          value={synonymsWithoutSourceData?.synonymsWithoutSource}
          color="bg-pink-50 text-pink-500"
        />
      </div>

      {/* Recent Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last 3 Added Occupations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Last 3 Added Occupations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRecentOccupations ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recentOccupations && recentOccupations.length > 0 ? (
              <div className="space-y-3">
                {recentOccupations.map((occupation) => (
                  <div key={occupation.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                    <div>
                      <p className="font-medium text-sm">
                        {occupation.preferredLabelEn || `Occupation ${occupation.id}`}
                      </p>
                      {occupation.escoCode && (
                        <p className="text-xs text-gray-500">{occupation.escoCode}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(occupation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent occupations found</p>
            )}
          </CardContent>
        </Card>

        {/* Last 3 Added Synonyms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Last 3 Added Synonyms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRecentSynonyms ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recentSynonyms && recentSynonyms.length > 0 ? (
              <div className="space-y-3">
                {recentSynonyms.map((synonym) => (
                  <div key={synonym.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                    <div>
                      <p className="font-medium text-sm">{synonym.title}</p>
                      <p className="text-xs text-gray-500">ID: {synonym.id}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(synonym.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent synonyms found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Occupation Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupation with Most Synonyms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Most Synonyms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMostSynonyms ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : mostSynonymsOccupation ? (
              <div>
                <p className="font-medium text-gray-900 truncate">
                  {mostSynonymsOccupation.preferredLabelEn}
                </p>
                <p className="text-sm text-gray-500">
                  {mostSynonymsOccupation.synonymCount} synonyms
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Occupation with Fewest Synonyms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Fewest Synonyms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingFewestSynonyms ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : fewestSynonymsOccupation ? (
              <div>
                <p className="font-medium text-gray-900 truncate">
                  {fewestSynonymsOccupation.preferredLabelEn}
                </p>
                <p className="text-sm text-gray-500">
                  {fewestSynonymsOccupation.synonymCount} synonyms
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Source Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupation Count Per Source */}
        <Card>
          <CardHeader>
            <CardTitle>Occupations by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOccupationStats ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {occupationStats?.slice(0, 5).map((stat) => (
                  <div key={stat.sourceId} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 truncate">{stat.sourceName}</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {stat.occupationCount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {!occupationStats || occupationStats.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No occupation data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Synonym Count Per Source */}
        <Card>
          <CardHeader>
            <CardTitle>Synonyms by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSynonymStats ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {synonymStats?.slice(0, 5).map((stat) => (
                  <div key={stat.sourceId} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 truncate">{stat.sourceName}</span>
                    <span className="text-sm font-semibold text-orange-600">
                      {stat.synonymCount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {!synonymStats || synonymStats.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No synonym data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddOccupationModal
        open={showAddOccupationModal}
        onOpenChange={setShowAddOccupationModal}
      />

    </div>
  );
}
