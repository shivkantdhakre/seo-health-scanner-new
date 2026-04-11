"use client";
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();

  return (
    <nav className="bg-white border-b-4 border-black p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tighter">
          SEO Scanner
        </Link>

        <div className="flex gap-4 items-center">
          {isLoading ? (
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded neo-card"></div>
          ) : user ? (
            <>
              <Link href="/dashboard" className="font-bold hover:underline">Dashboard</Link>
              <div className="font-medium text-gray-600">|</div>
              <span className="font-bold">{user.email}</span>
              <button onClick={logout} className="neo-button bg-gray-200 text-sm py-1 px-3">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-bold hover:underline">Login</Link>
              <Link href="/signup" className="neo-button bg-[#FFDE59] text-sm py-1 px-3">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}