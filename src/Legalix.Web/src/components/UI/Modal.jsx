import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth }}>
        <div className="modal-header">
          <h2 className="header-title" style={{ fontSize: '1.3rem', letterSpacing: '-0.02em' }}>{title}</h2>
          <button onClick={onClose} className="btn-icon">
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.getElementById('modal-root')
  );
};

export default Modal;
