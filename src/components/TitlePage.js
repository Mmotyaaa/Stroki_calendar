// TitlePage.js
import React from "react";
import "./TitlePage.css";
import logo from "../img/stroki.svg";

const TitlePage = ({ onNavigate }) => {
  return (
    <div className="title-page">
      <div className="background-animation">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="title-content">
        <div className="header-section">
          <p className="institution">ГБПОУ «Пермский краевой колледж «Оникс»</p>
        </div>
        
        <div className="logo-container">
          <img src={logo} alt="Логотип" className="logo" />
        </div>

        <div className="main-title">
          <h1>Информационная система для компании “Stroki”</h1>
          <p className="subtitle">с различными уровнями доступа</p>
        </div>

        <div className="action-button">
          <button onClick={onNavigate}>
            <span>Перейти на сайт</span>
            <svg width="13px" height="10px" viewBox="0 0 13 10">
              <path d="M1,5 L11,5"></path>
              <polyline points="8 1 12 5 8 9"></polyline>
            </svg>
          </button>
        </div>
        
        <div className="footer-section">
          <div className="author-info">
            <p>Выполнил: Студент группы 1-ИС Кривов Матвей Леонидович</p>
            <p>Специальность: 09.02.07 Информационные системы и программирование</p>
          </div>
          <div className="year">{new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  );
};

export default TitlePage;