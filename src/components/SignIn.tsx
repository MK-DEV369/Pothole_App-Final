import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface Props {
  setUser: (user: { id: string; email: string; points: number; profileImage: string }) => void;
}

const SignIn: React.FC<Props> = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SignIn: Starting sign-in process...');
    try {
      setLoading(true);
      setError(null);

      console.log(`SignIn: Attempting to sign in user with email: ${email}`);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      if (data.user) {
        console.log('SignIn: User successfully signed in:', data.user);
        
        // Fetch the user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('points, profile_image')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        console.log('SignIn: Profile data fetched successfully:', profileData);
        if (profileData) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            points: profileData.points,
            profileImage: profileData.profile_image || '/components/User.jpg',
          });
        }

        console.log('SignIn: Navigating to Home...');
        navigate('/');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('SignIn: Error occurred during sign-in:', err.message);
        setError(err.message);
      } else {
        console.error('SignIn: Unknown error occurred during sign-in.');
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    console.log('SignIn: Starting anonymous sign-in process...');
    try {
      setLoading(true);
      setError(null);

      await supabase.auth.signOut();
      const randomEmail = `anonymous_${Date.now()}@example.com`;
      const randomPassword = Math.random().toString(36).slice(-8);

      console.log(`SignIn: Attempting to sign up anonymous user with email: ${randomEmail}`);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: randomEmail,
        password: randomPassword,
      });

      if (signUpError) throw signUpError;

      if (signUpData?.user) {
        console.log('SignIn: Anonymous user successfully signed up:', signUpData.user);
        const { data, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            email: signUpData.user.email,
            points: 0,
            profile_image: '/components/User.jpg',
          })
          .select('*');

        if (profileError) throw profileError;

        console.log('SignIn: Profile created successfully:', data);

        setUser({
          id: signUpData.user.id,
          email: randomEmail,
          points: 0,
          profileImage: '/components/User.jpg',
        });

        console.log('SignIn: Navigating to Home...');
        navigate('/');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('SignIn: Error occurred during anonymous sign-in:', err.message);
        setError(err.message);
      } else {
        console.error('SignIn: Unknown error occurred during anonymous sign-in.');
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 text-white  h-screen">
      <h1>Sign In</h1>
      <form onSubmit={handleSignIn} className="space-y-4 mt-4">
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
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <p className="mt-4">Or sign in anonymously:</p>
      <button
        onClick={handleAnonymousSignIn}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        disabled={loading}
      >
        {loading ? 'Signing In...' : 'Anonymous Sign In'}
      </button>
      <p className="mt-4">
        Don't have an account?{' '}
        <Link to="/sign-up" className="text-blue-600 hover:underline">Sign Up</Link>
      </p>
    </div>
  );
};

export default SignIn;
