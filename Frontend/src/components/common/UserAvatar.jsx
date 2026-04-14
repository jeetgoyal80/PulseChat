import { getInitials, getStatusColor } from '@/utils/helpers';

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusSizes = {
  sm: 'w-2.5 h-2.5 -bottom-0 -right-0',
  md: 'w-3 h-3 -bottom-0.5 -right-0.5',
  lg: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
  xl: 'w-4 h-4 bottom-0 right-0',
};

const UserAvatar = ({ name, status = 'offline', size = 'md', isAI = false, showStatus = true }) => {
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold ${
          isAI
            ? 'bg-gradient-to-br from-primary to-temporary text-primary-foreground'
            : 'bg-surface-3 text-muted-foreground'
        }`}
      >
        {isAI ? '✦' : getInitials(name)}
      </div>
      {showStatus && status && (
        <div className={`absolute ${statusSizes[size]} rounded-full border-2 border-background ${getStatusColor(status)}`} />
      )}
    </div>
  );
};

export default UserAvatar;
