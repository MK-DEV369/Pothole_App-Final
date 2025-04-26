import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { IndianRupee } from 'lucide-react';

const PointsRedemption: React.FC = () => {
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuthStore();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!user) throw new Error('Please sign in to redeem points');
      if (!upiId) throw new Error('Please enter your UPI ID');

      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (!profile || profile.points < 100) {
        throw new Error('You need at least 100 points to redeem');
      }

      const pointsToRedeem = Math.floor(profile.points / 100) * 100;
      const amount = pointsToRedeem / 10;

      const { error: redeemError } = await supabase
        .from('upi_rewards')
        .insert({
          user_id: user.id,
          points_redeemed: pointsToRedeem,
          upi_id: upiId,
          status: 'pending'
        });

      if (redeemError) throw redeemError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: profile.points - pointsToRedeem })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(`Successfully initiated transfer of ₹${amount} to ${upiId}`);
      setUpiId('');
    } catch (err) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 animate-fadeIn">
      <div className="flex items-center mb-6">
        <IndianRupee className="h-8 w-8 text-amber-600 mr-3" />
        <h2 className="text-2xl font-bold text-amber-900">Redeem Points</h2>
      </div>

      <div className="mb-6 p-4 bg-amber-50 rounded-lg">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">How it works</h3>
        <ul className="list-disc list-inside text-amber-700 space-y-2">
          <li>Every 10 points = ₹1</li>
          <li>Minimum redemption: 100 Pothole Points (₹10)</li>
          <li>Points are redeemed in multiples of 100</li>
          <li>Money will be transferred to your UPI ID</li>
          <li>If you Fix a Pothole yourself and #-Tag and post it in any Social Media, you immediately gain 100 Pothole Points</li>
        </ul>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 animate-fadeIn">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700 animate-fadeIn">
          {success}
        </div>
      )}

      <form onSubmit={handleRedeem} className="space-y-4">
        <div>
          <label htmlFor="upiId" className="block text-sm font-medium text-amber-900">
            UPI ID
          </label>
          <input
            type="text"
            id="upiId"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="username@upi"
            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50 bg-white/50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Redeem Points'}
        </button>
      </form>
    </div>
  );
};

export default PointsRedemption;