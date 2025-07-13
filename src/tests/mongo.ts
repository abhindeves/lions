import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://lion:Achu@123@cluster0.ll56ncq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Change this to your URI
const client = new MongoClient(uri);

async function run(): Promise<void> {
    try {
        await client.connect();
        const adminDb = client.db().admin();
        const result = await adminDb.ping();
        console.log('✅ Ping succeeded:', result);
    } catch (error) {
        console.error('❌ Ping failed:', error);
    } finally {
        await client.close();
    }
}

run();
