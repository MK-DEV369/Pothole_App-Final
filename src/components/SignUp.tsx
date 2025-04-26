import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';


const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp } = useAuthStore();   // <-- ✅ Get the signUp function from store

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password);    // <-- ✅ Use the store function
      window.location.href = '/sign-in';
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };


  return (
    <div className="container mx-auto p-8 text-white  h-screen">
      <h1>Sign Up</h1>
      <form onSubmit={handleSignUp} className="space-y-4 mt-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-4">
        Already have an account? <Link to="/sign-in" className="text-blue-600 hover:underline">Sign In</Link>
      </p>
    </div>
  );
};

export default SignUp;