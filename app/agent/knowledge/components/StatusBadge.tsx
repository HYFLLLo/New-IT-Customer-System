import { DocumentStatus } from '@prisma/client'

interface StatusBadgeProps {
  status: DocumentStatus
}

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  PENDING: {
    label: '等待中',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  PROCESSING: {
    label: '处理中',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  PROCESSED: {
    label: '已完成',
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  FAILED: {
    label: '失败',
    className: 'bg-red-100 text-red-800 border-red-200'
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  )
}