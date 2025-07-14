'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CircleUser,
  DollarSign,
  Users,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { Event } from '@/services/event-service';
import { getMembers } from '@/services/member-service';
import { getEvents } from '@/services/event-service';
import { getSubscriptions } from '@/services/subscription-service';
import { useEffect, useState } from 'react';
import type { Member } from '@/lib/types';
import type { Event } from '@/services/event-service';

const chartConfig = {
  count: {
    label: 'Members',
  },
  regular: {
    label: 'Regular',
    color: 'hsl(var(--chart-1))',
  },
  lifetime: {
    label: 'Lifetime',
    color: 'hsl(var(--chart-2))',
  },
  honorary: {
    label: 'Honorary',
    color: 'hsl(var(--chart-3))',
  },
};

export default function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const dbMembers = await getMembers();
      setMembers(dbMembers);
      const dbEvents = await getEvents();
      setEvents(dbEvents);
      const dbSubscriptions = await getSubscriptions();
      setSubscriptions(dbSubscriptions);
    };
    fetchData();
  }, []);

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const newMembersLastMonth = members.filter(m => new Date(m.membershipStartDate) >= oneMonthAgo).length;
  const upcomingEventsCount = events.filter(e => new Date(e.date) > new Date()).length;
  const outstandingDues = subscriptions
    .filter(s => s.status !== 'Paid')
    .reduce((acc, sub) => acc + sub.amount, 0);

  const chartData = [
    { type: 'Regular', count: members.filter(m => m.membershipType === 'Regular').length, fill: 'var(--color-regular)' },
    { type: 'Lifetime', count: members.filter(m => m.membershipType === 'Lifetime').length, fill: 'var(--color-lifetime)' },
    { type: 'Honorary', count: members.filter(m => m.membershipType === 'Honorary').length, fill: 'var(--color-honorary)' },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">+{newMembersLastMonth} since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">{((activeMembers / totalMembers) * 100).toFixed(0)}% of total members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{upcomingEventsCount}</div>
            <p className="text-xs text-muted-foreground">+{events.filter(e => new Date(e.date) > oneMonthAgo && e.status === 'Upcoming').length} since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${outstandingDues.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total amount unpaid or partial</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle className="font-headline">Upcoming Events</CardTitle>
              <CardDescription>
                Check out the next events organized by the club.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/events">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.filter(e => new Date(e.date) > new Date()).slice(0, 5).map(event => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="font-medium">{event.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {event.venue}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.eventType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{new Date(event.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Members Overview</CardTitle>
            <CardDescription>A breakdown of membership types.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="type"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="count" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
