import { contacts } from './contacts';

export const callHistory = [
  { id: 'c1', contact: contacts[0], type: 'video', direction: 'outgoing', timestamp: 'Today, 2:30 PM', duration: '12:45' },
  { id: 'c2', contact: contacts[2], type: 'voice', direction: 'incoming', timestamp: 'Today, 11:00 AM', duration: '5:20' },
  { id: 'c3', contact: contacts[4], type: 'voice', direction: 'missed', timestamp: 'Yesterday, 6:15 PM' },
  { id: 'c4', contact: contacts[1], type: 'video', direction: 'outgoing', timestamp: 'Yesterday, 3:00 PM', duration: '45:12' },
  { id: 'c5', contact: contacts[6], type: 'voice', direction: 'incoming', timestamp: '2 days ago', duration: '8:33' },
];
