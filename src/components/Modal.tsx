import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  maxWidthClass?: string; // defaults to 'max-w-md'
  glowClass?: string; // defaults to 'bg-orange-900/10'
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  maxWidthClass = 'max-w-md',
  glowClass = 'bg-orange-900/10',
  children,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-955/80 backdrop-blur-md"
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full ${maxWidthClass} p-6 relative overflow-hidden font-sans my-8`}>
        {/* Abstract glowing bubble */}
        <div className={`absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full ${glowClass} blur-[80px] pointer-events-none`} />
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-450 hover:text-white text-sm cursor-pointer focus:outline-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  </div>
  );
};
