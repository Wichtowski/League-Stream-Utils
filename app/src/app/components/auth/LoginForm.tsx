import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@lib/contexts/AuthContext';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(''); // Clear any existing errors

    try {
      const success = await login(loginData.username, loginData.password);
      
      if (success) {
        onSuccess();
        router.push('/modules');
      } else {
        onError('Invalid username or password');
      }
    } catch (error) {
      console.warn(error);
      onError('Login failed. Please try again.');
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
          value={loginData.username}
          onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          value={loginData.password}
          onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
} 