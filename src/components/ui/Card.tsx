import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  glass = false,
  ...props 
}) => {
  return (
    <div 
      className={`${styles.card} ${glass ? styles.glass : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
