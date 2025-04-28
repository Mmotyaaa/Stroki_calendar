import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import moment from "moment";
import "./AccountPage.css";

const AccountPage = () => {
  const [userData, setUserData] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Загрузка данных пользователя
    setUserData({
      email: auth.currentUser.email,
      name: auth.currentUser.displayName || "Не указано",
      isActive: true // Здесь нужно подключить реальную проверку из вашей БД
    });

    // Загрузка бронирований пользователя
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", auth.currentUser.uid),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userBookings = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userBookings.push({
          id: doc.id,
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate()
        });
      });
      setBookings(userBookings);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="account-page">
      {userData && (
        <div className="profile-section">
          <h2>Профиль</h2>
          <div className="profile-info">
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>ФИО:</strong> {userData.name}</p>
            <p>
              <strong>Статус:</strong> 
              <span className={`status ${userData.isActive ? 'confirmed' : 'unconfirmed'}`}>
                {userData.isActive ? 'Подтвержден' : 'Не подтвержден'}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="bookings-section">
        <h2>Мои бронирования</h2>
        {bookings.length === 0 ? (
          <p>У вас нет активных бронирований</p>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <h3>{booking.title}</h3>
                <p><strong>Кабинет:</strong> {booking.room}</p>
                <p><strong>Дата:</strong> {moment(booking.startTime).format("DD.MM.YYYY")}</p>
                <p><strong>Время:</strong> {moment(booking.startTime).format("HH:mm")} - {moment(booking.endTime).format("HH:mm")}</p>
                {booking.description && <p><strong>Описание:</strong> {booking.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;