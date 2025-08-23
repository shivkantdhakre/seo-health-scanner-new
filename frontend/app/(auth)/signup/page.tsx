"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupUser } from '@/lib/auth';
import { validateEmail, validatePassword } from '@/lib/validation';
import type { ApiError } from '@/lib/types';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State to hold our error message
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Password must be at least 8 characters long');
      return;
    }

    try {
      // Call the signup API function from our lib/auth.ts utility
      await signupUser(email, password);

      // If signup is successful, redirect the user to login
      router.push('/login');

    } catch (err) {
      // This block runs if the API call fails
      console.error('Signup failed', err);

      if (err && typeof err === 'object' && 'message' in err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Signup failed. This email may already be registered.');
      } else {
        setError('Signup failed. This email may already be registered.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFDE59]">
      <form onSubmit={handleSignup} className="neo-card bg-white p-8 w-96">
        <h1 className="text-2xl font-bold mb-4">Create an Account</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="neo-input w-full mb-4"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="neo-input w-full mb-4"
          required
        />

        {/* This line will conditionally display the error message */}
        {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

        <button type="submit" className="neo-button bg-[#FF5757] w-full">Sign Up</button>
      </form>
    </div>
  );
}