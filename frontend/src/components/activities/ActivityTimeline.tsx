import React, { useState, useEffect } from 'react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { Clock, User, Monitor, MapPin, AlertCircle } from 'lucide-react';
import { ActivityLog } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  activities: ActivityLog[];
  showUser?: boolean;
  className?: string;
}

const getActionIcon = (action: string) => {
  if (action.includes('LOGIN')) return '🔐';
  if (action.includes('CREATE')) return '➕';
  if (action.includes('UPDATE')) return '✏️';
  if (action.includes('DELETE')) return '🗑️';
  if (action.includes('EXPORT')) return '📤';
  if (action.includes('IMPORT')) return '📥';
  if (action.includes('PERMISSION')) return '🔑';
  return '📝';
};

const getActionColor = (actionCategory: string) => {
  switch (actionCategory) {
    case 'AUTH': return 'text-blue-600';
    case 'USER': return 'text-green-600';
    case 'PERMISSION': return 'text-purple-600';
    case 'DATA_TRANSFER': return 'text-orange-600';
    case 'HIGH_RISK': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const formatDateHeader = (date: string) => {
  const parsedDate = parseISO(date);
  if (isToday(parsedDate)) return 'Today';
  if (isYesterday(parsedDate)) return 'Yesterday';
  return format(parsedDate, 'EEEE, MMMM d, yyyy');
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  showUser = true,
  className
}) => {
  const [groupedActivities, setGroupedActivities] = useState<Record<string, ActivityLog[]>>({});

  useEffect(() => {
    // Group activities by date
    const grouped = activities.reduce((acc, activity) => {
      const date = activity.createdAt.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, ActivityLog[]>);

    setGroupedActivities(grouped);
  }, [activities]);

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedActivities).map(([date, dateActivities]) => (
        <div key={date} className="relative">
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-600">
              {formatDateHeader(date)}
            </h3>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {dateActivities.map((activity, index) => (
              <div key={activity.id} className="relative flex gap-x-4">
                {/* Timeline line */}
                {index !== dateActivities.length - 1 && (
                  <div className="absolute top-8 left-4 h-full w-0.5 bg-gray-200" />
                )}

                {/* Timeline dot */}
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                    {getActionIcon(activity.action)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Action */}
                      <div className="flex items-center gap-2">
                        <span className={cn('font-medium', getActionColor(activity.actionCategory || 'OTHER'))}>
                          {activity.action.replace(/_/g, ' ')}
                        </span>
                        {activity.responseStatus && activity.responseStatus >= 400 && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </div>

                      {/* Resource info */}
                      {(activity.resourceType || activity.resourceName) && (
                        <div className="mt-1 text-sm text-gray-600">
                          {activity.resourceType && (
                            <span className="font-medium">{activity.resourceType}: </span>
                          )}
                          {activity.resourceName || activity.resourceId}
                        </div>
                      )}

                      {/* User info */}
                      {showUser && activity.user && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <User className="h-3 w-3" />
                          <span>{activity.user.firstName} {activity.user.lastName}</span>
                          <span className="text-gray-400">({activity.user.email})</span>
                        </div>
                      )}

                      {/* Additional details */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        {/* Time */}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(activity.createdAt), 'HH:mm:ss')}
                        </div>

                        {/* IP Address */}
                        {activity.ipAddress && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {activity.ipAddress}
                          </div>
                        )}

                        {/* Device info */}
                        {activity.deviceInfo && (
                          <div className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            {(activity.deviceInfo as any).browser} on {(activity.deviceInfo as any).os}
                          </div>
                        )}

                        {/* Response time */}
                        {activity.responseTimeMs && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Response time:</span>
                            {activity.responseTimeMs}ms
                          </div>
                        )}
                      </div>

                      {/* Error message */}
                      {activity.errorMessage && (
                        <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-600">
                          {activity.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No activities to display
        </div>
      )}
    </div>
  );
};