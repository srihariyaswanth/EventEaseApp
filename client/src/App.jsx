import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import JobDetails from './pages/JobDetails';
import axios from 'axios';
import './App.css';

function App() {
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const storedToken = sessionStorage.getItem('token');
            if (storedToken) {
                try {
                    axios.defaults.headers.common['x-auth-token'] = storedToken;
                    const res = await axios.get('http://localhost:5001/api/auth/me');
                    setUser(res.data);
                } catch (err) {
                    sessionStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, [token]);

    const handleLogin = (userData, authToken) => {
        sessionStorage.setItem('token', authToken);
        setToken(authToken);
        setUser(userData);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setToken(null);
        setUser(null);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="app-wrapper">
            <Router>
                <Navbar user={user} />
                <main className="container">
                    <Routes>
                        <Route path="/" element={<Home user={user} />} />
                        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
                        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
                        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
                        <Route path="/jobs/:jobId" element={user && user.role === 'organizer' ? <JobDetails /> : <Navigate to="/dashboard" />} />
                    </Routes>
                </main>
            </Router>
        </div>
    );
}

export default App;
