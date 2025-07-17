'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Settings,
} from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';


const RupeeIcon = () => <span>₹</span>;

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: RupeeIcon},
];

interface MainNavProps {
  setOpen?: Dispatch<SetStateAction<boolean>>;
}

export function MainNav({ setOpen }: MainNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-start gap-2 px-2 text-sm font-medium">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            {
              'bg-muted text-primary': pathname === item.href,
            }
          )}
          onClick={() => setOpen && setOpen(false)}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
