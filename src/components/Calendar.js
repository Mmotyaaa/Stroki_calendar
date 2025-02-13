import React from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/ru";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";

const localizer = momentLocalizer(moment);
moment.updateLocale("ru", { week: { dow: 1 } }); // Неделя начинается с понедельника

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

const Calendar = ({ onSelectEvent }) => {
  const events = [
    {
      title: "Пример события",
      start: new Date(),
      end: new Date(new Date().setHours(new Date().getHours() + 1)),
    },
  ];

  const minTime = new Date();
  minTime.setHours(8, 0, 0);

  const maxTime = new Date();
  maxTime.setHours(18, 0, 0);

  return (
    <div className="calendar-container">
      <BigCalendar
        localizer={localizer}
        messages={messages}
        formats={formats}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={(slotInfo) => onSelectEvent(slotInfo.start)}
        onSelectEvent={(event) => alert(event.title)}
        min={minTime}
        max={maxTime}
      />
    </div>
  );
};

export default Calendar;