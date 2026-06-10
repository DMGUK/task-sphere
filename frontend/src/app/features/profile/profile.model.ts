export interface UserProfile {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null; // can be "/uploads/avatars/..." or external
  createdAt: string;
  emailVerifiedAt: string | null;
}

export interface UpdateProfilePayload {
  displayName?: string | null;
}
