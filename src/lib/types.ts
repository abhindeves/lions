import { ObjectId } from 'mongodb';

export type Member = {
  _id?: ObjectId; // MongoDB's default primary key
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  membershipStartDate: string;
  membershipType: 'Regular' | 'Lifetime' | 'Honorary';
  status: 'Active' | 'Inactive';
  profilePhotoUrl?: string;
  profilePhotoFile?: File; // Added for file upload handling in frontend
  outstandingDues: number;
};

export type Event = {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  eventType: 'Community' | 'Fundraiser' | 'Meeting' | 'Social';
  status: 'Upcoming' | 'Completed' | 'Canceled';
  attachments?: string[];
};

export type Subscription = {
  id: string;
  memberId: string;
  memberName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Online';
  status: 'Paid' | 'Unpaid' | 'Partial';
  notes?: string;
};
