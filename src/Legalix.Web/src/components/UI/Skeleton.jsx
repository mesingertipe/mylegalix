import React from 'react';

const Skeleton = ({ width, height, borderRadius = '12px', style }) => {
  return (
    <div 
      className="skeleton" 
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius,
        ...style 
      }} 
    />
  );
};

export default Skeleton;
