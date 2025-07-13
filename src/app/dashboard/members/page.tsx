'use client';

import * as React from 'react';
import {
  ChevronDown,
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
import { members } from '@/lib/data';
import { Member } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';


function MemberRow({ member }: { member: Member }) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }
  return (
    <TableRow>
      <TableCell className="hidden sm:table-cell">
         <Avatar className="h-8 w-8">
            <AvatarImage src={member.profilePhotoUrl} alt={member.fullName} />
            <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
          </Avatar>
      </TableCell>
      <TableCell className="font-medium">
        {member.fullName}
      </TableCell>
      <TableCell>
        <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}
          className={member.status === 'Active' ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400'}
        >
          {member.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {member.membershipType}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {new Date(member.membershipStartDate).toLocaleDateString()}
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


export default function MembersPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredMembers = members.filter(member => 
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
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
              Add Member
            </span>
          </Button>
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Members</CardTitle>
          <CardDescription>
            Manage your club members and view their details.
          </CardDescription>
           <div className="relative mt-2">
              <Input
                type="search"
                placeholder="Search members by name or email..."
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
                <TableHead className="hidden sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Type
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Start Date
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map(member => <MemberRow key={member.id} member={member} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Tabs>
  );
}
