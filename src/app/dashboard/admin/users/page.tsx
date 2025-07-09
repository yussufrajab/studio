
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useState, useEffect } from 'react';
import { USERS, ROLES } from '@/lib/constants';
import { Pencil, PlusCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { User, Role } from '@/lib/types';
import type { Institution } from '../institutions/page';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/pagination';

const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  role: z.nativeEnum(ROLES),
  institutionId: z.string().min(1, "Institution is required."),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UserManagementPage() {
  const [users, setUsers] = useState(USERS.map(u => ({...u, active: true})));
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User & { active: boolean } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
    fetchInstitutions();
  }, []);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });
  
  const watchRole = form.watch("role");

  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      // Edit existing user
      setUsers(users.map(u => 
        u.id === editingUser.id ? { 
            ...u, 
            name: data.name, 
            username: data.username, 
            role: data.role,
            institutionId: data.institutionId,
            institution: institutions.find(i => i.id === data.institutionId)?.name,
        } : u
      ));
      toast({ title: "User Updated", description: "The user has been updated successfully." });
    } else {
      // Add new user
      if (!data.password) {
        form.setError("password", { type: "manual", message: "Password is required for new users." });
        return;
      }
      const newUser: User & { active: boolean } = {
        id: `user_${Date.now()}`,
        name: data.name,
        username: data.username,
        role: data.role,
        institutionId: data.institutionId,
        institution: institutions.find(i => i.id === data.institutionId)?.name,
        active: true,
      };
      setUsers([...users, newUser]);
      toast({ title: "User Created", description: "The new user has been added." });
    }
    closeDialog();
  };
  
  const openEditDialog = (user: User & { active: boolean }) => {
    setEditingUser(user);
    form.reset({ 
      name: user.name, 
      username: user.username,
      role: user.role || undefined,
      institutionId: user.institutionId || undefined,
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
  
  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, active: !u.active } : u));
    toast({ title: "User Status Changed", description: "The user's status has been updated." });
  };

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice(
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
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {paginatedUsers.map(user => (
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
                        onCheckedChange={() => toggleUserStatus(user.id)}
                        aria-label="Toggle user status"
                      />
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(user)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Juma Ali" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="username" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="e.g., jali" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              {!editingUser && (
                <FormField name="password" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Enter temporary password" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              )}
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
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit">Save User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
