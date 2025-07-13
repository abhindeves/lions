'use server';

import { redirect } from 'next/navigation';

export async function login(prevState: { error: string } | null, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  // Basic validation
  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }
  
  // Hardcoded credentials for demonstration
  if (email === 'admin@example.com' && password === 'password') {
    // In a real application, you would set a cookie or session token here.
    // For now, we'll just redirect.
    redirect('/dashboard');
  } else {
    return { error: 'Invalid email or password.' };
  }
}
