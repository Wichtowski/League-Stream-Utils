import { useState } from 'react';

interface RegisterFormProps {
    onSuccess: (message: string) => void;
    onError: (error: string) => void;
    onSwitchToLogin: () => void;
}

export function RegisterForm({ onSuccess, onError, onSwitchToLogin }: RegisterFormProps) {
    const [loading, setLoading] = useState(false);
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        onError('');

        if (registerData.password !== registerData.confirmPassword) {
            onError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: registerData.username,
                    email: registerData.email,
                    password: registerData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess('Account created successfully! You can now login.');
                onSwitchToLogin();
                setRegisterData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
            } else {
                onError(data.error);
            }
        } catch (error) {
            console.warn(error);
            onError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    minLength={6}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                        setRegisterData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value
                        }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                {loading ? 'Creating Account...' : 'Create Account'}
            </button>
        </form>
    );
}
