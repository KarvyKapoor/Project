
export enum Role {
  USER = 'User',
  ADMIN = 'Administrator',
}

export enum Badge {
  RECYCLING_ROOKIE = 'Recycling Rookie',
  WASTE_WARRIOR = 'Waste Warrior',
  COMPOST_CHAMPION = 'Compost Champion',
  COMMUNITY_VOICE = 'Community Voice',
  INFLUENCER = 'Influencer',
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: Role;
  points: number;
  badges: Badge[];
}

export enum Status {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
}

export interface Complaint {
  id: number;
  userId: number;
  userName: string;
  location: string;
  description: string;
  status: Status;
  createdAt: Date;
  resolvedAt?: Date;
  imageUrl?: string; 
  votes: number;
  isPublic: boolean;
  authenticityStatus?: 'Unverified' | 'Likely Authentic' | 'Potential Spam';
}

export interface Notification {
  id: number;
  userId: number; // The user who receives the notification
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export type UserView = 'home' | 'history' | 'gamification' | 'fileComplaint' | 'community' | 'help';
export type AdminView = 'recent' | 'history' | 'reports';

export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Hindi' | 'Tamil' | 'Sanskrit' | 'Punjabi' | 'Korean';
