import type { LucideIcon } from 'lucide-react';
import { Cloud, Gift, Heart, Rocket, Sparkles } from 'lucide-react';

export type Category = 'Dreams' | 'Fun' | 'Treats' | 'Boost';
export type PondPost = { id: number; name: string; handle: string; initials: string; hue: string; time: string; action: string; category: Category; message: string; target: number; raised: number; amount?: number; reactions: number; comments: number; avatar?: string; };
export const categories: { title: Category; subtitle: string; description: string; icon: LucideIcon; tone: string }[] = [
  { title: 'Dreams', subtitle: 'Make something possible', description: 'Big ideas, little dreams, and everything worth believing in.', icon: Rocket, tone: 'lavender' },
  { title: 'Fun', subtitle: 'Make memories together', description: 'Experiences, adventures, hobbies, and things that bring joy.', icon: Sparkles, tone: 'blue' },
  { title: 'Treats', subtitle: 'The little joys', description: 'A coffee, a lunch, a kind surprise — small gestures matter.', icon: Gift, tone: 'peach' },
  { title: 'Boost', subtitle: 'A little help goes a long way', description: 'Everyday essentials and practical support when it counts.', icon: Heart, tone: 'mint' },
];
export const balls = [
  { value: 2, name: 'A little ripple', desc: 'A small gesture, a meaningful start.', color: '#42d9ee' },
  { value: 5, name: 'A kind thought', desc: 'Send some brightness their way.', color: '#e445c6' },
  { value: 10, name: 'A spark of support', desc: 'Make an ordinary day special.', color: '#448aff' },
  { value: 20, name: 'Growing together', desc: 'Help something good take root.', color: '#3acb84' },
  { value: 50, name: 'A generous glow', desc: 'A little extra possibility.', color: '#ef9d41' },
  { value: 100, name: 'Magic in motion', desc: 'Big-hearted giving feels good.', color: '#ab62ec' },
  { value: 500, name: 'Change a chapter', desc: 'Give a dream room to grow.', color: '#36a9e9' },
  { value: 1000, name: 'Something extraordinary', desc: 'Be part of a turning point.', color: '#ed4d82' },
  { value: 5000, name: 'A dream takes flight', desc: 'Transform what feels possible.', color: '#a659fa' },
  { value: 10000, name: 'A golden moment', desc: 'An unforgettable act of support.', color: '#ffbf45' },
  { value: 50000, name: 'Beyond the horizon', desc: 'Help create lasting impact.', color: '#89d7fb' },
  { value: 100000, name: 'Limitless belief', desc: 'A remarkable expression of care.', color: '#9ac6fb' },
  { value: 250000, name: 'A universe of good', desc: 'For life-changing possibilities.', color: '#ca7bed' },
  { value: 500000, name: 'Brighter futures', desc: 'A beautiful new beginning.', color: '#63dbbc' },
  { value: 1000000, name: 'The impossible, possible', desc: 'A once-in-a-lifetime gift.', color: '#f1b973' },
];
export const sparkBalls = [
  { value: 33, name: 'First Spark', color: '#eeb3d4', description: 'You caught my attention.', phrase: 'A gentle first hello.', icon: Heart },
  { value: 77, name: 'Chemistry', color: '#a93085', description: "I'd really like to get to know you.", phrase: 'A little more than a hello.', icon: Heart },
  { value: 108, name: 'Cosmic Connection', color: '#6946b3', description: "There's something special about you.", phrase: 'A connection worth exploring.', icon: Heart },
];
export const demoPosts: PondPost[] = [
 { id: 1, name: 'Sarah Mitchell', handle: '@sarahm', initials: 'SM', hue: 'lilac', time: '12 min ago', action: 'sent Michael a Dream Ball', category: 'Dreams', message: 'Helping Michael get one step closer to his photography business! 📷 Every big dream starts with a little belief.', target: 500, raised: 160, amount: 5, reactions: 42, comments: 8 },
 { id: 2, name: 'James Rivera', handle: '@jamesr', initials: 'JR', hue: 'sky', time: '38 min ago', action: 'shared a new Boost', category: 'Boost', message: 'Saving up for the tools to start my new job. A fresh start means the world to me. 🌱', target: 200, raised: 85, reactions: 28, comments: 5 },
 { id: 3, name: 'Clara Williams', handle: '@claraw', initials: 'CW', hue: 'peach', time: '2 hours ago', action: 'shared a little Treat', category: 'Treats', message: 'Coffee and a good book on a rainy Sunday. Sometimes the smallest moments are the sweetest. ☕', target: 25, raised: 15, reactions: 51, comments: 12 },
 { id: 4, name: 'Noah Thompson', handle: '@noaht', initials: 'NT', hue: 'mint', time: 'Yesterday', action: 'shared a Fun goal', category: 'Fun', message: 'I want to take my little sister to her first concert. Making memories together is everything. 🎶', target: 180, raised: 72, reactions: 38, comments: 6 },
];
export const people = [
 { name: 'Michael Chen', handle: '@michaelc', initials: 'MC', hue: 'sky', category: 'Dreams' as Category, title: 'Starting a photography studio', location: 'Portland, OR', raised: 160, target: 500 },
 { name: 'Ava Rodriguez', handle: '@avar', initials: 'AR', hue: 'peach', category: 'Fun' as Category, title: 'Taking my first pottery class', location: 'Austin, TX', raised: 75, target: 150 },
 { name: 'James Rivera', handle: '@jamesr', initials: 'JR', hue: 'mint', category: 'Boost' as Category, title: 'New tools for a fresh start', location: 'Denver, CO', raised: 85, target: 200 },
 { name: 'Clara Williams', handle: '@claraw', initials: 'CW', hue: 'lilac', category: 'Treats' as Category, title: 'Coffee, a book, and a little joy', location: 'Seattle, WA', raised: 15, target: 25 },
 { name: 'Noah Thompson', handle: '@noaht', initials: 'NT', hue: 'blue', category: 'Fun' as Category, title: 'My sister’s first concert', location: 'Chicago, IL', raised: 72, target: 180 },
 { name: 'Leah Brooks', handle: '@leahb', initials: 'LB', hue: 'pink', category: 'Dreams' as Category, title: 'A tiny flower studio of my own', location: 'Brooklyn, NY', raised: 340, target: 900 },
];
export const testimonials = [
 { quote: 'Sometimes knowing someone believes in your dream is the best gift of all.', name: 'A little belief goes a long way', detail: 'The heart behind Quantum Pond' },
];
