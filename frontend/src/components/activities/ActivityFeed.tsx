import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ActivityFeedItem } from '@/lib/api/types';
import { activityService } from '@/lib/api/activityApi';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface ActivityFeedProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
  className?: string;
}

const getActionBadgeVariant = (actionCategory: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (actionCategory) {
    case 'AUTH': return 'default';
    case 'USER': return 'secondary';
    case 'PERMISSION': return 'destructive';
    case 'DATA_TRANSFER': return 'outline';
    default: return 'secondary';
  }
};

const getStatusIndicator = (responseStatus?: number) => {
  if (!responseStatus) return null;
  if (responseStatus >= 200 && responseStatus < 300) {
    return <Circle className="h-2 w-2 fill-green-500 text-green-500" />;
  }
  if (responseStatus >= 400) {
    return <Circle className="h-2 w-2 fill-red-500 text-red-500" />;
  }
  return <Circle className="h-2 w-2 fill-yellow-500 text-yellow-500" />;
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  limit = 20,
  className
}) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchActivities = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await activityService.getActivityFeed(limit);
      setActivities(response.activities);
      setLastRefresh(new Date());
    } catch (error) {
      toast({
        title: 'Failed to fetch activities',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [limit, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchActivities(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchActivities]);

  const handleManualRefresh = () => {
    fetchActivities(false);
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Live Activity Feed</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Last updated: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activities
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.avatarUrl} />
                  <AvatarFallback>
                    {activity.user.firstName[0]}{activity.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {activity.user.firstName} {activity.user.lastName}
                    </span>
                    <Badge variant={getActionBadgeVariant(activity.actionCategory)}>
                      {activity.actionCategory}
                    </Badge>
                    {getStatusIndicator(activity.responseStatus)}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {activity.action.replace(/_/g, ' ').toLowerCase()}
                    {activity.resourceType && (
                      <>
                        {' '}on <span className="font-medium">{activity.resourceType}</span>
                      </>
                    )}
                    {activity.resourceName && (
                      <>: <span className="font-medium">{activity.resourceName}</span></>
                    )}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <span>{activity.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};