'use server';

import clientPromise from '@/lib/mongodb';
import { Collection, Db, ObjectId } from 'mongodb';
import { events as staticEvents } from '@/lib/data';

export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  eventType: 'Community' | 'Fundraiser' | 'Meeting' | 'Social';
  status: 'Upcoming' | 'Completed' | 'Canceled';
  attachments?: string[];
}

async function getCollection(): Promise<Collection<Omit<Event, 'id'>>> {
    const client = await clientPromise;
    const db: Db = client.db("lionsManager"); // You can change the database name here
    return db.collection<Omit<Event, 'id'>>('events');
}

export async function getEvents(): Promise<Event[]> {
    try {
        const collection = await getCollection();
        const events = await collection.find({}).map(doc => ({...doc, id: doc._id.toString()})).toArray();
        return JSON.parse(JSON.stringify(events));
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

export async function seedEvents(): Promise<{ success: boolean, message: string }> {
    try {
        const collection = await getCollection();
        const count = await collection.countDocuments();

        if (count > 0) {
            return { success: true, message: 'Database already seeded.' };
        }
        await collection.insertMany(staticEvents);
        return { success: true, message: `Database seeded successfully with ${staticEvents.length} events.` };
    } catch (error) {
        console.error('Error seeding events:');
        console.error(error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
}
