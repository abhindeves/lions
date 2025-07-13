'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { addMember } from '@/services/member-service';


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
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { Member } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { getMembers, seedMembers } from '@/services/member-service';
import { useToast } from '@/hooks/use-toast';


// Define the schema for the members (Adding Members)
const memberFormSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  status: z.enum(["Active", "Inactive"]),
  membershipType: z.string().min(1),
  membershipStartDate: z.string(),
  profilePhotoUrl: z.string().optional(),
});
type MemberFormValues = z.infer<typeof memberFormSchema>;

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
  const [members, setMembers] = React.useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');
  const { toast } = useToast();

  const fetchMembers = React.useCallback(async () => {
      const dbMembers = await getMembers();
      setMembers(dbMembers);
  }, []);
  
  React.useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSeed = async () => {
    const result = await seedMembers();
    if(result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      fetchMembers(); // Refresh the list after seeding
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && member.status === 'Active';
    if (activeTab === 'inactive') return matchesSearch && member.status === 'Inactive';
    
    return matchesSearch;
  });

  return (
    <Tabs defaultValue="all" onValueChange={setActiveTab}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
           <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleSeed}>
            Seed Data
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <AddMemberDialog onMemberAdded={fetchMembers} />
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
              {filteredMembers.length > 0 ? (
                  filteredMembers.map(member => <MemberRow key={member.id} member={member} />)
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">
                        No members found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Tabs>
  );
}



function AddMemberDialog({ onMemberAdded }: { onMemberAdded: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      status: "Active",
      membershipType: "Regular",
      membershipStartDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: MemberFormValues) => {
    try {
      // Call the addMember API function
      const result = await addMember({
        fullName: data.fullName,
        email: data.email,
        status: data.status,
        membershipType: data.membershipType,
        membershipStartDate: data.membershipStartDate,
        profilePhotoUrl: data.profilePhotoUrl || undefined,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Member added successfully",
        });
        onMemberAdded(); // Refresh the member list
        setOpen(false); // Close the dialog
        form.reset(); // Reset the form
      } else {
        throw new Error(result.message || "Failed to add member");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add member",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Member
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="membershipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Regular" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="membershipStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profilePhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/photo.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Member</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}