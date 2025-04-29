import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import moment from 'moment';
import './BookingModal.css';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 19; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 19) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const BookingModal = ({ isOpen, onClose, onBookingSuccess, selectedDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('504');
  const [timeError, setTimeError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setRoom('504');
      setTimeError('');
      setBookingError('');
    }
  }, [isOpen]);

  const checkTimeConflict = (existingBookings, newStart, newEnd) => {
    return existingBookings.some(booking => {
      const bookingStart = booking.startTime.toDate();
      const bookingEnd = booking.endTime.toDate();
      return (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingError('');
    setTimeError('');

    if (!title.trim()) {
      setBookingError('Введите название события');
      setIsSubmitting(false);
      return;
    }

    if (moment(endTime, 'HH:mm').isSameOrBefore(moment(startTime, 'HH:mm'))) {
      setTimeError('Время окончания должно быть позже времени начала');
      setIsSubmitting(false);
      return;
    }

    const startDateTime = moment(selectedDate)
      .set({
        hour: parseInt(startTime.split(':')[0]),
        minute: parseInt(startTime.split(':')[1]),
        second: 0
      })
      .toDate();

    const endDateTime = moment(selectedDate)
      .set({
        hour: parseInt(endTime.split(':')[0]),
        minute: parseInt(endTime.split(':')[1]),
        second: 0
      })
      .toDate();

    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('room', '==', room),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const existingBookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (checkTimeConflict(existingBookings, startDateTime, endDateTime)) {
        setBookingError('Этот кабинет уже забронирован на выбранное время');
        setIsSubmitting(false);
        return;
      }

      // Create new booking
      await addDoc(collection(db, 'bookings'), {
        title,
        description,
        room,
        startTime: startDateTime,
        endTime: endDateTime,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        status: 'active',
        createdAt: new Date()
      });

      onBookingSuccess();
      onClose();
    } catch (error) {
      console.error('Booking error:', error);
      if (!bookingError) {
        setBookingError('Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Бронирование кабинета"
      ariaHideApp={false}
      className="booking-modal-container"
      overlayClassName="booking-modal-overlay"
    >
      <div className="booking-modal">
        <h2>Бронирование кабинета</h2>
        <p className="selected-date">
          Дата: {selectedDate ? moment(selectedDate).format('DD.MM.YYYY') : 'Не выбрано'}
        </p>

        {bookingError && (
          <div className="booking-error">
            <span className="error-icon">⚠️</span> {bookingError}
          </div>
        )}

        <form className="booking-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Название события"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="booking-input"
            disabled={isSubmitting}
          />

          <textarea
            placeholder="Описание события"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="booking-textarea"
            disabled={isSubmitting}
          />

          <div className="time-selection">
            <div className="time-select-group">
              <label>Время начала:</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="time-select"
                disabled={isSubmitting}
              >
                {timeSlots.map(time => (
                  <option key={`start-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="time-select-group">
              <label>Время окончания:</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="time-select"
                disabled={isSubmitting}
              >
                {timeSlots.map(time => (
                  <option
                    key={`end-${time}`}
                    value={time}
                    disabled={moment(time, 'HH:mm').isSameOrBefore(moment(startTime, 'HH:mm'))}
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
              disabled={isSubmitting}
            >
              <option value="504">504</option>
              <option value="505">505</option>
              <option value="510">510</option>
              <option value="511">511</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="booking-close"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="booking-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Забронировать'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BookingModal;