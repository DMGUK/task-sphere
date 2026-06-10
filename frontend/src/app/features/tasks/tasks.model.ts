export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 0 | 1 | 2;

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;   // or Date depending on how you parse
  priority: TaskPriority;
  status: TaskStatus;
  originalStatus: TaskStatus; // 👈 NEW
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  dueDate?: string | null;         // or Date | null depending how you send it
  priority?: TaskPriority;               // 1 = high, 2 = normal, 3 = low, etc.
  status?: 'todo' | 'in_progress' | 'done';
  completed?: true | false;
  originalStatus?: 'todo' | 'in_progress';
}
