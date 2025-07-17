'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal, PlusCircle, File } from 'lucide-react';
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
import {
  getAnnualSubscriptions,
  seedAnnualSubscriptions,
  addAnnualSubscription,
  updateAnnualSubscription,
  addPayment,
  updatePayment,
  deletePayment,
  getPaymentsForSubscription
} from '@/services/subscription-service';
import { AnnualSubscription, Payment } from '@/lib/types';
import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input';
import { getMembers, getMemberById, Member } from '@/services/member-service';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Define the SubscriptionRow component
function SubscriptionRow({ annualSub, onSubscriptionUpdated }: { annualSub: AnnualSubscription, onSubscriptionUpdated: () => void }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = React.useState(false);
  const [isViewMemberDialogOpen, setIsViewMemberDialogOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const { toast } = useToast();

  const fetchPayments = React.useCallback(async () => {
    if (annualSub.id) {
      const fetchedPayments = await getPaymentsForSubscription(annualSub.id);
      setPayments(fetchedPayments.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()));
    }
  }, [annualSub.id]);

  React.useEffect(() => {
    if (isHistoryOpen) {
      fetchPayments();
    }
  }, [isHistoryOpen, fetchPayments]);

  const getStatusBadge = (status: AnnualSubscription['status'], remainingBalance: number): JSX.Element => {
    let className = '';
    let displayText: string = status; // Explicitly type as string
    switch (status) {
      case 'Paid':
        className = 'bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/10 dark:text-green-400';
        break;
      case 'Unpaid':
        className = 'bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400';
        displayText = `Unpaid – ₹${remainingBalance.toFixed(2)} remaining`;
        break;
      case 'Partial':
        className = 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400';
        displayText = `Partial – ₹${remainingBalance.toFixed(2)} remaining`;
        break;
      default:
        className = 'bg-gray-500/20 text-gray-700 hover:bg-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400';
        break;
    }
    return <Badge variant={'outline'} className={className}>{displayText}</Badge>;
  };

  const handlePaymentAction = async () => {
    onSubscriptionUpdated(); // Refresh the parent list
    fetchPayments(); // Refresh payments for this subscription
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          {annualSub.memberName}
        </TableCell>
        <TableCell>
          {getStatusBadge(annualSub.status, annualSub.remainingBalance)}
        </TableCell>
        <TableCell>
          ₹{annualSub.annualAmount.toFixed(2)}
        </TableCell>
        <TableCell>
          ₹{annualSub.remainingBalance.toFixed(2)}
        </TableCell>
        <TableCell>
          {new Date(annualSub.createdAt).toLocaleDateString()}
        </TableCell>
        <TableCell>
          {annualSub.subscriptionYear}
        </TableCell>
        <TableCell>
          {new Date(annualSub.updatedAt).toLocaleDateString()}
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
              <DropdownMenuItem onClick={() => setIsAddPaymentDialogOpen(true)}>Add Payment</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit Subscription</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsViewMemberDialogOpen(true)}>View Member</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <EditAnnualSubscriptionDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            annualSubscription={annualSub}
            onAnnualSubscriptionUpdated={handlePaymentAction}
          />
          <AddPaymentDialog
            open={isAddPaymentDialogOpen}
            onOpenChange={setIsAddPaymentDialogOpen}
            annualSubscriptionId={annualSub.id}
            onPaymentAdded={handlePaymentAction}
          />
          <ViewMemberDialog
            open={isViewMemberDialogOpen}
            onOpenChange={setIsViewMemberDialogOpen}
            memberId={annualSub.memberId}
          />
        </TableCell>
        <TableCell>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
              {isHistoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="sr-only">Toggle Payment History</span>
            </Button>
          </CollapsibleTrigger>
        </TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <TableRow>
          <TableCell colSpan={8} className="p-0">
            <div className="bg-muted/50 p-4">
              <h4 className="text-sm font-semibold mb-2">Payment History</h4>
              {payments.length > 0 ? (
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <PaymentHistoryRow key={payment.id} payment={payment} onPaymentUpdated={handlePaymentAction} />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </>
  );
}

// New component for individual payment history rows
function PaymentHistoryRow({ payment, onPaymentUpdated }: { payment: Payment, onPaymentUpdated: () => void }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this payment?')) {
      try {
        const result = await deletePayment(payment.id);
        if (result.success) {
          toast({ title: 'Success', description: result.message });
          onPaymentUpdated();
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete payment' });
      }
    }
  };

  return (
    <TableRow>
      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
      <TableCell>₹{payment.amountPaid.toFixed(2)}</TableCell>
      <TableCell>{payment.method}</TableCell>
      <TableCell>{payment.notes || '-'}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Payment Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <EditPaymentDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          payment={payment}
          onPaymentUpdated={() => {
            onPaymentUpdated();
            setIsEditDialogOpen(false);
          }}
        />
      </TableCell>
    </TableRow>
  );
}

// Define the AddPaymentDialog component (for adding payments to an existing annual subscription)
const addPaymentFormSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  amountPaid: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Amount must be greater than 0")
  ),
  paymentDate: z.string(),
  method: z.enum(['Cash', 'Online', 'Bank Transfer', 'Overpayment Transfer', 'Debt Transfer']), // Updated to include new methods
  notes: z.string().optional(),
});
type AddPaymentFormValues = z.infer<typeof addPaymentFormSchema>;

function AddPaymentDialog({ open, onOpenChange, annualSubscriptionId, onPaymentAdded }: { open: boolean; onOpenChange: (open: boolean) => void; annualSubscriptionId: string; onPaymentAdded: () => void }) {
  const { toast } = useToast();

  const form = useForm<AddPaymentFormValues>({
    resolver: zodResolver(addPaymentFormSchema),
    defaultValues: {
      subscriptionId: annualSubscriptionId,
      amountPaid: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      method: "Online",
      notes: "",
    },
  });

  React.useEffect(() => {
    form.reset({
      subscriptionId: annualSubscriptionId,
      amountPaid: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      method: "Online",
      notes: "",
    });
  }, [annualSubscriptionId, form]);

  const onSubmit = async (data: AddPaymentFormValues) => {
    try {
      const result = await addPayment(data);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Payment added successfully",
        });
        onPaymentAdded();
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amountPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
              name="method"
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
                onClick={() => onOpenChange(false)}
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

// Define the EditPaymentDialog component (for editing individual payments)
const editPaymentFormSchema = z.object({
  amountPaid: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Amount must be greater than 0")
  ),
  paymentDate: z.string(),
  method: z.enum(['Cash', 'Online', 'Bank Transfer', 'Overpayment Transfer', 'Debt Transfer']), // Updated to include new methods
  notes: z.string().optional(),
});
type EditPaymentFormValues = z.infer<typeof editPaymentFormSchema>;

function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  onPaymentUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
  onPaymentUpdated: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<EditPaymentFormValues>({
    resolver: zodResolver(editPaymentFormSchema),
    defaultValues: {
      ...payment,
      paymentDate: payment.paymentDate.split('T')[0],
    },
  });

  React.useEffect(() => {
    form.reset({
      ...payment,
      paymentDate: payment.paymentDate.split('T')[0],
    });
  }, [payment, form]);

  const onSubmit = async (data: EditPaymentFormValues) => {
    try {
      const result = await updatePayment(payment.id, data);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Payment updated successfully",
        });
        onPaymentUpdated();
      } else {
        throw new Error(result.message || "Failed to update payment");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amountPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
              name="method"
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Define the AddAnnualSubscriptionDialog component
const addAnnualSubscriptionFormSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  annualAmount: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Annual amount must be greater than 0")
  ),
  subscriptionYear: z.preprocess(
    (val) => Number(val),
    z.number().int().min(1900, "Year must be a valid year").max(2100, "Year must be a valid year")
  ),
});
type AddAnnualSubscriptionFormValues = z.infer<typeof addAnnualSubscriptionFormSchema>;

function AddAnnualSubscriptionDialog({ onAnnualSubscriptionAdded }: { onAnnualSubscriptionAdded: () => void }) {
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

  const form = useForm<AddAnnualSubscriptionFormValues>({
    resolver: zodResolver(addAnnualSubscriptionFormSchema),
    defaultValues: {
      memberId: "",
      annualAmount: 0,
      subscriptionYear: new Date().getFullYear(), // Default to current year
    },
  });

  const onSubmit = async (data: AddAnnualSubscriptionFormValues) => {
    try {
      const selectedMember = members.find(m => m.id === data.memberId);
      if (!selectedMember) {
        throw new Error("Selected member not found.");
      }

      const now = new Date().toISOString();
      const result = await addAnnualSubscription({
        memberId: data.memberId,
        memberName: selectedMember.fullName,
        annualAmount: data.annualAmount,
        createdAt: now,
        updatedAt: now,
        subscriptionYear: data.subscriptionYear,
        carriedForwardDebt: 0, // Initialize carriedForwardDebt for new subscriptions
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Annual Subscription added successfully",
        });
        onAnnualSubscriptionAdded();
        setOpen(false);
        form.reset();
      } else {
        throw new Error(result.message || "Failed to add annual subscription");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add annual subscription",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Annual Subscription
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Annual Subscription</DialogTitle>
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
              name="annualAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subscriptionYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Year</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
              <Button type="submit">Add Annual Subscription</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Define the EditAnnualSubscriptionDialog component
const editAnnualSubscriptionFormSchema = z.object({
  annualAmount: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Annual amount must be greater than 0")
  ),
});
type EditAnnualSubscriptionFormValues = z.infer<typeof editAnnualSubscriptionFormSchema>;

function EditAnnualSubscriptionDialog({
  open,
  onOpenChange,
  annualSubscription,
  onAnnualSubscriptionUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annualSubscription: AnnualSubscription;
  onAnnualSubscriptionUpdated: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<EditAnnualSubscriptionFormValues>({
    resolver: zodResolver(editAnnualSubscriptionFormSchema),
    defaultValues: {
      annualAmount: annualSubscription.annualAmount,
    },
  });

  React.useEffect(() => {
    form.reset({
      annualAmount: annualSubscription.annualAmount,
    });
  }, [annualSubscription, form]);

  const onSubmit = async (data: EditAnnualSubscriptionFormValues) => {
    try {
      const result = await updateAnnualSubscription(annualSubscription.id, data);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Annual Subscription updated successfully",
        });
        onAnnualSubscriptionUpdated();
      } else {
        throw new Error(result.message || "Failed to update annual subscription");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update annual subscription",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Annual Subscription</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="annualAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ViewMemberDialog({
  open,
  onOpenChange,
  memberId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
}) {
  const [member, setMember] = React.useState<Member | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open && memberId) {
      const fetchMember = async () => {
        try {
          const fetchedMember = await getMemberById(memberId);
          if (fetchedMember) {
            setMember(fetchedMember);
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Member not found.",
            });
            onOpenChange(false);
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to fetch member details",
          });
          onOpenChange(false);
        }
      };
      fetchMember();
    } else if (!open) {
      setMember(null); // Clear member data when dialog is closed
    }
  }, [open, memberId, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>
        {member ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Full Name:</span>
              <span className="col-span-3">{member.fullName}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Email:</span>
              <span className="col-span-3">{member.email}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Status:</span>
              <span className="col-span-3">{member.status}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Membership Type:</span>
              <span className="col-span-3">{member.membershipType}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Start Date:</span>
              <span className="col-span-3">{new Date(member.membershipStartDate).toLocaleDateString()}</span>
            </div>
            {member.profilePhotoUrl && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Profile Photo:</span>
                <img src={member.profilePhotoUrl} alt={member.fullName} className="col-span-3 h-20 w-20 rounded-full object-cover" />
              </div>
            )}
          </div>
        ) : (
          <p>Loading member details...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Consolidate the main SubscriptionsPage component
export default function SubscriptionsPage() {
  const [annualSubscriptions, setAnnualSubscriptions] = React.useState<AnnualSubscription[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');
  const { toast } = useToast();

  const fetchAnnualSubscriptions = React.useCallback(async () => {
    const dbAnnualSubscriptions = await getAnnualSubscriptions();
    setAnnualSubscriptions(dbAnnualSubscriptions);
  }, []);

  React.useEffect(() => {
    fetchAnnualSubscriptions();
  }, [fetchAnnualSubscriptions]);

  const handleSeed = async () => {
    const result = await seedAnnualSubscriptions();
    if(result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      fetchAnnualSubscriptions(); // Refresh the list after seeding
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  }

  const filteredAnnualSubscriptions = annualSubscriptions.filter(annualSub => {
    const matchesSearch = annualSub.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && annualSub.status.toLowerCase() === activeTab;
  });

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredAnnualSubscriptions); // Export annual subscriptions
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AnnualSubscriptions");
    XLSX.writeFile(workbook, "annual_subscriptions.xlsx");
  }

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
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <AddAnnualSubscriptionDialog onAnnualSubscriptionAdded={fetchAnnualSubscriptions} />
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="font-headline">Annual Subscriptions</CardTitle>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Annual Amount</TableHead>
                  <TableHead>Remaining Balance</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                  <TableHead>History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnualSubscriptions.map(annualSub => (
                  <Collapsible key={annualSub.id} asChild>
                    <SubscriptionRow annualSub={annualSub} onSubscriptionUpdated={fetchAnnualSubscriptions} />
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Tabs>
  );
}
