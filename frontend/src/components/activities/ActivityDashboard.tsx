import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Shield } from 'lucide-react';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityFiltersComponent, ActivityFilters } from './ActivityFilters';
import { ActivityStats } from './ActivityStats';
import { ActivityFeed } from './ActivityFeed';
import { activityService } from '@/lib/api/activityApi';
import { ActivityLog, ActivityMetadata, ActivityStats as ActivityStatsType } from '@/lib/api/types';
import { useToast } from '@/components/ui/use-toast';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityDashboardProps {
  userId?: string;
  showAdminFeatures?: boolean;
}

export const ActivityDashboard: React.FC<ActivityDashboardProps> = ({
  userId,
  showAdminFeatures = false
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStatsType | null>(null);
  const [metadata, setMetadata] = useState<ActivityMetadata | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const { toast } = useToast();

  const PAGE_SIZE = 50;

  // Fetch metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await activityService.getMetadata();
        setMetadata(data);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const params = {
          ...filters,
          userId: userId || filters.userId,
          page: currentPage,
          limit: PAGE_SIZE,
        };

        const response = userId
          ? await activityService.getMyActivities(params)
          : await activityService.listActivities(params);

        setActivities(response.data);
        setTotalPages(response.meta.pagination.totalPages);
        setTotalActivities(response.meta.pagination.total);
      } catch (error) {
        toast({
          title: 'Failed to fetch activities',
          description: 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [filters, currentPage, userId, toast]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await activityService.getActivityStats({
          userId: userId || filters.userId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        });
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    if (showAdminFeatures || userId) {
      fetchStats();
    }
  }, [filters, userId, showAdminFeatures]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await activityService.exportActivities({
        ...filters,
        userId: userId || filters.userId,
        format,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activities-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Activities exported to ${format.toUpperCase()} file`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!userId) return;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    try {
      const report = await activityService.generateActivityReport(userId, startDate, endDate);
      
      // Convert report to JSON and download
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-report-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Report generated',
        description: 'Activity report has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Report generation failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const handleCheckSuspicious = async () => {
    if (!userId) return;

    try {
      const result = await activityService.checkSuspiciousActivity(userId);
      
      if (result.suspicious) {
        toast({
          title: 'Suspicious activity detected',
          description: result.reasons.join(', '),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'No suspicious activity',
          description: 'No unusual patterns detected for this user',
        });
      }
    } catch (error) {
      toast({
        title: 'Check failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {userId ? 'My Activities' : 'Activity Tracking'}
          </h2>
          <p className="text-muted-foreground">
            {userId ? 'View your activity history and patterns' : 'Monitor and analyze user activities across the system'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userId && (
            <Button variant="outline" size="sm" onClick={handleGenerateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          )}
          {showAdminFeatures && userId && (
            <Button variant="outline" size="sm" onClick={handleCheckSuspicious}>
              <Shield className="h-4 w-4 mr-2" />
              Check Suspicious
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ActivityFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        metadata={metadata || undefined}
        showUserFilter={showAdminFeatures && !userId}
      />

      {/* Content */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {(showAdminFeatures || userId) && <TabsTrigger value="stats">Statistics</TabsTrigger>}
          {showAdminFeatures && <TabsTrigger value="feed">Live Feed</TabsTrigger>}
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                {totalActivities} total activities found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <ActivityTimeline
                    activities={activities}
                    showUser={!userId}
                  />
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {(showAdminFeatures || userId) && stats && (
          <TabsContent value="stats">
            <ActivityStats stats={stats} />
          </TabsContent>
        )}

        {showAdminFeatures && (
          <TabsContent value="feed">
            <ActivityFeed
              autoRefresh={true}
              refreshInterval={30000}
              limit={20}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};