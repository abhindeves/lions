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
  imageUrl?: string; // Added for event image
};

export type AnnualSubscription = {
  _id?: ObjectId;
  id: string;
  memberId: string;
  memberName: string;
  annualAmount: number;
  createdAt: string;
  updatedAt: string;
  remainingBalance: number; // Calculated field
  status: 'Paid' | 'Unpaid' | 'Partial'; // Calculated field
  subscriptionYear: number; // New field for the subscription year
  carriedForwardDebt: number; // New field to store debt carried from previous years
};

export type Payment = {
  _id?: ObjectId;
  id: string;
  subscriptionId: string;
  amountPaid: number;
  paymentDate: string;
  method: 'Cash' | 'Online' | 'Bank Transfer' | 'Overpayment Transfer' | 'Debt Transfer';
  notes?: string;
};
