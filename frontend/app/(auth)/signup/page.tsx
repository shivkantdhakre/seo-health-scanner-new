"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupUser } from '@/lib/auth';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State to hold our error message
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Simple password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError(''); // Clear previous errors

    try {
      // Call the signup API function from our lib/auth.ts utility
      await signupUser(email, password);
      
      // If signup is successful, redirect the user to their dashboard
      router.push('/dashboard');

    } catch (err) {
      // This block runs if the API call fails
      console.error('Signup failed', err);
      // Set a user-friendly error message
      setError('Signup failed. This email may already be registered.');
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