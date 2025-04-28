import React, { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/ru";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import BookingModal from "./BookingModal";
import "./Calendar.css";

const localizer = momentLocalizer(moment);
moment.updateLocale("ru", { week: { dow: 1 } });

const messages = {
  allDay: "Весь день",
  previous: "Назад",
  next: "Вперед",
  today: "Сегодня",
  month: "Месяц",
  week: "Неделя",
  day: "День",
  agenda: "Событии дня",
  date: "Дата",
  time: "Время",
  event: "Событие",
  noEventsInRange: "Нет событий в диапазоне",
  showMore: (count) => `+${count} ещё`,
};

const formats = {
  timeGutterFormat: "HH:mm",
  eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
    `${localizer.format(start, "HH:mm", culture)} - ${localizer.format(end, "HH:mm", culture)}`,
  agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
    `${localizer.format(start, "HH:mm", culture)} - ${localizer.format(end, "HH:mm", culture)}`,
};

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Загрузка бронирований из Firebase
  useEffect(() => {
    const q = query(collection(db, "bookings"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookings = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          title: `${data.room} - ${data.title}`,
          start: new Date(data.startTime),
          end: new Date(data.endTime),
          allDay: false,
          resource: {
            room: data.room,
            userId: data.userId,
            userName: data.userName,
            description: data.description
          }
        });
      });
      setEvents(bookings);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectSlot = (slotInfo) => {
    if (!auth.currentUser) {
      setError("Бронировать кабинет может только авторизованный пользователь");
      setTimeout(() => setError(""), 3000);
      return;
    }
  
    // Проверка на прошедшую дату
    if (moment(slotInfo.start).isBefore(moment(), 'day')) {
      setError("Нельзя бронировать на прошедшие даты");
      setTimeout(() => setError(""), 3000);
      return;
    }
  
    setSelectedSlot({
      start: slotInfo.start,
      end: slotInfo.end
    });
    setIsModalOpen(true);
  };

  const handleCreateBooking = async (bookingData) => {
    const { title, description, room, startTime, endTime } = bookingData;
  
    // Проверка на пересечение бронирований (переписанная версия)
    const isOverlapping = events.some(event => {
      // Пропускаем проверку, если это другой кабинет
      if (event.resource.room !== room) return false;
  
      const existingStart = moment(event.start);
      const existingEnd = moment(event.end);
      const newStart = moment(startTime);
      const newEnd = moment(endTime);
  
      // Проверяем 4 возможных варианта пересечения:
      // 1. Новое событие начинается во время существующего
      // 2. Новое событие заканчивается во время существующего
      // 3. Новое событие полностью содержит существующее
      // 4. Новое событие полностью внутри существующего
      return (
        (newStart.isBetween(existingStart, existingEnd, null, '[)')) ||
        (newEnd.isBetween(existingStart, existingEnd, null, '(]')) ||
        (newStart.isSameOrBefore(existingStart) && newEnd.isSameOrAfter(existingEnd)) ||
        (newStart.isSameOrAfter(existingStart) && newEnd.isSameOrBefore(existingEnd))
      );
    });
  
    if (isOverlapping) {
      alert("Этот кабинет уже занят в выбранное время");
      return;
    }
  
    try {
      await addDoc(collection(db, "bookings"), {
        title,
        description,
        room,
        startTime: moment(startTime).toDate(),
        endTime: moment(endTime).toDate(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        status: "active",
        createdAt: new Date()
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Ошибка при бронировании:", err);
    }
  };

  const minTime = new Date();
  minTime.setHours(8, 0, 0);

  const maxTime = new Date();
  maxTime.setHours(18, 0, 0);

  return (
    <div className="calendar-container">
      {error && <div className="booking-error">{error}</div>}
      
      <BigCalendar
        localizer={localizer}
        messages={messages}
        formats={formats}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event) => alert(
          `Кабинет: ${event.resource.room}\n` +
          `Пользователь: ${event.resource.userName}\n` +
          `Описание: ${event.resource.description || 'нет'}`
        )}
        min={minTime}
        max={maxTime}
        style={{ height: "80vh" }}
      />

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateBooking}
        selectedDate={selectedSlot?.start}
      />
    </div>
  );
};

export default Calendar;