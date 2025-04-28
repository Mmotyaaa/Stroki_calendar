import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import moment from "moment";
import "./BookingModal.css";
import logo from "../img/stroki.svg";

// Генерация временных слотов с интервалом в 30 минут
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 20; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const BookingModal = ({ isOpen, onClose, onCreate, selectedDate }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [room, setRoom] = useState("504");
  const [timeError, setTimeError] = useState("");

  useEffect(() => {
    // Сброс времени при открытии модального окна
    if (isOpen) {
      setStartTime("09:00");
      setEndTime("10:00");
      setTimeError("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("Введите название события");
      return;
    }

    // Проверка, что время окончания позже времени начала
    if (moment(endTime, "HH:mm").isSameOrBefore(moment(startTime, "HH:mm"))) {
      setTimeError("Время окончания должно быть позже времени начала");
      return;
    }

    const startDateTime = moment(selectedDate)
      .set({
        hour: parseInt(startTime.split(':')[0]),
        minute: parseInt(startTime.split(':')[1]),
        second: 0
      });
      
    const endDateTime = moment(selectedDate)
      .set({
        hour: parseInt(endTime.split(':')[0]),
        minute: parseInt(endTime.split(':')[1]),
        second: 0
      });

    onCreate({
      title,
      description,
      room,
      startTime: startDateTime.toDate(),
      endTime: endDateTime.toDate()
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onRequestClose={onClose} 
      contentLabel="Бронирование"
      ariaHideApp={false}
      className="booking-modal-container"
      overlayClassName="booking-modal-overlay"
    >
      <div className="booking-modal">
        <h2>Бронирование кабинета</h2>
        <p className="selected-date">
          Дата: {selectedDate ? moment(selectedDate).format("DD.MM.YYYY") : "Не выбрано"}
        </p>
        
        <form className="booking-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Название события" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
            className="booking-input" 
          />
          
          <textarea 
            placeholder="Описание события" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="booking-textarea"
          />

          <div className="time-selection">
            <div className="time-select-group">
              <label>Время начала:</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="time-select"
              >
                {timeSlots.map(time => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="time-select-group">
              <label>Время окончания:</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="time-select"
              >
                {timeSlots.map(time => (
                  <option 
                    key={`end-${time}`} 
                    value={time}
                    disabled={moment(time, "HH:mm").isSameOrBefore(moment(startTime, "HH:mm"))}
                  >
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {timeError && <div className="time-error">{timeError}</div>}

          <div className="room-selection">
            <label>Кабинет:</label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="booking-input"
            >
              <option value="504">504</option>
              <option value="505">505</option>
              <option value="510">510</option>
              <option value="511">511</option>
            </select>
          </div>

          <div className="modal-buttons">
            <button type="submit" className="booking-submit">
              Забронировать
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="booking-close"
            >
              Отмена
            </button>
          </div>
        </form>
        
        <img src={logo} alt="Строки" className="auth-logo"/>
      </div>
    </Modal>
  );
};

export default BookingModal;