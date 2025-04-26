import React, { useState, useRef } from 'react';
import { Camera, Upload, MapPin, AlertTriangle } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../store/authStore';

interface ReportFormProps {
  onSuccess: () => void;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ReportForm: React.FC<ReportFormProps> = ({ onSuccess }) => {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [image, setImage] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingmap, setLoadingmap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const { user } = useAuthStore();
  const authStore = useAuthStore();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      try {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();        
        const result = await tf.tidy(() => {
          return tf.image.resizeBilinear(tf.browser.fromPixels(img), [224, 224]).toFloat().expandDims();
        });
        console.log(result);
      } catch (err) {
        console.error('Error verifying image:', err);
      }
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
  
    try {
      setLoadingmap(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
  
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      console.log("Latitude: " + position.coords.latitude, "Longitude: " + position.coords.longitude);
      setError(null);
    } catch (err: any) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permission to access location was denied. Please enable location services.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Try again later.');
            break;
          case err.TIMEOUT:
            setError('The request to get your location timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred while retrieving location.');
        }
      } else {
        console.error('Error getting location:', err);
        setError('Unable to get your location. Please check your device settings.');
      }
    } finally {
      setLoadingmap(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      if (!image || !location) {
        throw new Error('Please provide both an image and location');
      }
      const { data: imageData, error: imageError } = await supabase.storage
        .from('pothole-images')
        .upload(`${Date.now()}-${image.name}`, image);
  
      if (imageError) {
        console.error('Image upload error:', imageError.message);
        throw imageError;
      }
  
      const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pothole-images/${imageData.path}`;
      const { error: reportError } = await supabase
        .from('pothole_reports')
        .insert({
          user_id: user?.id,
          description,
          severity,
          image_url: imageUrl,
          latitude: location.lat,
          longitude: location.lng,
          status: 'reported'
        });
  
      if (user && !user.email.startsWith('anonymous_')) {
        const newPoints = (user.points || 0) + 1;
        const { error: pointsError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', user.id);
  
        if (pointsError) {
          console.error('Error updating points:', pointsError.message);
          throw pointsError;
        }
        authStore.updateUser({ ...user, points: newPoints });
        alert(`Report Successfully Submitted! You now have ${newPoints} points.`);
      } else {
        alert("Report Successfully Submitted! However, anonymous users don't earn points.");
      }

      if (reportError) {
        console.error('Report submission error:', reportError.message);
        throw reportError;
      }
  
      onSuccess?.();
      setDescription('');
      setSeverity('medium');
      setImage(null);
      setImagePreview('');
      setLocation(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src="https://static.toiimg.com/photo/97174275/97174275.jpg"
              alt="Road repair"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        </div>

        <div className="bg-sky-900 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-8">Report a Pothole</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg animate-fadeIn">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="ml-3 text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium  text-white">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border-amber-200 text-black bg-white/50 focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50 transition-all duration-300"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full rounded-lg border-amber-200 bg-white/50 focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50 transition-all duration-300"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-lg border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.capture = 'environment';
                      fileInputRef.current.click();
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-lg border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </button>
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loadingmap}
                className="w-full flex items-center justify-center px-4 py-2 rounded-lg border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 disabled:opacity-50"
              >
                <MapPin className="h-5 w-5 mr-2" />
                {loadingmap ? 'Getting Location...' : location ? 'Location Captured' : 'Get Location'}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            {imagePreview && (
              <div className="mt-4">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg shadow-md transition-all duration-300"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
  );
};

export default ReportForm;