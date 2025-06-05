import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { APP_NAME } from '@/lib/constants';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline">{APP_NAME}</CardTitle>
          <CardDescription>Sign in to manage employee lifecycle processes.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Civil Service Commission. All rights reserved.
      </footer>
    </div>
  );
}
