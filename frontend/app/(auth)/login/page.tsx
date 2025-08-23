"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/auth';
import { validateEmail } from '@/lib/validation';
import { validatePassword } from '@/lib/validation';
import type { ApiError } from '@/lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for error messages
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Password must be at least 8 characters long');
      return;
    }

    try {
      await loginUser(email, password);
      router.push('/dashboard');
    } catch (err) {
      // Handle different types of errors
      console.error('Login failed', err);

      if (err && typeof err === 'object' && 'message' in err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Login failed. Please check your email and password.');
      } else {
        setError('Login failed. Please check your email and password.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFDE59]">
      <form onSubmit={handleLogin} className="neo-card bg-white p-8 w-96">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="neo-input w-full mb-4"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="neo-input w-full mb-4"
        />

        {/* This will display the login error message */}
        {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

        <button type="submit" className="neo-button bg-[#FF5757] w-full">Login</button>
      </form>
    </div>
  );
}