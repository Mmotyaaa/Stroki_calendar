import React from "react";
import Modal from "react-modal";
import "./AuthModal.css";
import logo from "../img/stroki.svg";

const AuthModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} contentLabel="Авторизация">
      <div className="auth-modal">
        <h2>Вход в систему</h2>
        <form className="auth-form">
          <input type="text" placeholder="Логин" required className="auth-input" />
          <input type="password" placeholder="Пароль" required className="auth-input" />
          <button type="submit" className="auth-submit">Войти</button>
          <button onClick={onClose} className="auth-close">Закрыть</button>
        </form>
        <img src={logo} alt="Строки" className="auth-logo"/>
      </div>
    </Modal>
  );
};

export default AuthModal;