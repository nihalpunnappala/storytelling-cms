import React from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
      <div className={`bg-bg-white rounded-xl shadow-xl w-full ${maxWidth} mx-4 relative transform transition-all duration-300 ease-out`} style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between p-4 border-b border-stroke-soft">
          <h3 className="text-lg font-semibold text-text-main">{title}</h3>
          <button onClick={onClose} className="text-text-sub hover:text-text-main transition-colors duration-150 p-2 rounded-full hover:bg-bg-weak" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
