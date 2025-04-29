import { auth } from './firebase';
import { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import AuthModal from './components/AuthModal';
import Header from './components/Header';
import AccountPage from './components/AccountPage';
import ConfirmModal from './components/ConfirmModal';
import TitlePage from './components/TitlePage';
import './App.css';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [showTitlePage, setShowTitlePage] = useState(false);

  useEffect(() => {
    // Проверяем sessionStorage вместо localStorage
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowTitlePage(true);
      sessionStorage.setItem('hasVisited', 'true');
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
      if (user) setCurrentView('calendar');
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const handleAccountClick = () => {
    if (user) setCurrentView('account');
  };

  const handleLogoutConfirm = () => {
    auth.signOut();
    setCurrentView('calendar');
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
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogoutClick}
        onAccountClick={handleAccountClick}
      />

      <main className="main-content">
        {currentView === 'calendar' ? (
          <Calendar />
        ) : (
          <AccountPage user={user} onBack={handleBackToCalendar} />
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