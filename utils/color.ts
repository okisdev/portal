export const getBadgeColor = (variant: string) => {
  switch (variant) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-orange-100 text-orange-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'lead':
      return 'bg-yellow-100 text-yellow-800';
    case 'prospect':
      return 'bg-blue-100 text-blue-800';
    case 'customer':
      return 'bg-green-100 text-green-800';
    case 'churned':
      return 'bg-red-100 text-red-800';
    case 'opportunity':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
}

export function getPriorityBadgeColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-orange-100 text-orange-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
}
