import React, { useState } from 'react';
import { User, Role, Language } from '../types';
import { getTranslation } from '../translations';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onSignUp: (user: User) => void;
  language: Language;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, onSignUp, language }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
    setIsSignUp(false);
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    resetForm();
  };

  const handleBack = () => {
    setSelectedRole(null);
    resetForm();
  };

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-gray-200 dark:bg-gray-600';
    if (score < 2) return 'bg-red-500';
    if (score < 3) return 'bg-yellow-500';
    if (score < 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
      if (score === 0) return '';
      if (score < 2) return getTranslation(language, 'weak');
      if (score < 3) return getTranslation(language, 'fair');
      if (score < 4) return getTranslation(language, 'good');
      return getTranslation(language, 'strong');
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      if (user.role !== selectedRole) {
        setError(`This account is not registered as a ${selectedRole}.`);
        return;
      }
      onLogin(user);
    } else {
      setError(getTranslation(language, 'loginError'));
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.email === email)) {
      setError('User already exists with this email');
      return;
    }

    if (password !== confirmPassword) {
        setError(getTranslation(language, 'passwordMismatch'));
        return;
    }

    if (!selectedRole) return;

    const newUser: User = {
      id: Date.now(),
      name,
      email,
      password,
      role: selectedRole,
      points: 0,
      badges: [],
    };

    onSignUp(newUser);
  };

  const passwordScore = checkPasswordStrength(password);

  // Landing View with Role Selection
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors duration-200">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="text-green-500">ZeroKachra</span>
          </h1>
          <p className="mt-2 text-xl text-green-600 dark:text-green-400 font-semibold">
            Waste Less, Live More
          </p>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-300">
            {getTranslation(language, 'welcome')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl justify-center">
          <button
            onClick={() => handleRoleSelect(Role.USER)}
            className="flex-1 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-green-500 flex flex-col items-center group"
          >
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full mb-4 group-hover:bg-green-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 dark:text-green-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getTranslation(language, 'roleUser')}</h2>
          </button>

          <button
            onClick={() => handleRoleSelect(Role.ADMIN)}
            className="flex-1 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-blue-500 flex flex-col items-center group"
          >
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 group-hover:bg-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 dark:text-blue-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getTranslation(language, 'roleAdmin')}</h2>
          </button>
        </div>
      </div>
    );
  }

  // Authentication Form View
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 relative">
        <button 
            onClick={handleBack}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          {getTranslation(language, selectedRole === Role.USER ? 'roleUser' : 'roleAdmin')} {isSignUp ? getTranslation(language, 'signUp') : getTranslation(language, 'signIn')}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getTranslation(language, 'name')}</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500" 
                required 
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getTranslation(language, 'email')}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getTranslation(language, 'password')}</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500" 
              required 
            />
             {isSignUp && password && (
                <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">{getTranslation(language, 'passwordStrength')}</span>
                        <span className={`font-semibold ${
                            passwordScore < 2 ? 'text-red-500' : 
                            passwordScore < 3 ? 'text-yellow-500' : 
                            passwordScore < 4 ? 'text-blue-500' : 'text-green-500'
                        }`}>
                            {getStrengthText(passwordScore)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor(passwordScore)}`} 
                            style={{ width: `${(passwordScore / 4) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
          </div>
          
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getTranslation(language, 'confirmPassword')}</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500" 
                required 
              />
            </div>
          )}

          <button 
            type="submit" 
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                selectedRole === Role.ADMIN 
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {isSignUp ? getTranslation(language, 'signUp') : getTranslation(language, 'signIn')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); resetForm(); }} 
            className={`text-sm hover:underline ${
                selectedRole === Role.ADMIN 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {isSignUp ? `${getTranslation(language, 'signIn')}?` : `${getTranslation(language, 'signUp')}?`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;