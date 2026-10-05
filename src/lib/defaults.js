export const DEFAULT_CATEGORIES = [
  { id: 'cat-cah', code: 'CAH', name: 'CAH Work', color: '#6366f1', group: 'work', order: 1 },
  { id: 'cat-dfi', code: 'DFI', name: 'DFI Work', color: '#06b6d4', group: 'work', order: 2 },
  { id: 'cat-um', code: 'UM', name: 'UM Tasks', color: '#3b82f6', group: 'work', order: 3 },
  { id: 'cat-mtq', code: 'MTQ', name: 'MTQ Activities', color: '#8b5cf6', group: 'work', order: 4 },
  { id: 'cat-f', code: 'F', name: 'Freelance', color: '#f59e0b', group: 'work', order: 5 },
  { id: 'cat-fam', code: 'FAM', name: 'Keluarga (Family)', color: '#ec4899', group: 'family', order: 6 },
  { id: 'cat-me', code: 'ME', name: 'Diri Sendiri (Self)', color: '#10b981', group: 'self', order: 7 },
];

export const CATEGORY_GROUPS = [
  { id: 'work', name: 'Produktif / Kerja', color: '#6366f1', icon: 'Briefcase' },
  { id: 'family', name: 'Keluarga', color: '#ec4899', icon: 'Heart' },
  { id: 'self', name: 'Diri Sendiri', color: '#10b981', icon: 'Sparkles' },
];

export const DEFAULT_ROUTINES = [
  { id: 'rt-fam-play', categoryId: 'cat-fam', description: 'Menemani Bermain', defaultMin: 45 },
  { id: 'rt-fam-read', categoryId: 'cat-fam', description: 'Membaca Bersama', defaultMin: 30 },
  { id: 'rt-fam-sleep', categoryId: 'cat-fam', description: 'Menidurkan Anak', defaultMin: 35 },
  { id: 'rt-me-workout', categoryId: 'cat-me', description: 'Olahraga & Peregangan', defaultMin: 30 },
];

export const DEFAULT_SETTINGS = {
  cutoffHour: 4,          // 04:00 AM cutoff
  sleepNightMin: 300,     // 5 hours
  sleepNapMin: 35,        // 35 minutes
  checkinReminderHour: 21 // 21:00 (9 PM)
};
