import React from 'react';
import CookieConsent from 'react-cookie-consent';

const CookieBanner = () => {
  return (
    <CookieConsent
      location="bottom"
      buttonText="ACCEPT"
      declineButtonText="DECLINE"
      enableDeclineButton
      cookieName="thespinearchive_cookie_consent"
      style={{
        background: '#111',
        color: '#fff',
        borderTop: '2px solid #b30000',
        fontSize: '12px',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        zIndex: 99999
      }}
      buttonStyle={{
        backgroundColor: '#ffcc00',
        color: '#000',
        fontWeight: 'bold',
        borderRadius: '4px',
        padding: '8px 16px',
        fontSize: '10px',
        fontFamily: '"Press Start 2P", monospace',
        cursor: 'pointer'
      }}
      declineButtonStyle={{
        backgroundColor: '#333',
        color: '#fff',
        borderRadius: '4px',
        padding: '8px 16px',
        fontSize: '10px',
        fontFamily: '"Press Start 2P", monospace',
        cursor: 'pointer'
      }}
      expires={150}
    >
      We use cookies to analyze site traffic and display popular content via Google Analytics . 
      By accepting, you agree to our privacy policy.
    </CookieConsent>
  );
};

export default CookieBanner;