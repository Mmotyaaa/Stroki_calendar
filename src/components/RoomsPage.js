import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './RoomsPage.css';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'rooms'));
        const roomsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRooms(roomsData);
      } catch (error) {
        console.error("Error fetching rooms: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return <div className="loading">Загрузка кабинетов...</div>;
  }

  return (
    <div className="rooms-page">
      <h2>Список кабинетов</h2>
      
      <div className="rooms-list">
        {rooms.map(room => (
          <div key={room.id} className="room-card">
            <h3>Кабинет {room.number}</h3>
            <p>{room.description}</p>
            <p>Вместимость: {room.capacity} чел.</p>
            <p>Статус: {room.isActive ? 'Доступен' : 'Недоступен'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsPage;