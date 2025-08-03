import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@lib/contexts/AuthContext';
import { Button } from '@/lib/components/common/buttons/Button';
import { AuthCredentials } from '@lib/types/auth';

export function LoginForm() {
    const [credentials, setCredentials] = useState<AuthCredentials>({
        username: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const result = await login(credentials.username, credentials.password);
            
            if (result.success) {
                // Check if there's a return URL
                const returnTo = sessionStorage.getItem('returnTo');
                if (returnTo) {
                    sessionStorage.removeItem('returnTo');
                    router.push(returnTo);
                } else {
                    router.push('/');
                }
            } else {
                setErrorMessage(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrorMessage('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof AuthCredentials) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setCredentials(prev => ({
            ...prev,
            [field]: e.target.value
        }));
        if (errorMessage) {
            setErrorMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                </label>
                <input
                    id="username"
                    type="text"
                    required
                    value={credentials.username}
                    onChange={handleInputChange('username')}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your username"
                    disabled={isSubmitting}
                    autoComplete="username"
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    value={credentials.password}
                    onChange={handleInputChange('password')}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                />
            </div>

            {errorMessage && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                disabled={isSubmitting || !credentials.username || !credentials.password}
                className="w-full"
            >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
        </form>
    );
} 