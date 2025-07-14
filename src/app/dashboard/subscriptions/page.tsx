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
import { useToast } from '@/hooks/use-toast';
import { getSubscriptions, seedSubscriptions, addSubscription, Subscription } from '@/services/subscription-service';
import { Input } from '@/components/ui/input';
import { getMembers, Member } from '@/services/member-service'; // Added Member type
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

// Define the SubscriptionRow component
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

// Define the AddPaymentDialog component
const paymentFormSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  paymentDate: z.string(),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Amount must be greater than 0")
  ),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Online']),
  status: z.enum(['Paid', 'Unpaid', 'Partial']),
  notes: z.string().optional(),
});
type PaymentFormValues = z.infer<typeof paymentFormSchema>;

function AddPaymentDialog({ onPaymentAdded }: { onPaymentAdded: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [members, setMembers] = React.useState<Member[]>([]);

  React.useEffect(() => {
    const fetchMembers = async () => {
      const dbMembers = await getMembers();
      setMembers(dbMembers);
    };
    fetchMembers();
  }, []);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      memberId: "",
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: "Online",
      status: "Paid",
      notes: "",
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      const selectedMember = members.find(m => m.id === data.memberId);
      if (!selectedMember) {
        throw new Error("Selected member not found.");
      }

      const result = await addSubscription({
        ...data,
        memberName: selectedMember.fullName,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Payment added successfully",
        });
        onPaymentAdded();
        setOpen(false);
        form.reset();
      } else {
        throw new Error(result.message || "Failed to add payment");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add payment",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Payment
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Select a member</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Online">Online</option>
                    </select>
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
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any additional notes" {...field} />
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
              <Button type="submit">Add Payment</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Consolidate the main SubscriptionsPage component
export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');
  const { toast } = useToast();

  const fetchSubscriptions = React.useCallback(async () => {
    const dbSubscriptions = await getSubscriptions();
    setSubscriptions(dbSubscriptions);
  }, []);

  React.useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSeed = async () => {
    const result = await seedSubscriptions();
    if(result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      fetchSubscriptions(); // Refresh the list after seeding
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  }

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
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleSeed}>
            Seed Data
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <AddPaymentDialog onPaymentAdded={fetchSubscriptions} />
        </div>
      </div>

      <Card className="mt-4">
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