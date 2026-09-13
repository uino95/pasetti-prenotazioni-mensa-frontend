import apiClient, { type ApiResponse } from '../client'
import qs from 'qs'
import type { MenuItem } from './menus'

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export interface ScheduleDay {
  documentId: string
  weekday: Weekday
  deadline: string
  items: MenuItem[]
}

function scheduleQuery(weekday?: Weekday) {
  return qs.stringify({
    populate: {
      items: {
        populate: ['category'],
      },
    },
    filters: {
      weekday: {
        $eq: weekday,
      },
    },
  })
}

export async function getScheduleDays(): Promise<ScheduleDay[]> {
  const response = await apiClient.get<ApiResponse<ScheduleDay[]>>(
    `/api/schedule-days?${scheduleQuery()}`,
  )
  return response.data.data
}

export async function getScheduleDay(date: Date): Promise<ScheduleDay | undefined> {
  const weekday = WEEKDAYS[Math.max(date.getDay() - 1, 0)];
  const response = await apiClient.get<ApiResponse<ScheduleDay[]>>(
    `/api/schedule-days?${scheduleQuery(weekday)}`,
  )
  return response.data.data.length > 0 ? response.data.data[0] : undefined
}

export async function createScheduleDay(data: {
  weekday: Weekday
  deadline: string
  items?: string[]
}): Promise<ScheduleDay> {
  const response = await apiClient.post<ApiResponse<ScheduleDay>>(
    `/api/schedule-days?${scheduleQuery()}`,
    {
      data: {
        weekday: data.weekday,
        deadline: data.deadline,
        items: data.items ? { set: data.items } : undefined,
      },
    },
  )
  return response.data.data
}

export async function updateScheduleDay(
  documentId: string,
  data: { deadline?: string; items?: { set?: string[]; connect?: string[]; disconnect?: string[] } },
): Promise<ScheduleDay> {
  const response = await apiClient.put<ApiResponse<ScheduleDay>>(
    `/api/schedule-days/${documentId}?${scheduleQuery()}`,
    { data },
  )
  return response.data.data
}

export async function addItemToScheduleDay(
  documentId: string,
  itemId: string,
): Promise<ScheduleDay> {
  const response = await apiClient.put<ApiResponse<ScheduleDay>>(
    `/api/schedule-days/${documentId}?${scheduleQuery()}`,
    {
      data: { items: { connect: [itemId] } },
    },
  )
  return response.data.data
}

export async function removeItemFromScheduleDay(
  documentId: string,
  itemId: string,
): Promise<ScheduleDay> {
  const response = await apiClient.put<ApiResponse<ScheduleDay>>(
    `/api/schedule-days/${documentId}?${scheduleQuery()}`,
    {
      data: { items: { disconnect: [itemId] } },
    },
  )
  return response.data.data
}
