import { useState } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const translateError = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'Этот email уже используется',
      'auth/invalid-email': 'Неверный формат email',
      'auth/weak-password': 'Пароль должен содержать минимум 6 символов',
      'auth/user-not-found': 'Пользователь не найден',
      'auth/wrong-password': 'Неверный пароль',
      'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
      'firestore/user-exists': 'Пользователь уже существует в системе',
      'default': 'Произошла ошибка. Попробуйте еще раз'
    };
    return errorMessages[errorCode] || errorMessages['default'];
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLoginMode) {
        // Режим входа
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Режим регистрации
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        try {
          // Проверяем, не существует ли уже пользователь в Firestore
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            throw new Error('firestore/user-exists');
          }

          // Создаем документ пользователя в Firestore
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            name: name,
            role: "user",
            status: "inactive",
            createdAt: new Date(),
            lastLogin: new Date()
          });

          // Обновляем профиль в Firebase Auth
          await updateProfile(user, { displayName: name });

        } catch (firestoreError) {
          console.error("Ошибка Firestore:", firestoreError);
          // Откатываем создание пользователя, если не удалось создать запись
          await deleteUser(user);
          throw firestoreError;
        }
      }
      
      onAuthSuccess();
    } catch (err) {
      console.error("Ошибка аутентификации:", err);
      setError(translateError(err.code || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-content">
        <button 
          className="close-button" 
          onClick={onClose}
          disabled={isLoading}
        >
          &times;
        </button>
        
        <h2 className="auth-title">
          {isLoginMode ? 'Вход в систему' : 'Регистрация'}
        </h2>
        
        {error && (
          <div className="auth-error-message">
            <span className="error-icon">⚠️</span> 
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleAuth}>
          {!isLoginMode && (
            <div className="form-group">
              <label htmlFor="name" className="form-label">Ваше имя</label>
              <input
                id="name"
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={30}
                placeholder="Иван Иванов"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@mail.com"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              id="password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Не менее 6 символов"
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : isLoginMode ? (
              'Войти'
            ) : (
              'Зарегистрироваться'
            )}
          </button>
        </form>

        <div className="auth-switch-mode">
          {isLoginMode ? (
            <p>
              Нет аккаунта?{' '}
              <button 
                type="button"
                onClick={() => setIsLoginMode(false)}
                disabled={isLoading}
              >
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{' '}
              <button 
                type="button"
                onClick={() => setIsLoginMode(true)}
                disabled={isLoading}
              >
                Войти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;