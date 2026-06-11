export interface Note {
  id: number;
  title: string;
  content: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotePayload {
  title: string;
  content?: string | null;
  color?: string;
}
