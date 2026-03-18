export type User = {
  id: string
  name: string
  role: 'admin' | 'member'
  avatar_color: string | null
  created_at: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high'

export type Task = {
  id: string
  title: string
  type: string | null
  description: string | null
  start_date: string | null
  deadline: string
  assignee_id: string | null
  status: TaskStatus
  client: string | null
  priority: TaskPriority
  created_at: string
}

export type Client = {
  id: string
  name: string
  contact: string | null
  created_at: string
}
