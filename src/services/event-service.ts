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
  description?: string;
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

export async function deleteEvent(id: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, message: 'Invalid event ID format.' };
    }
    const collection = await getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return { success: false, message: 'Event not found.' };
    }

    return { success: true, message: 'Event deleted successfully.' };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Promise<{ success: boolean; message: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, message: 'Invalid event ID format.' };
    }
    const collection = await getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'Event not found.' };
    }

    return { success: true, message: 'Event updated successfully.' };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function addEvent(event: Omit<Event, 'id'>): Promise<{ success: boolean; message: string }> {
  try {
    const collection = await getCollection();
    await collection.insertOne(event);
    return { success: true, message: 'Event added successfully' };
  } catch (error) {
    console.error('Error adding event:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}
