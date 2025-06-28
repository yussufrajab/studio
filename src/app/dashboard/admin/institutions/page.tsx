
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useState } from 'react';
import { INSTITUTIONS } from '@/lib/constants';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface Institution {
  id: string;
  name: string;
}

const institutionSchema = z.object({
  name: z.string().min(3, { message: "Institution name must be at least 3 characters long." }),
});

type InstitutionFormValues = z.infer<typeof institutionSchema>;

export default function InstitutionManagementPage() {
  const [institutions, setInstitutions] = useState<Institution[]>(INSTITUTIONS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);

  const form = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: InstitutionFormValues) => {
    if (editingInstitution) {
      // Edit existing institution
      setInstitutions(institutions.map(inst => 
        inst.id === editingInstitution.id ? { ...inst, name: data.name } : inst
      ));
      toast({ title: "Institution Updated", description: "The institution has been updated successfully." });
    } else {
      // Add new institution
      const newInstitution: Institution = {
        id: `inst_${Date.now()}`,
        name: data.name,
      };
      setInstitutions([...institutions, newInstitution]);
      toast({ title: "Institution Created", description: "The new institution has been added." });
    }
    closeDialog();
  };
  
  const openEditDialog = (institution: Institution) => {
    setEditingInstitution(institution);
    form.reset({ name: institution.name });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingInstitution(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingInstitution(null);
  };
  
  const handleDelete = (id: string) => {
      // In a real app, you'd check if any user is assigned to this institution before deleting.
      setInstitutions(institutions.filter(inst => inst.id !== id));
      toast({ title: "Institution Deleted", description: "The institution has been deleted.", variant: "destructive" });
  };

  return (
    <div>
      <PageHeader
        title="Institution Management"
        description="Create, update, and manage institutions in the system."
        actions={
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Institution
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Institutions List</CardTitle>
          <CardDescription>A list of all institutions configured in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions.map(inst => (
                <TableRow key={inst.id}>
                  <TableCell className="font-medium">{inst.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(inst)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                     <Button variant="destructive" size="icon" onClick={() => handleDelete(inst.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInstitution ? "Edit Institution" : "Add New Institution"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Wizara ya Afya" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
