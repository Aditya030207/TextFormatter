import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TextManager from './components/TextManager';
import './index.css';

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <main className="container">
        <TextManager />
      </main>
    </>
  );
}

export default App;
