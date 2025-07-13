// A simple API route example.
// You can access this at http://localhost:9002/api/hello

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello from the backend!' });
}
