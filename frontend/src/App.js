
import './App.css';
import { AuthProvider } from './Components/authContext';
import { MainRoutes } from './Components/MainRoutes';
import { Navbar } from './Components/Navbar';
import { Footer } from './Components/Footer';
import React from 'react';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <MainRoutes />
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
