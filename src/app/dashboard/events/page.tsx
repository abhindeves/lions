'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  PlusCircle,
  File,
} from 'lucide-react';
import {
  Badge,
} from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { events } from '@/lib/data';
import { Event } from '@/lib/types';
import { Input } from '@/components/ui/input';

function EventRow({ event }: { event: Event }) {
  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400';
      case 'Completed':
        return 'bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/10 dark:text-green-400';
      case 'Canceled':
        return 'bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-700 hover:bg-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {event.name}
      </TableCell>
      <TableCell>
        <Badge variant={'outline'} className={getStatusBadge(event.status)}>
          {event.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {event.eventType}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {new Date(event.date).toLocaleDateString()} at {event.time}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {event.venue}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-haspopup="true"
              size="icon"
              variant="ghost"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');

  const filteredEvents = events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.venue.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'all') return matchesSearch;
      return matchesSearch && event.status.toLowerCase() === activeTab;
  });

  return (
    <Tabs defaultValue="all" onValueChange={setActiveTab}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Event
            </span>
          </Button>
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Events</CardTitle>
          <CardDescription>
            Manage your club's events and view their details.
          </CardDescription>
           <div className="relative mt-2">
              <Input
                type="search"
                placeholder="Search events by name or venue..."
                className="w-full appearance-none bg-background pl-8 shadow-none md:w-1/2 lg:w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Date & Time</TableHead>
                <TableHead className="hidden sm:table-cell">Venue</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map(event => <EventRow key={event.id} event={event} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Tabs>
  );
}
