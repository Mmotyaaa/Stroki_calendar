import React, { useState } from "react";
import Header from "./components/Header";
import Calendar from "./components/Calendar";
import AuthModal from "./components/AuthModal";
import BookingModal from "./components/BookingModal";
import TitlePage from "./components/TitlePage";

const App = () => {
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showProject, setShowProject] = useState(false);

  return (
    <div className="App">
      {/* Если showProject === false, показываем титульную страницу */}
      {!showProject ? (
        <TitlePage onNavigate={() => setShowProject(true)} />
      ) : (
        <>
          {/* Шапка */}
          <Header onLoginClick={() => setAuthModalOpen(true)} />

          {/* Календарь */}
          <Calendar
            onSelectEvent={(date) => {
              setSelectedDate(date);
              setBookingModalOpen(true);
            }}
          />

          {/* Модальное окно авторизации */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />

          {/* Модальное окно бронирования */}
          <BookingModal
            isOpen={isBookingModalOpen}
            selectedDate={selectedDate}
            onClose={() => setBookingModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default App;