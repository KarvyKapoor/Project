import React, { useState } from 'react';
import { User, Notification, Role, UserView, AdminView, Language } from '../types';
import { getTranslation } from '../translations';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  notifications: Notification[];
  userView?: UserView;
  setUserView?: (view: UserView) => void;
  adminView?: AdminView;
  setAdminView?: (view: AdminView) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, notifications, userView, setUserView, adminView, setAdminView, language, setLanguage, theme, setTheme }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navButtonClasses = (active: boolean) => 
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      active
        ? 'bg-green-600 text-white'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`;
    
  const mobileNavButtonClasses = (active: boolean) => 
    `block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
      active
        ? 'bg-green-600 text-white'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`;

  const navLinks = {
    [Role.USER]: [
      { label: getTranslation(language, 'home'), action: () => setUserView?.('home'), isActive: userView === 'home' },
      { label: getTranslation(language, 'community'), action: () => setUserView?.('community'), isActive: userView === 'community' },
      { label: getTranslation(language, 'history'), action: () => setUserView?.('history'), isActive: userView === 'history' },
      { label: getTranslation(language, 'badges'), action: () => setUserView?.('gamification'), isActive: userView === 'gamification' },
      { label: getTranslation(language, 'fileComplaint'), action: () => setUserView?.('fileComplaint'), isActive: userView === 'fileComplaint' },
      { label: getTranslation(language, 'help'), action: () => setUserView?.('help'), isActive: userView === 'help' },
    ],
    [Role.ADMIN]: [
      { label: 'Recent', action: () => setAdminView?.('recent'), isActive: adminView === 'recent' },
      { label: 'History', action: () => setAdminView?.('history'), isActive: adminView === 'history' },
      { label: 'Reports', action: () => setAdminView?.('reports'), isActive: adminView === 'reports' },
    ]
  };

  const currentNavLinks = navLinks[user.role] || [];
  const languages: Language[] = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Tamil', 'Sanskrit', 'Punjabi', 'Korean'];

  const handleMobileLinkClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md relative z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-6 4h6m-6 4h6" /></svg>
            <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">ZeroKachra</span>
            
            {/* Desktop Navigation */}
            <nav className="ml-10 hidden lg:flex items-baseline space-x-4">
              {currentNavLinks.map(link => (
                <button key={link.label} onClick={link.action} className={navButtonClasses(link.isActive)}>
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
             {/* Desktop Language & Notifications */}
             <div className="hidden md:flex items-center space-x-4">
                {/* Dark Mode Toggle */}
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                  className="p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                  title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                  {theme === 'light' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                     </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>

                <div className="relative group">
                    <button className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        {language}
                    </button>
                    <div className="absolute right-0 mt-2 w-40 max-h-80 overflow-y-auto bg-white dark:bg-gray-700 rounded-md shadow-lg hidden group-hover:block border border-gray-200 dark:border-gray-600">
                         {languages.map(lang => (
                             <button 
                                key={lang} 
                                onClick={() => setLanguage(lang)}
                                className={`block w-full text-left px-4 py-2 text-sm ${language === lang ? 'bg-gray-100 dark:bg-gray-600 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-600'} text-gray-700 dark:text-gray-200`}
                             >
                                 {lang}
                             </button>
                         ))}
                    </div>
                </div>

                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="sr-only">View notifications</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {notifications.length > 0 && (
                         <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                            {notifications.length}
                         </span>
                      )}
                    </button>
                    {showNotifications && (
                        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                            <div className="p-2 font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-600">Notifications</div>
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <a key={n.id} href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">{n.message}</a>
                                ))
                            ) : (
                                <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No new notifications.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800 dark:text-white">{user.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {getTranslation(language, 'logout')}
                </button>
            </div>

            {/* Burger Menu Button - visible only on mobile/tablet */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                aria-controls="mobile-menu"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="lg:hidden" id="mobile-menu">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {currentNavLinks.map(link => (
              <button
                key={link.label}
                onClick={() => handleMobileLinkClick(link.action)}
                className={mobileNavButtonClasses(link.isActive)}
              >
                {link.label}
              </button>
            ))}
          </nav>
          {/* Mobile Theme Toggle */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
             <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{getTranslation(language, 'darkMode')}</span>
             <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-green-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
          {/* Mobile Language Selector */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Language</label>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                  {languages.map(lang => (
                      <button 
                        key={lang} 
                        onClick={() => setLanguage(lang)}
                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${language === lang ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                      >
                          {lang}
                      </button>
                  ))}
              </div>
          </div>
          {/* Mobile user actions */}
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-5">
                <div>
                    <div className="text-base font-medium leading-none text-gray-800 dark:text-white">{user.name}</div>
                    <div className="text-sm font-medium leading-none text-gray-500 dark:text-gray-400">{user.role}</div>
                </div>
                 <button onClick={() => setShowNotifications(!showNotifications)} className="ml-auto bg-white dark:bg-gray-800 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white relative">
                    <span className="sr-only">View notifications</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    {notifications.length > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{notifications.length}</span>}
                </button>
            </div>
            <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={onLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  {getTranslation(language, 'logout')}
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;