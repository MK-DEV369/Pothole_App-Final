import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navigation, Coins, LogOut, Briefcase, ShieldCheck, Sparkle } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import ReportForm from './components/ReportForm';
//  import PointsRedemption from './components/PointsRedemption';
import AdminDashboard from './components/AdminDashboard';
import ReportHistory from './components/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import LiveDashboard from './components/LiveDashboard';

interface UserProfileData {
  id: string;
  email: string;
  points: number;
  profile_image: 'src/components/User.jpg';
}

function App() {
  const { user, loading, error } = useAuthStore();
  console.log('AuthStore:', { user, loading, error });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  console.log('Before User Profile:', profile);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (profile) {
        console.log('Fetching user profile for:', profile.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, points, email')
          .eq('id', profile.id)
          .single();
        setProfile(profile);
        console.log('Supabase response:', { data, error });
        console.log('After Fetch User Profile:', profile);
        console.log('AuthStore:', { user, loading, error });
        if (error) {
          console.error('Error fetching user profile:', error);
        } else {
          console.log('User profile fetched successfully:', data);
          setProfile(profile);
        }
      } else {
        console.log('No user logged in');
      }
    };
    fetchUserProfile();
  }, [profile]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 640) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <div className=" bg-amber-600 bg-road flex animate-fadeIn">
      <aside
  className={`fixed inset-y-0 left-0 z-40 w-64 bg-black border-r transform transition-transform duration-300 ease-in-out ${
    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
  } sm:hidden`}
>
  <nav className="flex flex-col h-full p-4 space-y-4">
    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-orange-500">
      Nagar Dhwani
    </Link>
    <ul className="space-y-2">
      <li>
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center bg-sky-950 text-white px-4 py-2 rounded-lg hover:bg-orange-800"
        >
          <Navigation className="h-5 w-5 mr-2 text-white" /> Home
        </Link>
      </li>
      <li>
        <Link
          to="/report"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center bg-sky-950 text-white px-4 py-2 rounded-lg hover:bg-orange-800"
        >
          <Briefcase className="h-5 w-5 mr-2 text-white" /> Report
        </Link>
      </li>
      <li>
        <Link
          to="/report"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center bg-sky-950 text-white px-4 py-2 rounded-lg hover:bg-orange-800"
        >
          <Briefcase className="h-5 w-5 mr-2 text-white" /> Live Dashboard
        </Link>
      </li>
      {/* <li>
        <Link
          to="/redeem"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center bg-sky-950 text-white bg-white px-4 py-2 rounded-lg hover:bg-orange-800"
        >
          <Coins className="h-5 w-5 mr-2 text-white" /> Redeem
        </Link>
      </li> */}
      <li>
        <Link
          to="/admin"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center bg-sky-950 text-white px-4 py-2 rounded-lg hover:bg-orange-800"
        >
          <ShieldCheck className="h-5 w-5 mr-2 text-white" /> Admin
        </Link>
      </li>
      {profile ? (
  <>
    <li className="absolute bottom-0 w-[90%]">
      <div className="flex justify-between items-center p-3 bg-amber-50 rounded-t-lg text-amber-800">
        <div className="flex flex-col items-center space-y-1.5">
          <img
            src={profile.profile_image}
            alt="Avatar"
            className="h-8 w-8 rounded-full"
          />
          <div className="flex items-center space-x-1">
            <Sparkle className="inline-block" />
            <p className="text-xs font-medium">{profile.points} Pothole Points</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-1.5 rounded-lg hover:bg-gray-100 text-xs"
        >
          <LogOut className="h-4 w-4 mr-1.5" /> Logout
        </button>
      </div>
    </li>
  </>
) : (
  <li className="absolute bottom-5 w-[90%]">
    <Link
      to="/sign-in"
      onClick={() => setMobileMenuOpen(false)}
      className="flex items-center justify-center p-5 bg-sky-950 rounded-t-lg text-white hover:bg-orange-800 w-full"
    >
      Sign In
    </Link>
  </li>
)}
    </ul>
  </nav>
</aside>

        <div className={`fixed inset-0 bg-white bg-opacity-60 z-30 transition-opacity duration-300 ease-in-out ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } sm:hidden`} onClick={() => setMobileMenuOpen(false)}></div>

        <div
          className={`fixed top-4 left-4 z-50 p-2 bg-orange-400 rounded-full shadow-md sm:hidden ${
            mobileMenuOpen ? 'hidden' : 'block'
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Navigation className="h-6 w-6" />
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155]">
          <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md shadow-lg hidden sm:block">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <Link to="/" className="flex items-center group">
                <Navigation className="h-8 w-8 text-amber-600 transform transition-transform duration-300 group-hover:rotate-12" />
                <span className="ml-2 text-xl font-bold text-amber-900">Nagar Dhwani</span>
              </Link>
              <nav className="flex space-x-4">
                <Link
                  to="/report"
                  className="text-sm font-medium text-white hover:text-gray-500 transition-colors duration-200"
                >
                  Report
                </Link>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-white hover:text-gray-500 transition-colors duration-200"
                >
                  Live Dashboard
                </Link>
                {/* <Link
                  to="/redeem"
                  className="text-sm font-medium text-white hover:text-gray-500 transition-colors duration-200"
                >
                  Redeem
                </Link> */}
                <Link
                  to="/admin"
                  className="text-sm font-medium text-white hover:text-gray-500 transition-colors duration-200"
                >
                  Admin
                </Link>
              </nav>
              <div className="flex items-center space-x-4">
                {profile ? (
                  <>
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700">
                      <Sparkle />
                      <span>{profile?.points || 0} Pothole Points</span>
                    </div>
                    <img
                      src={`https://ui-avatars.com/api/?name=${profile.email.split('@')[0]}&background=random`}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full"
                    />
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-full bg-amber-600 text-black hover:bg-amber-700 transition-all duration-300"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/sign-in"
                    className="px-6 py-2 rounded-full text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50/50 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Main Routes */}
          <main className="container mx-auto py-8">
            <Routes>
              <Route path="/" element={<ReportHistory />} />              
              {/* <Route 
                path="/redeem"
                element={<PointsRedemption />}
              /> */}
              <Route
                path="/report"
                element={<ReportForm onSuccess={() => console.log('Report submitted')} />}
              />
              <Route path="/dashboard" element={<LiveDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/sign-in" element={<SignIn setUser={setProfile} />} />
              <Route path="/sign-up" element={<SignUp />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

