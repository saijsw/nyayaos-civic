import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

const sizes = { sm: 20, md: 32, lg: 48 };

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text, fullPage }) => {
  const s = sizes[size];
  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        className="spinner"
        style={{ width: s, height: s, borderWidth: size === 'sm' ? 2 : 3 }}
      />
      {text && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh',
      }}>
        {spinner}
      </div>
    );
  }
  return spinner;
};

export default LoadingSpinner;
