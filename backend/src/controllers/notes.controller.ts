import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

interface AuthRequest extends Request {
  user: { id: number };
}

// GET /api/notes
export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

// POST /api/notes
export const createNote = async (req: AuthRequest, res: Response) => {
  const { title, content, color } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }
  try {
    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content ?? null,
        color: color ?? '#ffffff',
        userId: req.user.id,
      },
    });
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create note' });
  }
};

// PATCH /api/notes/:id
export const updateNote = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { title, content, color } = req.body;

  const existing = await prisma.note.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: 'Note not found' });

  try {
    const note = await prisma.note.update({
      where: { id },
      data: {
        title:   title   ?? existing.title,
        content: content ?? existing.content,
        color:   color   ?? existing.color,
      },
    });
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update note' });
  }
};

// DELETE /api/notes/:id
export const deleteNote = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.note.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: 'Note not found' });

  try {
    await prisma.note.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
};
