/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Memory {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  description?: string;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  category: string;
  previewImageUrl: string;
  images: Memory[];
  profile?: 'Girlfriend' | 'Boyfriend' | 'Us';
}

export interface CustomCategory {
  id: string;
  name: string;
  profile?: 'Girlfriend' | 'Boyfriend' | 'Us' | 'All';
  createdAt: string;
  order?: number;
}

export type AppStage = 'profile-selection' | 'trailer' | 'home' | 'countdown';

export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 22) return 'Evening';
  return 'Night';
};

// Raw images for Top 10 and other lookups
export const RAW_MEMORIES: Memory[] = Array.from({ length: 110 }, (_, i) => ({
  id: `img-${i + 3}`,
  title: `Moment #${i + 3}`,
  description: `From the Cinematic Collection`,
  imageUrl: i + 3 === 103 ? `images/103.jpeg` : (i + 3 >= 104 ? `images/${i + 3}.png` : `images/${i + 3}.jpg`)
}));

export const EPISODES: Episode[] = [
  // My Favorite Moments (5 Episodes)
  {
    id: 'ep-fight',
    title: 'The Big Fight',
    description: 'Moments • Episode 1',
    category: 'My Favorite Moments',
    previewImageUrl: 'images/93.jpg',
    images: Array.from({ length: 7 }, (_, i) => ({
      id: `fight-${i + 93}`,
      title: 'The Tension',
      imageUrl: `images/${i + 93}.jpg`,
      description: 'Moment from the big fight'
    }))
  },
  {
    id: 'id-love',
    title: 'The Love Story',
    description: 'Moments • Episode 2',
    category: 'My Favorite Moments',
    previewImageUrl: 'images/100.jpg',
    images: [
      { id: 'love-vid-6', title: 'Chapter 1', imageUrl: 'images/100.jpg', videoUrl: 'videos/6.mp4', description: 'The Story Cover' },
      { id: 'love-vid-7', title: 'Chapter 2', imageUrl: 'images/101.jpg', videoUrl: 'videos/7.mp4', description: 'The Journey Continues' },
      { id: 'love-img-102', title: 'Happily Ever After', imageUrl: 'images/102.jpg', description: 'The Resolution' }
    ]
  },
  {
    id: 'ep-dinners',
    title: 'Cozy Dinners',
    description: 'Moments • Episode 3',
    category: 'My Favorite Moments',
    previewImageUrl: 'images/32.jpg',
    images: RAW_MEMORIES.slice(29, 34).map((item, idx) => ({
      ...item,
      title: `Candlelight Ch. ${idx + 1}`,
      description: 'A beautiful moment shared over great food'
    }))
  },
  {
    id: 'ep-sunsets',
    title: 'Sunset Adventures',
    description: 'Moments • Episode 4',
    category: 'My Favorite Moments',
    previewImageUrl: 'images/65.jpg',
    images: RAW_MEMORIES.slice(62, 67).map((item, idx) => ({
      ...item,
      title: `Golden Hour Part ${idx + 1}`,
      description: 'Chasing sunsets and beautiful horizons'
    }))
  },
  {
    id: 'ep-stars',
    title: 'Under the Stars',
    description: 'Moments • Episode 5',
    category: 'My Favorite Moments',
    previewImageUrl: 'images/84.jpg',
    images: RAW_MEMORIES.slice(81, 86).map((item, idx) => ({
      ...item,
      title: `Midnight Talk ${idx + 1}`,
      description: 'Whispering under the quiet starry night'
    }))
  },

  // Her Smile Collection 😍 (5 Episodes)
  {
    id: 'ep7',
    title: 'Radiant Joy',
    description: 'Smile • Episode 1',
    category: 'Her Smile Collection 😍',
    previewImageUrl: 'images/9.jpg',
    images: [
      { id: 'vid-4', title: 'The Giggles', imageUrl: 'images/9.jpg', videoUrl: 'videos/4.mp4', description: 'Original Video Clip' },
      ...RAW_MEMORIES.slice(6, 14)
    ]
  },
  {
    id: 'ep8',
    title: 'Laughter Therapy',
    description: 'Smile • Episode 2',
    category: 'Her Smile Collection 😍',
    previewImageUrl: 'images/49.jpg',
    images: [
      { id: 'vid-5', title: 'Core Memories', imageUrl: 'images/49.jpg', videoUrl: 'videos/5.mp4', description: 'Original Video Clip' },
      ...RAW_MEMORIES.slice(46, 54)
    ]
  },
  {
    id: 'ep2',
    title: 'Pure Happiness',
    description: 'Smile • Episode 3',
    category: 'Her Smile Collection 😍',
    previewImageUrl: 'images/82.jpg',
    images: [
      { id: 'vid-6', title: 'Shining Bright', imageUrl: 'images/82.jpg', videoUrl: 'videos/6.mp4', description: 'Original Video Clip' },
      ...RAW_MEMORIES.slice(79, 87)
    ]
  },
  {
    id: 'ep4',
    title: 'The Early Days',
    description: 'Moments • Episode 4',
    category: 'Her Smile Collection 😍',
    previewImageUrl: 'images/5.jpg',
    images: [
      { id: 'vid-1', title: 'Start of Us', imageUrl: 'images/5.jpg', videoUrl: 'videos/1.mp4', description: 'Original Video Clip' },
      ...RAW_MEMORIES.slice(2, 10)
    ]
  },
  {
    id: 'ep1',
    title: 'The Growth Series',
    description: 'Moments • Episode 5',
    category: 'Her Smile Collection 😍',
    previewImageUrl: 'images/73.jpg',
    images: RAW_MEMORIES.slice(70, 79)
  },

  // Can’t Stop Looking at You (5 Episodes)
  {
    id: 'ep9',
    title: 'Visual Poetry',
    description: 'Look • Episode 1',
    category: 'Can’t Stop Looking at You',
    previewImageUrl: 'images/12.jpg',
    images: [
      { id: 'vid-7', title: 'Through My Eyes', imageUrl: 'images/12.jpg', videoUrl: 'videos/7.mp4', description: 'Original Video Clip' },
      ...RAW_MEMORIES.slice(9, 17)
    ]
  },
  {
    id: 'ep10',
    title: 'Cinematic Muse',
    description: 'Look • Episode 2',
    category: 'Can’t Stop Looking at You',
    previewImageUrl: 'images/61.jpg',
    images: [
      { id: 'vid-8', title: 'The Final Cut', imageUrl: 'images/61.jpg', videoUrl: 'videos/8.mp4', description: 'Original Video Clip' },
      ...RAW_MEMORIES.slice(58, 66)
    ]
  },
  {
    id: 'ep3',
    title: 'Enchanting Vibe',
    description: 'Look • Episode 3',
    category: 'Can’t Stop Looking at You',
    previewImageUrl: 'images/88.jpg',
    images: RAW_MEMORIES.slice(88, 90).concat(RAW_MEMORIES.slice(0, 7))
  },
  {
    id: 'ep5',
    title: 'Adventures Together',
    description: 'Look • Episode 4',
    category: 'Can’t Stop Looking at You',
    previewImageUrl: 'images/38.jpg',
    images: [
      { id: 'vid-2', title: 'On the Road', imageUrl: 'images/38.jpg', videoUrl: 'videos/2.mp4', description: 'Original Video Clip' },
      ...RAW_MEMORIES.slice(35, 43)
    ]
  },
  {
    id: 'ep6',
    title: 'Quiet Reflections',
    description: 'Look • Episode 5',
    category: 'Can’t Stop Looking at You',
    previewImageUrl: 'images/44.jpg',
    images: [
      { id: 'vid-3', title: 'Sunday Mornings', imageUrl: 'images/44.jpg', videoUrl: 'videos/3.mp4', description: 'Original Video Clip' },
      ...RAW_MEMORIES.slice(44, 52)
    ]
  }
];

export const CATEGORIES = [
  'Global Top 10 in MilliSbu',
  'My Favorite Moments',
  'Her Smile Collection 😍',
  'Can’t Stop Looking at You',
  'Continue Watching'
];

export const CAST_AND_CREDITS = [
  { role: 'Directed by', name: 'Your Favorite Person' },
  { role: 'Executive Producer', name: 'Millicent' },
  { role: 'Director of Photography', name: 'Millicent' },
  { role: 'Starring', name: 'Millicent' },
  { role: 'Supporting Cast', name: 'Friends, Family, & God' },
  { role: 'Music Supervisor', name: 'Spotify & Love' }
];

export const getNextAnniversary = () => {
  const now = new Date();
  const year = now.getFullYear();
  let next = new Date(year, 0, 18); // Jan 18
  if (now > next) {
    next = new Date(year + 1, 0, 18);
  }
  return next;
};

export const TARGET_DATE = getNextAnniversary();

export interface ImportantDate {
  id: string;
  name: string;
  dateStr: string;
  month: number; // 0-indexed month (0 = Jan, 6 = Jul)
  day: number;
  celebrationTitle: string;
  celebrationBody: string;
  badge: string;
  bgSeed: string;
}

export const getNextOccurrence = (month: number, day: number) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  let nextDate = new Date(currentYear, month, day, 0, 0, 0);
  
  // If the date has already passed this year, set relative to the next year
  if (now > nextDate) {
    nextDate = new Date(currentYear + 1, month, day, 0, 0, 0);
  }
  return nextDate;
};

export const IMPORTANT_DATES: ImportantDate[] = [
  {
    id: 'anniversary',
    name: 'Our Anniversary 💖',
    dateStr: '18 January',
    month: 0,
    day: 18,
    celebrationTitle: "Happy Anniversary Milli & Sbu! 💕",
    celebrationBody: "Today we celebrate another incredible year together of smiles, deep jokes, beautiful fights, and growing closer! You are my absolute main character forever! 🥂✨",
    badge: "Milestone Event",
    bgSeed: "milli-anniversary-bg"
  },
  {
    id: 'milli-birthday',
    name: "Milli's Birthday 🎂",
    dateStr: '08 July',
    month: 6,
    day: 8,
    celebrationTitle: "Happy Birthday Milli! 🎉🌸",
    celebrationBody: "Wishing the most beautiful, wonderful leading lady the happiest of birthdays today! Thank you for filling our world with radiant smiles and joy! I love you so much! Dearest Millicent 💖✨",
    badge: "Girlfriend's Big Day",
    bgSeed: "milli-birthday-bg"
  },
  {
    id: 'sbu-birthday',
    name: "Sbu's Birthday 🎂",
    dateStr: '26 January',
    month: 0,
    day: 26,
    celebrationTitle: "Happy Birthday Sbu! 🍕🍻",
    celebrationBody: "Saluting the coolest director of our love story! Wishing you the most incredible, blessed birthday, Dearest Sibusiso! Keep shining bright! 🌟🎂",
    badge: "Boyfriend's Big Day",
    bgSeed: "sbu-birthday-bg"
  }
];
