"use client";

import { createContext, useContext } from "react";

// Template state context
const TemplateContext = createContext(null);

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplate must be used within a TemplateProvider");
  }
  return context;
};

export default TemplateContext; 