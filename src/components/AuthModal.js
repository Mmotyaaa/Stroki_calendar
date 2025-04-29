import { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');

  const translateError = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'Этот email уже используется',
      'auth/invalid-email': 'Неверный формат email',
      'auth/weak-password': 'Пароль должен содержать минимум 6 символов',
      'auth/user-not-found': 'Пользователь не найден',
      'auth/wrong-password': 'Неверный пароль',
      'missing-permissions': 'Ошибка доступа. Попробуйте позже',
      'default': 'Произошла ошибка. Попробуйте еще раз'
    };
    return errorMessages[errorCode] || errorMessages['default'];
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // 1. Создаем пользователя в Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 2. Обновляем профиль с именем (это может занять некоторое время)
        await updateProfile(user, { displayName: name });

        // 3. Пытаемся сохранить в Firestore, но не блокируем успешную регистрацию при ошибке
        try {
          const db = getFirestore();
          await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            createdAt: new Date()
          });
        } catch (dbError) {
          console.error("Ошибка при сохранении в Firestore:", dbError);
          // Не прерываем процесс - пользователь уже создан в Auth
          // Можно добавить логику повторной попытки или фонового обновления
        }
      }
      
      // Успешная аутентификация/регистрация
      onAuthSuccess();
    } catch (err) {
      console.error("Ошибка аутентификации:", err);
      // Показываем ошибку только если это не связано с Firestore
      if (!err.code || !err.code.startsWith('missing-')) {
        setError(translateError(err.code || err.message));
      } else {
        // Если ошибка только в Firestore, все равно считаем регистрацию успешной
        onAuthSuccess();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2 className="auth-title">{isLoginMode ? 'Вход' : 'Регистрация'}</h2>
        
        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleAuth}>
          {!isLoginMode && (
            <div className="form-group">
              <label className="form-label">Имя</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-submit-button">
            {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <button 
          className="auth-switch-mode" 
          onClick={() => setIsLoginMode(!isLoginMode)}
        >
          {isLoginMode ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;