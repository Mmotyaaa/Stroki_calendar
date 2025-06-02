import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  collection, getDocs, updateDoc, doc,
  setDoc, deleteDoc, serverTimestamp, addDoc, getDoc 
} from 'firebase/firestore';
import { db, USER_STATUS, USER_ROLES } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import './AdminPanel.css';

const AdminPanel = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    status: USER_STATUS.ACTIVE,
    role: USER_ROLES.USER
  });
  
  const [newRoom, setNewRoom] = useState({
    number: '',
    description: '',
    capacity: 4,
    isActive: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const admin = auth.currentUser;
        if (admin) {
          const adminDoc = await getDoc(doc(db, 'users', admin.uid));
          setCurrentAdmin({
            uid: admin.uid,
            email: admin.email,
            ...adminDoc.data()
          });
        }

        const [usersSnapshot, roomsSnapshot, bookingsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'rooms')),
          getDocs(collection(db, 'bookings'))
        ]);
        
        setUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setRooms(roomsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setBookings(bookingsSnapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          startTime: d.data().startTime?.toDate(),
          endTime: d.data().endTime?.toDate()
        })));
        
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const createUser = async () => {
    setError('');
    setSuccess('');
    setIsCreatingUser(true);
    
    if (!validateEmail(newUser.email)) {
      setError('Введите корректный email');
      setIsCreatingUser(false);
      return;
    }

    if (newUser.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsCreatingUser(false);
      return;
    }

    if (!newUser.name) {
      setError('Введите имя пользователя');
      setIsCreatingUser(false);
      return;
    }

    let adminPassword;
    const admin = auth.currentUser;
    
    try {
      // 1. Подтверждение админа
      if (!admin) throw new Error('Администратор не авторизован');
      const adminEmail = admin.email;
      adminPassword = prompt('Введите ваш пароль для подтверждения:');
      if (!adminPassword) {
        setError('Требуется подтверждение пароля');
        setIsCreatingUser(false);
        return;
      }

      // 2. Создаем пользователя в Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      console.log('Пользователь создан в Authentication:', user.uid);
      const userRef = doc(db, 'users', user.uid);
      console.log('Ссылка на документ:', userRef.path);

      // 3. Создаем запись в Firestore
      const userData = {
        uid: user.uid,
        email: newUser.email,
        name: newUser.name,
        status: newUser.status,
        role: newUser.role,
        createdAt: serverTimestamp()
      };

      await setDoc(userRef, userData);
      console.log('Документ создан в Firestore');

      // 4. Обновляем профиль
      await updateProfile(user, {
        displayName: newUser.name
      });

      // 5. Восстанавливаем сессию админа
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

      // 6. Обновляем UI
      setUsers(prev => [...prev, { id: user.uid, ...userData }]);

      // 7. Очищаем форму
      setNewUser({ 
        email: '', 
        name: '', 
        password: '',
        status: USER_STATUS.ACTIVE,
        role: USER_ROLES.USER
      });

      setSuccess('Пользователь успешно создан');

    } catch (error) {
      console.error("Ошибка создания пользователя:", error);

      // Восстановление сессии админа
      if (admin && adminPassword) {
        try {
          await signInWithEmailAndPassword(auth, admin.email, adminPassword);
        } catch (restoreError) {
          console.error("Ошибка восстановления сессии:", restoreError);
        }
      }

      setError(error.message.includes('email-already-in-use') 
        ? 'Пользователь с таким email уже существует' 
        : 'Ошибка при создании пользователя');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const deleteUserHandler = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      return;
    }

    try {
      // 1. Удаляем из Firestore
      await deleteDoc(doc(db, 'users', userId));

      // 2. Обновляем UI
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));

      setSuccess('Пользователь удален из системы');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error("Ошибка удаления:", error);
      setError('Не удалось удалить пользователя: ' + error.message);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
      setError('Ошибка обновления статуса');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Вы уверены, что хотите изменить роль пользователя на ${newRole}?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess('Роль пользователя успешно изменена');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Ошибка обновления роли:", error);
      setError('Ошибка обновления роли');
    }
  };

  const saveRoom = async () => {
    setError('');
    setSuccess('');
    
    if (!newRoom.number || !newRoom.description) {
      setError('Заполните все поля');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'rooms'), {
        ...newRoom,
        createdAt: serverTimestamp()
      });
      
      setRooms(prevRooms => [...prevRooms, { id: docRef.id, ...newRoom }]);
      setNewRoom({ number: '', description: '', capacity: 4, isActive: true });
      setSuccess('Кабинет успешно добавлен');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Ошибка добавления кабинета:", error);
      setError('Ошибка при добавлении кабинета');
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Вы уверены, что хотите удалить кабинет?')) return;
    
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      setRooms(prevRooms => prevRooms.filter(r => r.id !== roomId));
      setSuccess('Кабинет успешно удален');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Ошибка удаления кабинета:", error);
      setError('Ошибка удаления кабинета');
    }
  };

  const updateBooking = async (bookingId, updates) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), updates);
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, ...updates } : b
      ));
    } catch (error) {
      console.error("Ошибка обновления бронирования:", error);
      setError('Ошибка обновления бронирования');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Вы уверены, что хотите удалить бронирование?')) return;
    
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId));
      setSuccess('Бронирование успешно удалено');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Ошибка удаления бронирования:", error);
      setError('Ошибка удаления бронирования');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (!currentAdmin || currentAdmin.role !== USER_ROLES.ADMIN) {
    return (
      <div className="admin-panel">
        <button onClick={onBack} className="back-button">
          ← Назад к календарю
        </button>
        <div className="error-message">
          Недостаточно прав для доступа к панели администратора
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <button onClick={onBack} className="back-button">
        ← Назад к календарю
      </button>

      <div className="tabs">
        <button 
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'active' : ''}
        >
          Пользователи
        </button>
        <button 
          onClick={() => setActiveTab('rooms')}
          className={activeTab === 'rooms' ? 'active' : ''}
        >
          Кабинеты
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={activeTab === 'bookings' ? 'active' : ''}
        >
          Бронирования
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {success && <div className="success-message">✓ {success}</div>}

      {activeTab === 'users' && (
        <div className="section">
          <h2>Управление пользователями</h2>
          
          <div className="create-form">
            <h3>Создать пользователя</h3>
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Имя"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Пароль (мин. 6 символов)"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
              minLength={6}
            />
            <div className="form-row">
              <label>
                Статус:
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                >
                  <option value={USER_STATUS.ACTIVE}>Активен</option>
                  <option value={USER_STATUS.INACTIVE}>Неактивен</option>
                </select>
              </label>
              <label>
                Роль:
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value={USER_ROLES.USER}>Пользователь</option>
                  <option value={USER_ROLES.ADMIN}>Администратор</option>
                </select>
              </label>
            </div>
            <button 
              onClick={createUser}
              disabled={!newUser.email || !newUser.name || newUser.password.length < 6 || isCreatingUser}
            >
              {isCreatingUser ? 'Создание...' : 'Создать пользователя'}
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Имя</th>
                  <th>Статус</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.name}</td>
                    <td>
                      <select
                        value={user.status}
                        onChange={(e) => updateUserStatus(user.id, e.target.value)}
                      >
                        <option value={USER_STATUS.ACTIVE}>Активен</option>
                        <option value={USER_STATUS.INACTIVE}>Неактивен</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        disabled={user.id === currentAdmin?.uid}
                      >
                        <option value={USER_ROLES.USER}>Пользователь</option>
                        <option value={USER_ROLES.ADMIN}>Администратор</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteUserHandler(user.id)}
                        disabled={user.id === currentAdmin?.uid || user.role === USER_ROLES.ADMIN}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="section">
          <h2>Управление кабинетами</h2>
          
          <div className="create-form">
            <h3>Добавить кабинет</h3>
            <input
              type="text"
              placeholder="Номер кабинета"
              value={newRoom.number}
              onChange={(e) => setNewRoom({...newRoom, number: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Описание"
              value={newRoom.description}
              onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Вместимость"
              value={newRoom.capacity}
              onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value) || 4})}
              min="1"
              required
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newRoom.isActive}
                onChange={(e) => setNewRoom({...newRoom, isActive: e.target.checked})}
              />
              Активен
            </label>
            <button onClick={saveRoom}>
              Добавить кабинет
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Номер</th>
                  <th>Описание</th>
                  <th>Вместимость</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td>{room.number}</td>
                    <td>{room.description}</td>
                    <td>{room.capacity}</td>
                    <td>{room.isActive ? 'Активен' : 'Неактивен'}</td>
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteRoom(room.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="section">
          <h2>Управление бронированиями</h2>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Кабинет</th>
                  <th>Событие</th>
                  <th>Пользователь</th>
                  <th>Дата/Время</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.room}</td>
                    <td>{booking.title}</td>
                    <td>{booking.userName}</td>
                    <td>
                      {booking.startTime?.toLocaleDateString()} {booking.startTime?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {booking.endTime?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td>
                      <select
                        value={booking.status}
                        onChange={(e) => updateBooking(booking.id, { status: e.target.value })}
                      >
                        <option value="active">Активно</option>
                        <option value="cancelled">Отменено</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteBooking(booking.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;