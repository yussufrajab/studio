'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { USERS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/lib/types';

const loginFormSchema = z.object({
  username: z.string().min(1, { message: 'Please select a user to login.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login, setUserManually } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    // In a real app, you'd call an API. Here we use the mock login.
    // For demo, we are using setUserManually to directly set the user based on selection.
    const selectedUser = USERS.find(u => u.username === data.username);

    if (selectedUser) {
      setUserManually(selectedUser as User); // Cast because USERS might not perfectly match User type without optional fields
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${selectedUser.name}!`,
      });
      router.push('/dashboard');
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid user selected.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select User (Demo Login)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user role to simulate login" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {USERS.map((user) => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
