'use server';

import type { Member } from '@/lib/types';
import clientPromise from '@/lib/mongodb';
import { Collection, Db, ObjectId } from 'mongodb';
import { members as staticMembers } from '@/lib/data';

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