import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LogOut, User, Mail, Shield, Phone, Building2 } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import api from './utility/axiosInstance';

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if API fails, clear local storage and redirect
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="absolute top-[20%] left-[15%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[20%] right-[15%] w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full max-w-md text-center z-10 glass rounded-3xl p-10 shadow-2xl">
          <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-4 w-fit mx-auto shadow-lg shadow-blue-500/10">
            <Building2 className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Rentora</h1>
          <p className="text-slate-400 text-sm mb-8">Modern Property & Rental Management Platform</p>
          
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-3 px-4 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl py-3 px-4 active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-slate-100 flex flex-col items-center p-6 md:p-12">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-12 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Rentora</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-medium transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </header>

      {/* Main card */}
      <main className="w-full max-w-xl z-10">
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl transition-all duration-300 hover:shadow-blue-500/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-2xl">
              {user.firstname?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user.firstname} {user.lastname || ''}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 uppercase tracking-wide inline-block mt-1">
                {user.role}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Profile Details</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 py-2">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Email Address</span>
                <span className="text-slate-200">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 py-2">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Phone Number</span>
                <span className="text-slate-200">{user.phoneNumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 py-2">
              <Shield className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Account Status</span>
                <span className={`text-sm font-semibold px-2 py-0.5 rounded-md ${user.isVerified ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {user.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;