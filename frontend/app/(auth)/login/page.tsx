"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/lib/auth';
import { useAuth } from '@/lib/AuthContext';
import { validateEmail, validatePassword } from '@/lib/validation';
import type { ApiError } from '@/lib/types';
// Assuming you have the loading spinner component
import { LoadingSpinner } from '@/components/loading-spinner'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state
  const router = useRouter();
  const { checkAuth } = useAuth(); // Import from context

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email');
      setIsSubmitting(false);
      return;
    }

    try {
      await loginUser(email, password);
      await checkAuth(); // Tell the global state we are logged in!
      router.push('/dashboard');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Login failed. Please check your credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#FFDE59] p-4">
      <form onSubmit={handleLogin} className="neo-card bg-white p-8 w-full max-w-md">
        <h1 className="text-3xl font-black mb-6 text-center">Welcome Back</h1>
        
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="neo-input w-full mb-4"
          disabled={isSubmitting}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="neo-input w-full mb-6"
          disabled={isSubmitting}
        />

        {error && <p className="text-red-500 text-sm font-bold mb-4 p-3 bg-red-50 border-2 border-red-500 rounded">{error}</p>}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="neo-button bg-[#FF5757] w-full flex justify-center items-center h-12"
        >
          {isSubmitting ? <LoadingSpinner /> : 'Login'}
        </button>

        <p className="mt-6 text-center text-sm font-medium text-gray-600">
          Don't have an account? <Link href="/signup" className="text-blue-600 hover:underline font-bold">Sign up here</Link>
        </p>
      </form>
    </div>
  );
}