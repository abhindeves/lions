'use server';

import clientPromise from '@/lib/mongodb';
import { Collection, Db, ObjectId } from 'mongodb';
import { subscriptions as staticSubscriptions } from '@/lib/data';
import { Subscription } from '@/lib/types';
import { getMembers } from '@/services/member-service';

async function getCollection(): Promise<Collection<Omit<Subscription, 'id'>>> {
    const client = await clientPromise;
    const db: Db = client.db("lionsManager"); // You can change the database name here
    return db.collection<Omit<Subscription, 'id'>>('subscriptions');
}

export async function getSubscriptions(): Promise<Subscription[]> {
    try {
        const collection = await getCollection();
        const subscriptions = await collection.find({}).map(doc => ({...doc, id: doc._id.toString()})).toArray();
        return JSON.parse(JSON.stringify(subscriptions));
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
    }
}

export async function seedSubscriptions(): Promise<{ success: boolean, message: string }> {
    try {
        const collection = await getCollection();
        const count = await collection.countDocuments();

        if (count > 0) {
            return { success: true, message: 'Database already seeded.' };
        }

        const members = await getMembers();
        if (members.length === 0) {
            return { success: false, message: 'No members found to link subscriptions to. Please seed members first.' };
        }

        const subscriptionsToInsert = staticSubscriptions.map((sub: Omit<Subscription, 'id'>, index: number) => ({
            ...sub,
            memberId: members[index % members.length].id, 
            memberName: members[index % members.length].fullName,
        }));
        await collection.insertMany(subscriptionsToInsert);
        return { success: true, message: `Database seeded successfully with ${subscriptionsToInsert.length} subscriptions.` };
    } catch (error) {
        console.error('Error seeding subscriptions:');
        console.error(error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function addSubscription(subscription: Omit<Subscription, 'id'>): Promise<{ success: boolean; message: string }> {
  try {
    const collection = await getCollection();
    await collection.insertOne(subscription);
    return { success: true, message: 'Subscription added successfully' };
  } catch (error) {
    console.error('Error adding subscription:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function updateSubscription(id: string, updates: Partial<Omit<Subscription, 'id'>>): Promise<{ success: boolean; message: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, message: 'Invalid subscription ID format.' };
    }
    const collection = await getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'Subscription not found.' };
    }

    return { success: true, message: 'Subscription updated successfully.' };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}