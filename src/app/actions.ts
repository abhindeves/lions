'use server';

import { deleteMember } from '@/services/member-service';
import { revalidatePath } from 'next/cache';
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

export async function deleteMemberAction(
  prevState: { error?: string; message?: string } | null,
  formData: FormData
) {
  const id = formData.get('id');

  if (!id || typeof id !== 'string') {
    return { error: 'Invalid member ID.' };
  }

  try {
    const result = await deleteMember(id);
    if (result.success) {
      revalidatePath('/dashboard/members'); // Revalidate the members list page
      return { message: result.message };
    }
    return { error: result.message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}
