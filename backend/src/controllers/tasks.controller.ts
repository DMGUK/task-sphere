import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user: { id: number };
}

// GET /api/tasks
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

// POST /api/tasks
export async function createTask(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { title, description, dueDate, priority, status } = req.body;

  // default status if not provided
  const initialStatus = status ?? 'todo';

  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority ?? 2,
      status: initialStatus,
      originalStatus: initialStatus,      // 👈 key line
      completed: initialStatus === 'done',
      userId,
    },
  });

  res.status(201).json(task);
}

// PATCH /api/tasks/:id
// controllers/tasks.controller.ts

export async function updateTask(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const userId = req.user!.id;

  const { title, description, dueDate, priority, status, completed } = req.body;

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title:        title        ?? existing.title,
      description:  description  ?? existing.description,
      dueDate:      dueDate ? new Date(dueDate) : existing.dueDate,
      priority:     priority     ?? existing.priority,
      status:       status       ?? existing.status,
      completed:    completed    ?? existing.completed,
      // originalStatus stays as-is
    },
  });

  res.json(updated);
}


// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: 'Invalid task id' });
    return;
  }

  try {
    await prisma.task.delete({
      where: {
        // same note as above – add userId if you already had it
        id,
      },
    });

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};
