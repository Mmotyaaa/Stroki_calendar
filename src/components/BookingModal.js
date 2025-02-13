import React, { useState } from "react";
import Modal from "react-modal";
import "./BookingModal.css";
import logo from "../img/stroki.svg";

const BookingModal = ({ isOpen, onClose, selectedDate }) => {
  const [eventDuration, setEventDuration] = useState(1); // Состояние для продолжительности
  const [selectedRoom, setSelectedRoom] = useState("504"); // Состояние для выбранного кабинета

  const handleDurationChange = (e) => {
    setEventDuration(e.target.value);
  };

  const handleRoomChange = (e) => {
    setSelectedRoom(e.target.value);
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} contentLabel="Бронирование">
      <div className="booking-modal">
        <h2>Бронирование кабинета</h2>
        <p className="selected-date">Выбрана дата: {selectedDate ? selectedDate.toString() : "Не выбрано"}</p>
        <form className="booking-form">
          <input type="text" placeholder="Название события" required className="booking-input" />
          <textarea placeholder="Описание события" required className="booking-textarea"></textarea>

          {/* Поле для продолжительности */}
          <label htmlFor="event-duration">Продолжительность (часы):</label>
          <input
            type="number"
            id="event-duration"
            value={eventDuration}
            onChange={handleDurationChange}
            min="1"
            max="12"
            required
            className="booking-input"
          />

          {/* Выпадающий список для выбора кабинета */}
          <label htmlFor="room-select">Выбор кабинета:</label>
          <select
            id="room-select"
            value={selectedRoom}
            onChange={handleRoomChange}
            className="booking-input"
          >
            <option value="504">504</option>
            <option value="505">505</option>
            <option value="510">510</option>
            <option value="511">511</option>
          </select>

          <button type="submit" className="booking-submit">Сохранить</button>
          <button onClick={onClose} className="booking-close">Закрыть</button>
        </form>
        <img src={logo} alt="Строки" className="auth-logo"/>
      </div>
    </Modal>
  );
};

export default BookingModal;