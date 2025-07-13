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
import { subscriptions } from '@/lib/data';
import { Subscription } from '@/lib/types';
import { Input } from '@/components/ui/input';

function SubscriptionRow({ sub }: { sub: Subscription }) {
  const getStatusBadge = (status: Subscription['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/10 dark:text-green-400';
      case 'Unpaid':
        return 'bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400';
      case 'Partial':
        return 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-700 hover:bg-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {sub.memberName}
      </TableCell>
      <TableCell>
        <Badge variant={'outline'} className={getStatusBadge(sub.status)}>
          {sub.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        ${sub.amount.toFixed(2)}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {new Date(sub.paymentDate).toLocaleDateString()}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {sub.paymentMethod}
      </TableCell>
       <TableCell className="hidden lg:table-cell">
        {sub.notes}
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
            <DropdownMenuItem>Edit Payment</DropdownMenuItem>
            <DropdownMenuItem>View Member</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');

  const filteredSubscriptions = subscriptions.filter(sub => {
      const matchesSearch = sub.memberName.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'all') return matchesSearch;
      return matchesSearch && sub.status.toLowerCase() === activeTab;
  });

  return (
    <Tabs defaultValue="all" onValueChange={setActiveTab}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="partial">Partial</TabsTrigger>
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
              Add Payment
            </span>
          </Button>
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Subscriptions</CardTitle>
          <CardDescription>
            Manage membership fee payments and track outstanding dues.
          </CardDescription>
           <div className="relative mt-2">
              <Input
                type="search"
                placeholder="Search by member name..."
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
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead className="hidden md:table-cell">Payment Date</TableHead>
                <TableHead className="hidden sm:table-cell">Method</TableHead>
                 <TableHead className="hidden lg:table-cell">Notes</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map(sub => <SubscriptionRow key={sub.id} sub={sub} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Tabs>
  );
}
