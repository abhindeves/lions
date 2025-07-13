'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';


function LionIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4.5c1.5-1.5 4-1.5 5.5 0s1.5 4 0 5.5-4 1.5-5.5 0-1.5-4 0-5.5Z" />
      <path d="M12 14H2" />
      <path d="M19 14h-4" />
      <path d="M12 18H3" />
      <path d="M12 22v-4" />
      <path d="M12 14V8" />
      <path d="M12 4v-2" />
      <path d="M5 14l-3-3" />
      <path d="M8 11V8" />
      <path d="M5 18H2" />
    </svg>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </Button>
  );
}


export default function LoginPage() {
  const [state, formAction] = useActionState(login, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: state.error,
      });
    }
  }, [state, toast]);


  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <LionIcon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">LionsManager</h1>
            </div>
            <p className="text-balance text-muted-foreground">Enter your email below to login to your account</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Login</CardTitle>
              <CardDescription>
                Use your credentials to access the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="m@example.com" required defaultValue="admin@example.com" />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="ml-auto inline-block text-sm underline" prefetch={false}>
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id="password" name="password" type="password" required defaultValue="password" />
                </div>
                <LoginButton />
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <img
          src="https://placehold.co/1200x900.png"
          alt="Image"
          data-ai-hint="community event"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
