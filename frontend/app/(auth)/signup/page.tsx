"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signupUser } from '@/lib/auth';
import { useAuth } from '@/lib/AuthContext';
import { validateEmail, validatePassword } from '@/lib/validation';
import type { ApiError } from '@/lib/types';
import { LoadingSpinner } from '@/components/loading-spinner'; 

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { checkAuth } = useAuth(); // Connect to global state

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // 1. Validate Email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email');
      setIsSubmitting(false);
      return;
    }

    // 2. Validate Password Strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Password must be at least 8 characters long');
      setIsSubmitting(false);
      return;
    }

    // 3. Confirm Passwords Match
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create the account
      await signupUser(email, password);
      
      // Immediately update global auth state so the Navbar changes
      await checkAuth(); 
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Signup failed', err);
      const apiError = err as ApiError;
      
      // Handle "Email already in use" or other backend errors
      setError(apiError.message || 'Signup failed. This email might already be in use.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#FFDE59] p-4">
      <form onSubmit={handleSignup} className="neo-card bg-white p-8 w-full max-w-md">
        <h1 className="text-3xl font-black mb-6 text-center">Create Account</h1>
        
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="neo-input w-full mb-4"
          disabled={isSubmitting}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="neo-input w-full mb-4"
          disabled={isSubmitting}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="neo-input w-full mb-6"
          disabled={isSubmitting}
          required
        />

        {/* Error Message Display */}
        {error && (
          <p className="text-red-500 text-sm font-bold mb-4 p-3 bg-red-50 border-2 border-red-500 rounded">
            {error}
          </p>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="neo-button bg-[#FF5757] w-full flex justify-center items-center h-12"
        >
          {isSubmitting ? <LoadingSpinner /> : 'Sign Up'}
        </button>

        <p className="mt-6 text-center text-sm font-medium text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-bold">
            Log in here
          </Link>
        </p>
      </form>
    </div>
  );
}