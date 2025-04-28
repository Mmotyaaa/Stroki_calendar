import './Header.css';

const Header = ({ user, onLoginClick, onLogout, onAccountClick }) => {
  return (
    <header className="header">
      <nav className="nav-container">
        <button className="nav-button" onClick={() => window.location.reload()}>
          Главная
        </button>
        <div className="auth-buttons">
          {user ? (
            <>
              <button className="nav-button" onClick={onLogout}>
                Выйти
              </button>
              <button 
                className="nav-button account-button" 
                onClick={onAccountClick}
              >
                Личный кабинет
              </button>
            </>
          ) : (
            <button className="nav-button login-button" onClick={onLoginClick}>
              Войти
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;