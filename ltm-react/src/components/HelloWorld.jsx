import React from 'react';

/**
 * HelloWorld - A simple component to demonstrate the library architecture
 */
const HelloWorld = ({ name = 'World' }) => {
  return (
    <div style={{
      padding: '20px',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      textAlign: 'center',
      backgroundColor: '#f0f8f0'
    }}>
      <h1 style={{ color: '#4CAF50', margin: 0 }}>
        Hello, {name}!
      </h1>
      <p style={{ color: '#666', marginTop: '10px' }}>
        This component is imported from the ltm-react library
      </p>
    </div>
  );
};

export default HelloWorld;
