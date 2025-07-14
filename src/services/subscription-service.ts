'use server';

import clientPromise from '@/lib/mongodb';
import { Collection, Db, ObjectId } from 'mongodb';
import { subscriptions as staticSubscriptions } from '@/lib/data';
import { Subscription } from '@/lib/types';

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

import { getMembers } from '@/services/member-service';

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

        const subscriptionsToInsert = staticSubscriptions.map((sub, index) => ({
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
