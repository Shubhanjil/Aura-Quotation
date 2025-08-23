import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PageOne from './PageOne';
import PageTwo from './PageTwo';
import './App.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1 className="title">Welcome</h1>
      <button className="pastel-button" onClick={() => navigate('/page-one')}>Make Quotation</button>
      <button className="pastel-button" onClick={() => navigate('/page-two')}>Make  Invoice</button>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/page-one" element={<PageOne />} />
      <Route path="/page-two" element={<PageTwo />} />
    </Routes>
  );
}

export default App;
