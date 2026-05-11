import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { email, password, role };
      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      if (res.data.user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent animate-pulse"></div>
      <div className="glass-card p-8 w-full max-w-md transform transition-all hover:scale-105">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-12 h-12 text-gold neon-glow" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-gold to-neon bg-clip-text text-transparent">
            7starswin Shortly
          </h1>
          <p className="text-gray-300 mt-2">Premium URL Shortener</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          {!isLogin && (
            <div className="flex gap-4 justify-center">
              <button type="button" onClick={() => setRole('user')} className={`px-4 py-1 rounded-full ${role === 'user' ? 'bg-primary' : 'bg-white/10'}`}>User</button>
              <button type="button" onClick={() => setRole('admin')} className={`px-4 py-1 rounded-full ${role === 'admin' ? 'bg-primary' : 'bg-white/10'}`}>Admin</button>
            </div>
          )}
          <button type="submit" className="w-full btn-3d bg-gradient-to-r from-primary to-purple-700 py-3 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/50 hover:shadow-xl transition-all">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-6">
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
