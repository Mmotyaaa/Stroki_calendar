import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import BookingModal from './BookingModal';
import './Calendar.css';

const localizer = momentLocalizer(moment);
moment.updateLocale('ru', { week: { dow: 1 } });

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log("Проверка подключения к Firebase...");
    const testConnection = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'bookings'));
        console.log("Данные получены:", snapshot.docs.length, "бронирований");
      } catch (error) {
        console.error("Ошибка подключения:", error);
      }
    };
    testConnection();

    const q = query(collection(db, 'bookings'));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        try {
          const bookings = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.startTime && data.endTime && data.room && data.title) {
              bookings.push({
                id: doc.id,
                title: `${data.room} - ${data.title}`,
                start: data.startTime.toDate(),
                end: data.endTime.toDate(),
                allDay: false,
                resource: {
                  room: data.room,
                  userId: data.userId,
                  userName: data.userName,
                  description: data.description || 'Нет описания',
                  status: data.status || 'active'
                }
              });
            }
          });
          
          setEvents(bookings);
          setError(null);
        } catch (err) {
          console.error('Ошибка обработки данных:', err);
          setError('Ошибка загрузки данных');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Ошибка подписки:', err);
        setError('Ошибка соединения с сервером');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSelectSlot = (slotInfo) => {
    if (!auth.currentUser) {
      alert('Для бронирования необходимо авторизоваться');
      return;
    }

    if (moment(slotInfo.start).isBefore(moment(), 'day')) {
      alert('Нельзя бронировать на прошедшие даты');
      return;
    }

    setSelectedSlot(slotInfo);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = () => {
    alert('Бронирование успешно создано!');
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
    if (newView === Views.AGENDA) {
      setCurrentDate(new Date());
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (currentView === Views.AGENDA) {
      setCurrentView(Views.AGENDA);
    }
  };

  // Настройки отображения времени
  const minTime = new Date();
  minTime.setHours(8, 0, 0);

  const maxTime = new Date();
  maxTime.setHours(19, 30, 0);

  // Фильтрация событий для режима "Расписание"
  const filteredEvents = currentView === Views.AGENDA 
    ? events.filter(event => moment(event.start).isSame(currentDate, 'day'))
    : events;

  // Стилизация событий
  const eventStyleGetter = (event) => {
    const isCancelled = event.resource.status === 'cancelled';
    return {
      className: isCancelled ? 'cancelled' : '',
      style: {
        backgroundColor: isCancelled ? '#f5f5f5' : '#4CAF50',
        borderRadius: '3px',
        opacity: 0.9,
        color: isCancelled ? '#999' : 'white',
        border: '0px',
        display: 'block',
        padding: '2px 5px'
      }
    };
  };

  // Компонент для отображения события в календаре
  const CustomEvent = ({ event }) => (
    <div className="custom-event">
      <div className="event-title">{event.title}</div>
      {event.resource.description && (
        <div className="event-description">{event.resource.description}</div>
      )}
    </div>
  );

  // Компонент для отображения события в режиме расписания
  const CustomAgendaEvent = ({ event }) => {
    return (
      <div className="custom-agenda-event">
        <div className="agenda-event-header">
          <span className="agenda-event-title">{event.title}</span>
        </div>
        {event.resource.description && (
          <div className="agenda-event-description">
            {event.resource.description}
          </div>
        )}
        <div className="agenda-event-user">
          Забронировал: {event.resource.userName}
        </div>
      </div>
    );
  };

  const CustomAgendaHeader = () => {
    const dateLabel = moment(currentDate).format('dddd, D MMMM YYYY');
    return (
      <div className="custom-agenda-header">
        {dateLabel}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Загрузка календаря...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="calendar-container">
      <BigCalendar
        localizer={localizer}
        events={filteredEvents}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event) => {
          alert(
            `Кабинет: ${event.resource.room}\n` +
            `Событие: ${event.title}\n` +
            `Описание: ${event.resource.description}\n` +
            `Пользователь: ${event.resource.userName}\n` +
            `Время: ${moment(event.start).format('HH:mm')}-${moment(event.end).format('HH:mm')}\n` +
            `Статус: ${event.resource.status === 'active' ? 'Активно' : 'Отменено'}`
          );
        }}
        min={minTime}
        max={maxTime}
        style={{ height: '80vh' }}
        defaultView={Views.MONTH}
        view={currentView}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={handleNavigate}
        eventPropGetter={eventStyleGetter}
        components={{
          event: CustomEvent,
          agenda: {
            event: CustomAgendaEvent,
            header: CustomAgendaHeader,
            timeHeader: () => null,
            dateHeader: () => null,
            eventHeader: () => null
          },
          toolbar: (props) => (
            <div className={`rbc-toolbar ${isMobile ? 'mobile' : ''}`}>
              <span className="rbc-btn-group">
                <button type="button" onClick={handleToday}>
                  {isMobile ? 'Сег' : 'Сегодня'}
                </button>
                <button
                  type="button"
                  onClick={() => props.onNavigate('PREV')}
                >
                  {isMobile ? '←' : 'Назад'}
                </button>
                <button
                  type="button"
                  onClick={() => props.onNavigate('NEXT')}
                >
                  {isMobile ? '→' : 'Вперед'}
                </button>
              </span>
              <span className="rbc-toolbar-label">
                {props.label}
              </span>
              <span className="rbc-btn-group">
                <button
                  type="button"
                  className={currentView === Views.MONTH ? 'rbc-active' : ''}
                  onClick={() => props.onView(Views.MONTH)}
                >
                  {isMobile ? 'Мес' : 'Месяц'}
                </button>
                <button
                  type="button"
                  className={currentView === Views.WEEK ? 'rbc-active' : ''}
                  onClick={() => props.onView(Views.WEEK)}
                >
                  {isMobile ? 'Нед' : 'Неделя'}
                </button>
                <button
                  type="button"
                  className={currentView === Views.DAY ? 'rbc-active' : ''}
                  onClick={() => props.onView(Views.DAY)}
                >
                  {isMobile ? 'День' : 'День'}
                </button>
                <button
                  type="button"
                  className={currentView === Views.AGENDA ? 'rbc-active' : ''}
                  onClick={() => props.onView(Views.AGENDA)}
                >
                  {isMobile ? 'Рас' : 'Расписание'}
                </button>
              </span>
            </div>
          )
        }}
        views={{
          day: true,
          week: true,
          month: true,
          agenda: true
        }}
        messages={{
          allDay: 'Весь день',
          previous: 'Назад',
          next: 'Вперед',
          today: 'Сегодня',
          month: 'Месяц',
          week: 'Неделя',
          day: 'День',
          agenda: (date) => moment(date).format('dddd, D MMMM YYYY'),
          noEventsInRange: 'Нет бронирований',
          noEventsInRange: 'Нет бронирований',
          showMore: total => `+${total}`,
          date: 'Дата',
          time: 'Время',
          event: 'Событие'
        }}
      />

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookingSuccess={handleBookingSuccess}
        selectedDate={selectedSlot?.start}
      />
    </div>
  );
};

export default Calendar;