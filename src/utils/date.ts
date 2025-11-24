export function isDeadlinePassed(deadline: string): boolean {
  const now = new Date()
  const [hours, minutes] = deadline.split(':').map(Number)
  const deadlineTime = new Date()
  deadlineTime.setHours(hours, minutes, 0, 0)

  return now >= deadlineTime
}

export function timeUntilDeadline(deadline: string): string {
  const now = new Date()
  const [hours, minutes] = deadline.split(':').map(Number)
  const deadlineTime = new Date()
  deadlineTime.setHours(hours, minutes, 0, 0)

  const diff = deadlineTime.getTime() - now.getTime()

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

