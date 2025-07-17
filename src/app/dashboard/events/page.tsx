'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  PlusCircle,
  File as FileIcon, // Renamed to avoid conflict with global File type
  Calendar,
  MapPin,
} from 'lucide-react';
import {
  Badge,
} from '@/components/ui/badge';
import { uploadFile } from '@/lib/firebase'; // Import uploadFile
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
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { getEvents, seedEvents, deleteEvent, updateEvent, addEvent, Event } from '@/services/event-service';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

const eventFormSchema = z.object({
  name: z.string().min(2),
  date: z.string(),
  time: z.string(),
  venue: z.string().min(2),
  description: z.string().optional(),
  eventType: z.enum(['Community', 'Fundraiser', 'Meeting', 'Social']),
  status: z.enum(['Upcoming', 'Completed', 'Canceled']),
  attachments: z.array(z.string()).optional(),
  eventImageFile: z.any().optional(), // Added for file upload handling
});
type EventFormValues = z.infer<typeof eventFormSchema>;

function EventRow({ event, onEventDeleted, onEventUpdated }: { event: Event, onEventDeleted: () => void, onEventUpdated: () => void }) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

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

  const handleDelete = async () => {
    try {
      const result = await deleteEvent(event.id);
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        onEventDeleted();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete event',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Card className="w-full">
      {event.imageUrl && (
        <div className="relative w-full h-[300px] bg-gray-200 rounded-t-lg overflow-hidden">
          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle>{event.name}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-sm">
          <Calendar className="h-4 w-4" />
          {new Date(event.date).toLocaleDateString()} at {event.time}
        </CardDescription>
        <CardDescription className="flex items-center gap-1 text-sm">
          <MapPin className="h-4 w-4" />
          {event.venue}
        </CardDescription>
        {event.description && (
          <CardDescription className="text-sm mt-2">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <Badge variant={'outline'} className={getStatusBadge(event.status)}>
          {event.status}
        </Badge>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditDialogOpen(true)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Delete</Button>
        </div>
      </CardContent>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditEventDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        event={event}
        onEventUpdated={() => {
          onEventUpdated();
          setIsEditDialogOpen(false);
        }}
      />
    </Card>
  );
}

export default function EventsPage() {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');
  const { toast } = useToast();

  const fetchEvents = React.useCallback(async () => {
    const dbEvents = await getEvents();
    setEvents(dbEvents);
  }, []);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSeed = async () => {
    const result = await seedEvents();
    if(result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      fetchEvents(); // Refresh the list after seeding
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  }

  const filteredEvents = events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.venue.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'all') return matchesSearch;
      return matchesSearch && event.status.toLowerCase() === activeTab;
  });

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredEvents);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Events");
    XLSX.writeFile(workbook, "events.xlsx");
  }

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
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleSeed}>
            Seed Data
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
            <FileIcon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <AddEventDialog onEventAdded={fetchEvents} />
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
          <ScrollArea className="h-[calc(100vh-250px)] w-full rounded-md border p-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <EventRow key={event.id} event={event} onEventDeleted={fetchEvents} onEventUpdated={fetchEvents} />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground">No events found.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function AddEventDialog({ onEventAdded }: { onEventAdded: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().split('T')[0],
      time: "12:00",
      venue: "",
      description: "",
      eventType: "Community",
      status: "Upcoming",
      attachments: [],
    },
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      let imageUrl: string | undefined = undefined;
      if (data.eventImageFile) {
        const filePath = `event_images/${Date.now()}_${data.eventImageFile.name}`;
        imageUrl = await uploadFile(data.eventImageFile, filePath);
      }

      const result = await addEvent({
        ...data,
        imageUrl: imageUrl, // Use the uploaded URL
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Event added successfully",
        });
        onEventAdded();
        setOpen(false);
        form.reset();
      } else {
        throw new Error(result.message || "Failed to add event");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add event",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Event
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Annual Gala" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="Grand Hotel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="A brief description of the event" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="Community">Community</option>
                      <option value="Fundraiser">Fundraiser</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Social">Social</option>
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
                      <option value="Upcoming">Upcoming</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eventImageFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Event Image (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files && event.target.files[0];
                        if (file && file.size > 1024 * 1024) { // 1MB in bytes
                          toast({
                            variant: "destructive",
                            title: "File too large",
                            description: "Please upload an image less than 1MB.",
                          });
                          event.target.value = ''; // Clear the input
                          onChange(null); // Clear the form field value
                        } else {
                          onChange(file);
                        }
                      }}
                    />
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
              <Button type="submit">Add Event</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditEventDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...event,
      date: event.date.split('T')[0],
    },
  });

  React.useEffect(() => {
    form.reset({
      ...event,
      date: event.date.split('T')[0],
    });
  }, [event, form]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      let imageUrl: string | undefined = event.imageUrl; // Keep existing URL if no new file
      if (data.eventImageFile) {
        const filePath = `event_images/${Date.now()}_${data.eventImageFile.name}`;
        imageUrl = await uploadFile(data.eventImageFile, filePath);
      }

      const result = await updateEvent(event.id, {
        ...data,
        imageUrl: imageUrl, // Use the uploaded URL or existing one
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Event updated successfully",
        });
        onEventUpdated();
      } else {
        throw new Error(result.message || "Failed to update event");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Annual Gala" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="Grand Hotel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="A brief description of the event" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="Community">Community</option>
                      <option value="Fundraiser">Fundraiser</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Social">Social</option>
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
                      <option value="Upcoming">Upcoming</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eventImageFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Event Image (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files && event.target.files[0];
                        if (file && file.size > 1024 * 1024) { // 1MB in bytes
                          toast({
                            variant: "destructive",
                            title: "File too large",
                            description: "Please upload an image less than 1MB.",
                          });
                          event.target.value = ''; // Clear the input
                          onChange(null); // Clear the form field value
                        } else {
                          onChange(file);
                        }
                      }}
                    />
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
