export function isDeadlinePassed(deadline: string, now?: Date): boolean {
  const currentTime = now ?? new Date()
  const [hours, minutes] = deadline.split(':').map(Number)
  const deadlineTime = new Date()
  if (hours === undefined || minutes === undefined) {
    return true
  }
  deadlineTime.setHours(hours, minutes, 0, 0)

  return currentTime >= deadlineTime
}

export function toRelativeDate(date: Date): string {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

export function timeUntilDeadline(deadline: string, now?: Date): string {
  const currentTime = now ?? new Date()
  const [hours, minutes] = deadline.split(':').map(Number)
  const deadlineTime = new Date()
  if (hours === undefined || minutes === undefined) {
    return '0m'
  }
  deadlineTime.setHours(hours, minutes, 0, 0)

  const diff = deadlineTime.getTime() - currentTime.getTime()

  if (diff <= 0) {
    return '0m'
  }

  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hoursRemaining > 0) {
    return `${hoursRemaining}h ${minutesRemaining}m`
  }
  return `${minutesRemaining}m`
}