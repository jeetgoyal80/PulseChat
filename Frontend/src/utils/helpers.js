export const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'online': return 'bg-online';
    case 'away': return 'bg-warning';
    case 'busy': return 'bg-destructive';
    default: return 'bg-muted-foreground/40';
  }
};
