import { Route, Routes } from "react-router-dom";
import { TimingGates } from "./pages/TimingGates";
import React from 'react';
import { ToastProvider } from "@heroui/react";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<TimingGates />} />
    </Routes>
  );
};

export default App;
