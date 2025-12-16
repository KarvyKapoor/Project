
import React, { useState, useCallback, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';
import { User, Complaint, Notification, Role, Badge, Status, UserView, AdminView, Language } from './types';
import { verifyComplaintAuthenticity } from './services/geminiService';

// Mock Data - Updated to include emails and passwords (plain text for demo)
const initialUsers: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', password: 'password', role: Role.USER, points: 150, badges: [Badge.RECYCLING_ROOKIE] },
  { id: 2, name: 'Admin Bob', email: 'admin@example.com', password: 'admin', role: Role.ADMIN, points: 0, badges: [] },
  { id: 4, name: 'Diana', email: 'diana@example.com', password: 'password', role: Role.USER, points: 210, badges: [Badge.RECYCLING_ROOKIE, Badge.WASTE_WARRIOR] },
  { id: 5, name: 'Eve', email: 'eve@example.com', password: 'password', role: Role.USER, points: 80, badges: [] },
  { id: 6, name: 'Frank', email: 'frank@example.com', password: 'password', role: Role.USER, points: 300, badges: [Badge.RECYCLING_ROOKIE, Badge.WASTE_WARRIOR, Badge.COMPOST_CHAMPION] },
  { id: 7, name: 'Grace', email: 'grace@example.com', password: 'password', role: Role.USER, points: 120, badges: [Badge.RECYCLING_ROOKIE] },
];

const initialComplaints: Complaint[] = [
  { id: 1, userId: 1, userName: 'Alice', location: 'Library, 2nd Floor', description: 'Overflowing recycling bin.', status: Status.RESOLVED, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), imageUrl: 'https://images.unsplash.com/photo-1599664223843-93498b115a38?q=80&w=2070&auto=format&fit=crop', votes: 12, isPublic: true, authenticityStatus: 'Verified' },
  { id: 2, userId: 1, userName: 'Alice', location: 'Cafeteria', description: 'General waste bin is full and smelly.', status: Status.IN_PROGRESS, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), votes: 5, isPublic: true, authenticityStatus: 'Likely Authentic' },
  { id: 3, userId: 1, userName: 'Alice', location: 'Dorm Block A', description: 'Broken glass bottle on the pavement.', status: Status.PENDING, createdAt: new Date(), votes: 0, isPublic: false, authenticityStatus: 'Unverified' },
  { id: 4, userId: 4, userName: 'Diana', location: 'Gym', description: 'Paper towels all over the floor.', status: Status.PENDING, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), votes: 8, isPublic: true, authenticityStatus: 'Unverified' },
  { id: 5, userId: 5, userName: 'Eve', location: 'Science Building', description: 'Compost bin is missing.', status: Status.IN_PROGRESS, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), votes: 3, isPublic: true, authenticityStatus: 'Likely Authentic' },
];

const initialNotifications: Notification[] = [
  { id: 1, userId: 1, message: 'Your complaint about the library bin has been resolved. +20 points!', isRead: false, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: 2, userId: 2, message: 'A new complaint has been submitted.', isRead: true, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: 3, userId: 2, message: 'System analytics for the week are ready.', isRead: false, createdAt: new Date() },
];


function App() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [userView, setUserView] = useState<UserView>('home');
  const [adminView, setAdminView] = useState<AdminView>('recent');
  const [language, setLanguage] = useState<Language>('English');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Handle Theme Toggle
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === Role.USER) {
      setUserView('home');
    }
    if (user.role === Role.ADMIN) {
      setAdminView('recent');
    }
  };

  const handleSignUp = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    handleLogin(newUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddComplaint = (location: string, description: string, imageUrl?: string, isPublic: boolean = true, authenticityStatus: 'Unverified' | 'Likely Authentic' | 'Potential Spam' = 'Unverified') => {
    if (!currentUser) return;
    // Use Date.now() for unique IDs to prevent collisions when items are deleted
    const newComplaint: Complaint = {
      id: Date.now(), 
      userId: currentUser.id,
      userName: currentUser.name,
      location,
      description,
      status: Status.PENDING,
      createdAt: new Date(),
      imageUrl,
      votes: 0,
      isPublic,
      authenticityStatus: authenticityStatus as any, 
    };
    setComplaints(prev => [newComplaint, ...prev]);
  };

  const handleVote = (complaintId: number) => {
    setComplaints(prev => prev.map(c => 
      c.id === complaintId 
      ? { ...c, votes: c.votes + 1 }
      : c
    ));
  };

  const handleUpdateComplaintStatus = useCallback((complaintId: number, status: Status) => {
    setComplaints(prev => prev.map(c => 
      c.id === complaintId 
        ? { 
            ...c, 
            status, 
            resolvedAt: status === Status.RESOLVED ? new Date() : undefined
          } 
        : c
    ));
  }, []);

  // Soft delete: Move to Recycle Bin
  const handleDeleteComplaint = useCallback((complaintId: number) => {
    setComplaints(prev => prev.map(c => 
      c.id === complaintId ? { ...c, deletedAt: new Date() } : c
    ));
  }, []);

  // Restore from Recycle Bin
  const handleRestoreComplaint = useCallback((complaintId: number) => {
    setComplaints(prev => prev.map(c => 
      c.id === complaintId ? { ...c, deletedAt: undefined } : c
    ));
  }, []);

  // Permanent Delete
  const handlePermanentDelete = useCallback((complaintId: number) => {
    setComplaints(prev => prev.filter(c => c.id !== complaintId));
  }, []);

  // Factor 1: AI Verification
  const handleVerifyAuthenticity = useCallback(async (complaintId: number) => {
     const complaint = complaints.find(c => c.id === complaintId);
     if (!complaint) return;

     const result = await verifyComplaintAuthenticity(complaint.description, complaint.imageUrl);
     
     setComplaints(prev => prev.map(c => 
        c.id === complaintId
        ? { ...c, authenticityStatus: result }
        : c
     ));
  }, [complaints]);

  // Factor 2: Admin Manual Verification/Rejection
  const handleAdminVerify = useCallback((complaintId: number, status: 'Verified' | 'Spam') => {
      setComplaints(prev => prev.map(c => 
        c.id === complaintId
        ? { ...c, authenticityStatus: status }
        : c
      ));
  }, []);


  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} onSignUp={handleSignUp} language={language} />;
  }

  // Filter complaints relevant to the current user for the Chatbot context (excluding deleted)
  const userComplaints = complaints.filter(c => c.userId === currentUser.id && !c.deletedAt);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        notifications={notifications.filter(n => n.userId === currentUser.id && !n.isRead)}
        userView={userView}
        setUserView={setUserView}
        adminView={adminView}
        setAdminView={setAdminView}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <Dashboard 
          currentUser={currentUser} 
          complaints={complaints}
          users={users}
          onAddComplaint={handleAddComplaint}
          onUpdateComplaintStatus={handleUpdateComplaintStatus}
          onDeleteComplaint={handleDeleteComplaint}
          onRestoreComplaint={handleRestoreComplaint}
          onPermanentDelete={handlePermanentDelete}
          onVote={handleVote}
          userView={userView}
          setUserView={setUserView}
          adminView={adminView}
          onVerify={handleVerifyAuthenticity}
          onAdminVerify={handleAdminVerify}
          language={language}
        />
      </main>
      <ChatAssistant 
        language={language} 
        complaints={userComplaints}
        onAddComplaint={handleAddComplaint}
      />
    </div>
  );
}

export default App;