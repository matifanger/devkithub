import { AlertCircle, RefreshCw, Wifi } from 'lucide-react';
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { useAuth } from '../contexts/auth-context';

export function ValidateLicensePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated, needsValidation, validateStoredLicense } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Redirect to main app if no validation is needed
  if (!needsValidation) {
    return <Navigate to="/" />;
  }

  const handleRetry = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { success, message } = await validateStoredLicense();
      if (success) {
        navigate('/');
      } else {
        setError(message || 'Failed to validate license');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Wifi className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">License Validation Required</CardTitle>
          <CardDescription>We need to verify your license to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Required</AlertTitle>
            <AlertDescription>
              To ensure continued access to all features, we need to validate your license online at
              least once every 30 days.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <br />
                <br />
                If you are not able to validate your license, please contact support now.
                <br />
                <br />
                Email:{' '}
                <a className="font-bold underline" href="mailto:hi@devkithub.com">
                  hi@devkithub.com
                </a>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleRetry} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Retry Validation'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
