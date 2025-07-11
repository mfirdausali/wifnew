import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Modal.module.css';
import { FiX } from 'react-icons/fi';
import FocusTrap from 'focus-trap-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  animate?: boolean;
  zIndex?: number;
  draggable?: boolean;
  showCloseButton?: boolean;
  focusTrap?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  animate = true,
  zIndex = 50,
  draggable = false,
  showCloseButton = true,
  focusTrap = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Handle ESC key
  useEffect(() => {
    if (isOpen && closeOnEsc) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable || !modalRef.current) return;
    
    isDragging.current = true;
    const rect = modalRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, [draggable]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !modalRef.current) return;
    
    modalRef.current.style.left = `${e.clientX - dragOffset.current.x}px`;
    modalRef.current.style.top = `${e.clientY - dragOffset.current.y}px`;
    modalRef.current.style.transform = 'none';
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    if (draggable) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggable, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`${styles.modalContainer} ${className}`}
      style={{ zIndex }}
    >
      {/* Overlay */}
      <motion.div
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: 1 } : undefined}
        exit={animate ? { opacity: 0 } : undefined}
        className={`${styles.overlay} ${overlayClassName}`}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Content */}
      <motion.div
        ref={modalRef}
        initial={animate ? { opacity: 0, scale: 0.95 } : undefined}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        exit={animate ? { opacity: 0, scale: 0.95 } : undefined}
        transition={{ duration: 0.2 }}
        className={`${styles.content} ${styles[size]} ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={draggable ? handleMouseDown : undefined}
        style={{ cursor: draggable ? 'move' : 'default' }}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        )}
        {children}
      </motion.div>
    </div>
  );

  const wrappedContent = focusTrap ? (
    <FocusTrap active={isOpen}>
      {modalContent}
    </FocusTrap>
  ) : modalContent;

  return typeof window !== 'undefined' ? createPortal(
    <AnimatePresence>
      {isOpen && wrappedContent}
    </AnimatePresence>,
    document.body
  ) : null;
};

// Modal sub-components
export const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`${styles.header} ${className}`}>
    {children}
  </div>
);

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`${styles.body} ${className}`}>
    {children}
  </div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`${styles.footer} ${className}`}>
    {children}
  </div>
);