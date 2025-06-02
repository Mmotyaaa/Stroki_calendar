import { auth } from './firebase';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Calendar from './components/Calendar';
import AuthModal from './components/AuthModal';
import Header from './components/Header';
import AccountPage from './components/AccountPage';
import ConfirmModal from './components/ConfirmModal';
import TitlePage from './components/TitlePage';
import AdminPanel from './components/AdminPanel';
import RoomsPage from './components/RoomsPage';
import './App.css';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [showTitlePage, setShowTitlePage] = useState(false);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowTitlePage(true);
      sessionStorage.setItem('hasVisited', 'true');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().role === 'admin');
          }
        } catch (error) {
          console.error("Ошибка проверки прав:", error);
        }
      } else {
        setIsAdmin(false);
        // Не сбрасываем currentView при разлогине, чтобы сохранить текущий view
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // Убрали currentView из зависимостей

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const handleAccountClick = () => {
    if (user) {
      setCurrentView('account');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAdminPanelClick = () => {
    setCurrentView('admin');
  };

  const handleLogoutConfirm = () => {
    auth.signOut();
    setCurrentView('calendar'); // Явный сброс только при выходе
    setIsConfirmModalOpen(false);
  };

  const handleLogoutClick = () => {
    setIsConfirmModalOpen(true);
  };

  const handleBackToCalendar = () => {
    setCurrentView('calendar');
  };

  const handleNavigateFromTitle = () => {
    setShowTitlePage(false);
  };

  const handleRoomsClick = () => {
    setCurrentView('rooms');
  };

  if (isLoading) {
    return <div className="app-loading"><div className="loader"></div></div>;
  }

  if (showTitlePage) {
    return <TitlePage onNavigate={handleNavigateFromTitle} />;
  }

  return (
    <div className={`app-container ${isAuthModalOpen || isConfirmModalOpen ? 'modal-open' : ''}`}>
      <Header
        user={user}
        isAdmin={isAdmin}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogoutClick}
        onAccountClick={handleAccountClick}
        onAdminPanelClick={handleAdminPanelClick}
        onRoomsClick={handleRoomsClick}
      />

      <main className="main-content">
        {currentView === 'rooms' ? (
          <RoomsPage isAdmin={isAdmin} />
        ) : currentView === 'admin' && isAdmin ? (
          <AdminPanel onBack={handleBackToCalendar} />
        ) : currentView === 'account' && user ? (
          <AccountPage user={user} onBack={handleBackToCalendar} />
        ) : (
          <Calendar />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        message="Вы уверены что хотите выйти?"
      />
    </div>
  );
}

export default App;