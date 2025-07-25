'use server';

import clientPromise from '@/lib/mongodb';
import { Collection, Db, ObjectId } from 'mongodb';
import { members as staticMembers } from '@/lib/data';

// src/services/member-service.ts
export interface Member {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  membershipStartDate: string;
  membershipType: 'Regular' | 'Lifetime' | 'Honorary';
  status: 'Active' | 'Inactive';
  profilePhotoUrl?: string;
  outstandingDues: number;
}

async function getCollection(): Promise<Collection<Omit<Member, 'id'>>> {
    const client = await clientPromise;
    const db: Db = client.db("lionsManager"); // You can change the database name here
    return db.collection<Omit<Member, 'id'>>('members');
}

export async function getMembers(): Promise<Member[]> {
    try {
        const collection = await getCollection();
        // The ._id field from MongoDB is converted to a string for the id field.
        const members = await collection.find({}).map(doc => ({...doc, id: doc._id.toString()})).toArray();
        return JSON.parse(JSON.stringify(members)); // Serialize to plain objects
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

export async function seedMembers(): Promise<{ success: boolean, message: string }> {
 
    try {
        const collection = await getCollection();
        const count = await collection.countDocuments();

        if (count > 0) {
            return { success: true, message: 'Database already seeded.' };
        }
        await collection.insertMany(staticMembers);
        return { success: true, message: `Database seeded successfully with ${staticMembers.length} members.` };
    } catch (error) {
        console.error('Error seeding members:');
        console.error(error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };

    }
}

export async function addMember(member: Omit<Member, 'id'>): Promise<{ success: boolean; message: string }> {
  try {
    const collection = await getCollection();
    await collection.insertOne(member);
    return { success: true, message: 'Member added successfully' };
  } catch (error) {
    console.error('Error adding member:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function deleteMember(id: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, message: 'Invalid member ID format.' };
    }
    const collection = await getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return { success: false, message: 'Member not found.' };
    }

    return { success: true, message: 'Member deleted successfully.' };
  } catch (error) {
    console.error('Error deleting member:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function updateMember(id: string, updates: Partial<Omit<Member, 'id'>>): Promise<{ success: boolean; message: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, message: 'Invalid member ID format.' };
    }
    const collection = await getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'Member not found.' };
    }

    return { success: true, message: 'Member updated successfully.' };
  } catch (error) {
    console.error('Error updating member:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function getMemberById(id: string): Promise<Member | null> {
  try {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const collection = await getCollection();
    const member = await collection.findOne({ _id: new ObjectId(id) });
    if (member) {
      return JSON.parse(JSON.stringify({ ...member, id: member._id.toString() }));
    }
    return null;
  } catch (error) {
    console.error('Error fetching member by ID:', error);
    return null;
  }
}