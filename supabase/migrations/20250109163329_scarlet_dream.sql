/*
  # Initial Schema Setup for Pothole Reporting System

  1. New Tables
    - profiles
      - Stores user profile information and points
    - pothole_reports
      - Stores pothole report details including location and status
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Allow anonymous access for pothole reporting
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create pothole_reports table
CREATE TABLE IF NOT EXISTS pothole_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in-progress', 'resolved')),
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pothole_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Pothole reports policies
CREATE POLICY "Anyone can read pothole reports"
  ON pothole_reports FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON pothole_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous users can create reports"
  ON pothole_reports FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can update own reports"
  ON pothole_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update points
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE profiles
    SET points = points + 10
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award points on new report
CREATE TRIGGER award_points_on_report
  AFTER INSERT ON pothole_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();