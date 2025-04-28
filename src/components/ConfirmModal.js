import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <p className="confirm-message">{message}</p>
        <div className="confirm-buttons">
          <button 
            className="confirm-button confirm-button--cancel"
            onClick={onClose}
          >
            Нет
          </button>
          <button 
            className="confirm-button confirm-button--confirm"
            onClick={onConfirm}
          >
            Да
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;