import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}) => {
  const baseStyles = 'animate-pulse bg-slate-200';

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style = {
    width: width,
    height: height,
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} ${variantStyles.text} ${className}`}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : width // última linha mais curta
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton width="40%" height={16} />
        <Skeleton width="25%" height={12} />
      </div>
    </div>
    <Skeleton height={32} />
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <Skeleton height={16} width={i === 0 ? '70%' : '50%'} />
      </td>
    ))}
  </tr>
);

// KPI Card Skeleton
export const KPISkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="rectangular" width={44} height={44} />
      <Skeleton width="60%" height={12} />
    </div>
    <Skeleton height={36} width="80%" />
    <Skeleton height={12} width="50%" className="mt-2" />
  </div>
);

export default Skeleton;
