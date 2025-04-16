import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLoginMode) {
        // Логин
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        // Регистрация
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          name,
          role: 'user',
          isActive: false
        });
        alert('Регистрация успешна! Ожидайте активации администратором.');
        onClose();
      }
    } catch (err) {
      setError(err.message);
      console.error('Ошибка:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="auth-modal">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        <h2>{isLoginMode ? 'Вход' : 'Регистрация'}</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleAuth}>
          {!isLoginMode && (
            <div className="form-group">
              <label>Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-button">
            {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-switch">
          {isLoginMode ? (
            <span>
              Нет аккаунта?{' '}
              <button 
                type="button"
                onClick={() => setIsLoginMode(false)}
              >
                Зарегистрироваться
              </button>
            </span>
          ) : (
            <span>
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={() => setIsLoginMode(true)}
              >
                Войти
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;