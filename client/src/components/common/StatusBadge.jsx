// ============================================================
// Rakshak AI - Status Badge Component
// ============================================================

export default function StatusBadge({ status, size = 'sm' }) {
  const classes = {
    APPROVED: 'badge-approved',
    REVIEW: 'badge-review',
    BLOCKED: 'badge-blocked',
    PENDING: 'badge-pending',
  };

  const dots = {
    APPROVED: 'bg-green-500',
    REVIEW: 'bg-orange-500',
    BLOCKED: 'bg-red-500',
    PENDING: 'bg-gray-400',
  };

  return (
    <span className={classes[status] || classes.PENDING}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dots[status] || dots.PENDING}`} />
      {status}
    </span>
  );
}
