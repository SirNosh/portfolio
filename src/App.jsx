import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Research from './pages/Research';
import Work from './pages/Work';
import Projects from './pages/Projects';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/research" element={<Research />} />
        <Route path="/work" element={<Work />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </Router>
  );
}

export default App;
