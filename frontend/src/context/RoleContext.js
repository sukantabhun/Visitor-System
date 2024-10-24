import React, { createContext, useState } from 'react';


export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState('operator'); 

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};
