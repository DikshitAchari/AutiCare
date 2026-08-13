import type { Role } from './auth';

export type UserAccountStatus = 'ACTIVE' | 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export interface UserBase {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string;
  status: UserAccountStatus;
  joinedDate: string;
  avatarUrl?: string;
}

export interface ParentUser extends UserBase {
  role: 'PARENT';
  address?: string;
  childrenIds: string[];
}

export interface TherapistUser extends UserBase {
  role: 'THERAPIST';
  title: string;
  qualification: string;
  experienceYears: number;
  specializations: string[];
  languages: string[];
  bio: string;
  rating: number;
  reviewsCount: number;
  hourlyRate?: number;
  location: string;
  documentsVerified: boolean;
}

export interface AdminUser extends UserBase {
  role: 'ADMIN';
  department: string;
}
