import React from 'react';


interface StorageChartProps {
  storageUsedStandard: number;
  storageUsedArchived: number;
  storageUsedStandardDeleted: number;
  storageUsedArchivedDeleted: number;
}

export const StorageChart: React.FC<StorageChartProps> = ({
  storageUsedStandard,
  storageUsedArchived,
  storageUsedStandardDeleted,
  storageUsedArchivedDeleted,
}) => {
  // Convert bytes to GB
  const standardGB = storageUsedStandard / (1024 * 1024 * 1024);
  const archivedGB = storageUsedArchived / (1024 * 1024 * 1024);
  const standardDeletedGB = storageUsedStandardDeleted / (1024 * 1024 * 1024);
  const archivedDeletedGB = storageUsedArchivedDeleted / (1024 * 1024 * 1024);

  const totalGB = standardGB + archivedGB + standardDeletedGB + archivedDeletedGB;

  // Calculate percentages for the pie chart
  const standardPercent = totalGB > 0 ? (standardGB / totalGB) * 100 : 0;
  const archivedPercent = totalGB > 0 ? (archivedGB / totalGB) * 100 : 0;
  const standardDeletedPercent = totalGB > 0 ? (standardDeletedGB / totalGB) * 100 : 0;
  const archivedDeletedPercent = totalGB > 0 ? (archivedDeletedGB / totalGB) * 100 : 0;

  // Calculate SVG circle parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;

  currentOffset += (standardPercent / 100) * circumference;
  

  currentOffset += (archivedPercent / 100) * circumference;
  

  currentOffset += (standardDeletedPercent / 100) * circumference;
  


  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Pie Chart */}
      <div className="relative">
        <svg width="140" height="140" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth="12"
          />
          
          {/* Standard Storage */}
          {standardPercent > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (standardPercent / 100) * circumference}
              strokeLinecap="round"
            />
          )}
          
          {/* Archived Storage */}
          {archivedPercent > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (archivedPercent / 100) * circumference}
              strokeLinecap="round"
              transform={`rotate(${(standardPercent / 100) * 360} 70 70)`}
            />
          )}
          
          {/* Standard Deleted Storage */}
          {standardDeletedPercent > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#EF4444"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (standardDeletedPercent / 100) * circumference}
              strokeLinecap="round"
              transform={`rotate(${((standardPercent + archivedPercent) / 100) * 360} 70 70)`}
            />
          )}
          
          {/* Archived Deleted Storage */}
          {archivedDeletedPercent > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (archivedDeletedPercent / 100) * circumference}
              strokeLinecap="round"
              transform={`rotate(${((standardPercent + archivedPercent + standardDeletedPercent) / 100) * 360} 70 70)`}
            />
          )}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-bold text-white">{totalGB.toFixed(1)}</div>
          <div className="text-xs text-gray-400">GB Total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div className="flex-1">
            <div className="text-xs text-gray-400">Standard</div>
            <div className="text-sm font-medium text-white">{standardGB.toFixed(2)} GB</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="flex-1">
            <div className="text-xs text-gray-400">Archived</div>
            <div className="text-sm font-medium text-white">{archivedGB.toFixed(2)} GB</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="flex-1">
            <div className="text-xs text-gray-400">Standard Deleted</div>
            <div className="text-sm font-medium text-white">{standardDeletedGB.toFixed(2)} GB</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <div className="flex-1">
            <div className="text-xs text-gray-400">Archived Deleted</div>
            <div className="text-sm font-medium text-white">{archivedDeletedGB.toFixed(2)} GB</div>
          </div>
        </div>
      </div>
    </div>
  );
};
