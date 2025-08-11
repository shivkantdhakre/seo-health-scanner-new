"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for error messages
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      await loginUser(email, password);
      router.push('/dashboard');
    } catch (err) {
      // This block will now catch the 401 error
      console.error('Login failed', err);
      setError('Login failed. Please check your email and password.');
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