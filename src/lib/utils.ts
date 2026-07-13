import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRelativeTime(timestamp: number | string | Date, short = false): string {
  const date = new Date(timestamp);
  
  // If invalid date (e.g., string "Just now"), fallback to 1m if short
  if (isNaN(date.getTime())) {
    if (short) return '1m';
    return typeof timestamp === 'string' ? timestamp : 'Just now';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return short ? '1m' : 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return short ? `${diffInMinutes}m` : `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return short ? `${diffInHours}h` : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (short) {
    return `${diffInDays}d`;
  }
  
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
}

export function logActivity(user: string, action: string, target: string, type: 'task' | 'log' | 'project' | 'standup' | 'assign' | 'login' | 'meeting') {
  const storedFeed = localStorage.getItem('hindustaan_activity_feed');
  const feed = storedFeed ? JSON.parse(storedFeed) : [];
  const newActivity = {
    id: `a${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    user,
    action,
    target,
    time: 'Just now',
    timestamp: Date.now(),
    type
  };
  const updatedFeed = [newActivity, ...feed].slice(0, 50); // Keep last 50
  localStorage.setItem('hindustaan_activity_feed', JSON.stringify(updatedFeed));
  window.dispatchEvent(new CustomEvent('local-storage-update', { 
    detail: { key: 'hindustaan_activity_feed', value: JSON.stringify(updatedFeed) } 
  }));
}