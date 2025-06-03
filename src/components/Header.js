import './Header.css';

const Header = ({ 
  user, 
  isAdmin, 
  onLoginClick, 
  onLogout, 
  onAccountClick,
  onAdminPanelClick,
  onRoomsClick
}) => {
  return (
    <header className="header">
      <nav className="nav-container">
        <nav>
          <button 
            className="nav-button" 
            onClick={() => window.location.reload()}
          >
            Календарь
          </button>
    
          <button
            className="nav-button"
            onClick={onRoomsClick}
          >
            Кабинеты
          </button>
        </nav>
        
        <div className="auth-buttons">
          {user ? (
            <>
              {isAdmin && (
                <button 
                  className="nav-button admin-button"
                  onClick={onAdminPanelClick}
                >
                  Админ-панель
                </button>
              )}
              
              <button 
                className="nav-button account-button" 
                onClick={onAccountClick}
                disabled={!user}
              >
                Личный кабинет
              </button>
              
              <button 
                className="nav-button logout-button" 
                onClick={onLogout}
              >
                Выйти
              </button>
            </>
          ) : (
            <button 
              className="nav-button login-button" 
              onClick={onLoginClick}
            >
              Войти
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;