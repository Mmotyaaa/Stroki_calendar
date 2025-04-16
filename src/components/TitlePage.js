import React from "react";
import "./TitlePage.css";
import logo from "../img/stroki.svg";

const TitlePage = ({ onNavigate }) => {
  return (
    <div className="title-page">
      <div className="title-content">
        <div className="logo">
          <img src={logo} alt="Логотип" />
        </div>

        <div className="title">
          <h1>Информационная система для компании “Stroki” с различными уровнями доступа</h1>
        </div>

        <div className="button-container">
          <button onClick={onNavigate}>Перейти на сайт</button>
        </div>
        

        <div className="author-info">
          <p>Выполнил: Студент группы 1-ИС Кривов Матвей Леонидович</p>
          <p>Специальность: 09.02.07 информационные системы и программирование</p>
        </div>

        <div className="data">
          <p>Пермь, {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default TitlePage;