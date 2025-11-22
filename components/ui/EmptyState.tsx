import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="py-12 text-center animate-in fade-in duration-300">
      <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <span className="text-slate-400">
          {icon}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>

      {description && (
        <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          <Button
            variant="primary"
            size="md"
            icon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
