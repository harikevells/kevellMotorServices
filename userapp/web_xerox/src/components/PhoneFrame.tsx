import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: "'Nunito', sans-serif"
    }}>
      {/* Phone Frame */}
      <div style={{
        width: '320px',
        height: '640px',
        backgroundColor: '#000',
        borderRadius: '40px',
        padding: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Status Bar */}
        <div style={{
          height: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          color: '#000',
          backgroundColor: '#fff',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {/* Signal Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 22h20V2z" />
            </svg>
            {/* Wifi Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21l-12-18h24z" />
            </svg>
            {/* Battery Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-1 11H8V8h8v8z" />
            </svg>
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          backgroundColor: '#fff',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px',
          overflowY: 'auto',
          position: 'relative',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PhoneFrame;
