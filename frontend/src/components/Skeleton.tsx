import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height="1em"
        width={i === lines - 1 ? '80%' : '100%'}
      />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" height="1.2em" width="60%" />
        <Skeleton variant="text" height="0.9em" width="40%" className="mt-1" />
      </div>
    </div>
    <TextSkeleton lines={2} />
  </div>
);

export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`border rounded-lg overflow-hidden ${className}`}>
    {/* Header */}
    <div className="flex gap-4 p-4 bg-gray-50 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" height="1.2em" width="100%" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-b-0">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" height="1em" width="100%" />
        ))}
      </div>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 5, className = '' }) => (
  <div className={`flex flex-col gap-3 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
        <Skeleton variant="circular" width={32} height={32} />
        <div className="flex-1">
          <Skeleton variant="text" height="1em" width="70%" />
          <Skeleton variant="text" height="0.8em" width="50%" className="mt-1" />
        </div>
      </div>
    ))}
  </div>
);

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <Skeleton variant="text" height="0.9em" width="50%" />
    <Skeleton variant="text" height="2em" width="70%" className="mt-2" />
    <Skeleton variant="text" height="0.8em" width="40%" className="mt-2" />
  </div>
);

export const ChartSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <Skeleton variant="text" height="1.5em" width="40%" className="mb-4" />
    <Skeleton variant="rectangular" height={200} />
  </div>
);

export const AvatarSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  return (
    <Skeleton
      variant="circular"
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={className}
    />
  );
};

export const ButtonSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return <Skeleton variant="rectangular" className={`${sizeMap[size]} ${className}`} />;
};

export const InputSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={className}>
    <Skeleton variant="text" height="0.9em" width="30%" className="mb-2" />
    <Skeleton variant="rectangular" height={40} />
  </div>
);

export const BadgeSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton variant="rectangular" height={24} width={60} className={className} />
);
