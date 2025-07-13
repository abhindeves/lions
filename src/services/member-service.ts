'use server';

import type { Member } from '@/lib/types';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

async function getCollection(): Promise<Collection<Member>> {
    const client = await clientPromise;
    const db: Db = client.db("lionsManager"); // You can change the database name here
    return db.collection<Member>('members');
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
