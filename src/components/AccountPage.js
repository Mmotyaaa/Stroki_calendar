import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, getDocs, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { updateProfile } from "firebase/auth";
import moment from "moment";
import "./AccountPage.css";

const AccountPage = ({ onBack }) => {
  const [userData, setUserData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!auth.currentUser) return;

    setUserData({
      email: auth.currentUser.email,
      name: auth.currentUser.displayName || "Не указано",
      uid: auth.currentUser.uid
    });
    setNewName(auth.currentUser.displayName || "");

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("startTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate()
      }));
      
      setBookings(userBookings);
      setLoading(false);
    }, (error) => {
      console.error("Ошибка загрузки бронирований:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    
    try {
      await updateProfile(auth.currentUser, {
        displayName: newName
      });

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        name: newName
      });

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("userId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(bookingsQuery);
      
      const updates = snapshot.docs.map(bookingDoc => 
        updateDoc(bookingDoc.ref, {
          userName: newName
        })
      );
      
      await Promise.all(updates);

      setUserData(prev => ({ ...prev, name: newName }));
      setIsEditingName(false);
    } catch (error) {
      console.error("Ошибка при обновлении имени:", error);
      alert("Не удалось обновить имя");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Вы уверены, что хотите отменить бронирование?")) {
      try {
        setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId));
        await deleteDoc(doc(db, "bookings", bookingId));
      } catch (error) {
        console.error("Ошибка отмены бронирования:", error);
        alert("Не удалось отменить бронирование");
        const q = query(
          collection(db, "bookings"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("startTime", "desc")
        );
        const snapshot = await getDocs(q);
        const updatedBookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate()
        }));
        setBookings(updatedBookings);
      }
    }
  };

  return (
    <div className="account-page">
      <button onClick={onBack} className="back-button">
        ← Назад к календарю
      </button>

      <div className="profile-section">
        <h2>Мой профиль</h2>
        {userData && (
          <div className="profile-info">
            {isEditingName ? (
              <div className="name-edit">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="name-input"
                  placeholder="Введите ваше имя"
                />
                <div className="name-edit-buttons">
                  <button 
                    onClick={handleUpdateName}
                    className="save-name-button"
                  >
                    Сохранить
                  </button>
                  <button 
                    onClick={() => setIsEditingName(false)}
                    className="cancel-edit-button"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <p className="profile-name">
                <strong>Имя:</strong> {userData.name}
              </p>
            )}
            <p><strong>Email:</strong> {userData.email}</p>
          </div>
        )}
      </div>

      <div className="bookings-section">
        <h2>Мои бронирования</h2>
        
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : bookings.length === 0 ? (
          <p className="no-bookings">У вас нет активных бронирований</p>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <h3>{booking.title}</h3>
                  <span className={`status ${booking.status}`}>
                    {booking.status === "active" ? "Активно" : "Отменено"}
                  </span>
                </div>
                
                <div className="booking-details">
                  <p><strong>Кабинет:</strong> {booking.room}</p>
                  <p><strong>Дата:</strong> {moment(booking.startTime).format("DD.MM.YYYY")}</p>
                  <p><strong>Время:</strong> {moment(booking.startTime).format("HH:mm")} - {moment(booking.endTime).format("HH:mm")}</p>
                  {booking.description && (
                    <p><strong>Описание:</strong> {booking.description}</p>
                  )}
                </div>

                {booking.status === "active" && (
                  <button 
                    onClick={() => handleCancelBooking(booking.id)}
                    className="cancel-button"
                  >
                    Отменить бронирование
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;