import React from "react";
import "./Header.css";

const Header = ({ onLoginClick }) => {
  return (
    <header className="header">
      <h1>Система бронирования</h1>
      <button onClick={onLoginClick} className="login-button">Войти</button>
    </header>
  );
};

export default Header;