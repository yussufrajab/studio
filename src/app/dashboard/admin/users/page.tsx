
'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ROLES } from '@/lib/constants';
import { Pencil, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { User, Role } from '@/lib/types';
import type { Institution } from '../institutions/page';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  role: z.string().min(1, "Role is required"),
  institutionId: z.string().min(1, "Institution is required."),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
});

type UserFormValues = z.infer<typeof userSchema>;
type UserWithInstitutionName = User & { institution: string };

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserWithInstitutionName[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithInstitutionName | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({ title: "Error", description: "Could not load users.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/institutions');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setInstitutions(data);
    } catch (error) {
      toast({title: "Error", description: "Could not load institutions for dropdown.", variant: "destructive"});
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchInstitutions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    const payload = { ...data };
    if (editingUser && !payload.password) {
      delete payload.password; // Don't send empty password for updates
    }
    
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'An error occurred');
        }

        toast({
            title: `User ${editingUser ? 'Updated' : 'Created'}`,
            description: `The user has been ${editingUser ? 'updated' : 'added'} successfully.`,
        });
        await fetchUsers();
        closeDialog();
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const openEditDialog = (user: UserWithInstitutionName) => {
    setEditingUser(user);
    form.reset({ 
      name: user.name, 
      username: user.username,
      role: user.role as string,
      institutionId: user.institutionId,
      password: '', // Password field is for changing, not displaying
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    form.reset({ name: "", username: "", role: undefined, institutionId: undefined, password: "" });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };
  
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !currentStatus }),
        });
        if (!response.ok) throw new Error('Failed to update status');
        toast({ title: "User Status Changed", description: "The user's status has been updated." });
        await fetchUsers();
    } catch(error) {
        toast({ title: "Error", description: "Could not update user status.", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to delete user');
        }
        toast({ title: "User Deleted", description: "The user has been successfully deleted.", variant: "default" });
        await fetchUsers();
    } catch (error: any) {
        toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.zanId && user.zanId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create, update, and manage user accounts and access levels."
        actions={
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
          </Button>
        }
      />
      <div className="flex justify-end mb-4">
        <Input
          placeholder="Search users by name, username, or ZanID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.filter((user) =>
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.zanId && user.zanId.toLowerCase().includes(searchQuery.toLowerCase()))
              ).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.institution || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'default' : 'secondary'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Switch
                        checked={user.active}
                        onCheckedChange={() => toggleUserStatus(user.id, user.active)}
                        aria-label="Toggle user status"
                      />
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(user)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account for {user.name}.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={users.length}
            itemsPerPage={itemsPerPage}
          />
          </>
        )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
             {editingUser && <DialogDescription>Leave password blank to keep it unchanged.</DialogDescription>}
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Juma Ali" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="username" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="e.g., jali" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="password" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder={editingUser ? "New password (optional)" : "Enter temporary password"} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="role" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.values(ROLES).map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField name="institutionId" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger>
                      <SelectValue placeholder={institutions.length > 0 ? "Select an institution" : "Loading institutions..."} />
                    </SelectTrigger></FormControl>
                    <SelectContent>
                      {institutions.length > 0 ? institutions.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                      )) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
