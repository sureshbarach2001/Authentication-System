// client/src/App.js
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Particles from 'react-particles';
import { tsParticles } from 'tsparticles-engine';
import { loadFull } from 'tsparticles';
import { ReactTyped } from 'react-typed';
import VanillaTilt from 'vanilla-tilt';
import Register from './components/Register';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';
import './App.css';

function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Changed initial to false (not null)
    const [statusMessage, setStatusMessage] = useState('');
    const taskCardRef = useRef(null);
    const tiltInstanceRef = useRef(null);

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken');
        console.log('Checking auth, token:', token);
        if (token) {
            try {
                const response = await axios.get('/auth/status', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Status response:', response.data);
                if (response.data.status === 'success') {
                    setIsAuthenticated(true);
                    setStatusMessage('Status check: Authenticated');
                    console.log('isAuthenticated set to true');
                } else {
                    setIsAuthenticated(false);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    setStatusMessage('Status check: Not authenticated');
                    console.log('isAuthenticated set to false');
                }
            } catch (err) {
                console.log('Status check error:', err.response?.data || err.message);
                setIsAuthenticated(false);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setStatusMessage(`Status check failed: ${err.response?.data?.message || 'Unknown error'}`);
                console.log('isAuthenticated set to false due to error');
            }
        } else {
            setIsAuthenticated(false);
            setStatusMessage('No token found');
            console.log('No token, isAuthenticated set to false');
        }
    };

    useEffect(() => {
        checkAuth();
    }, [location.pathname]);

    useEffect(() => {
        if (taskCardRef.current && location.pathname === '/') {
            tiltInstanceRef.current = VanillaTilt.init(taskCardRef.current, {
                max: 15,
                speed: 400,
                glare: true,
                'max-glare': 0.5,
            });
        }
        return () => {
            if (tiltInstanceRef.current && typeof tiltInstanceRef.current.destroy === 'function') {
                tiltInstanceRef.current.destroy();
                tiltInstanceRef.current = null;
            }
        };
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('/auth/logout', {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
            setStatusMessage(response.data.message);
            navigate('/login', { state: { message: 'Logged out successfully!' } });
        } catch (err) {
            setStatusMessage(`Logout failed: ${err.response?.data?.message || 'Unknown error'}`);
            alert('Logout failed: ' + (err.response?.data?.message || 'Unknown error'));
        }
    };

    const handleRefreshToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                setStatusMessage('No refresh token available');
                return;
            }
            const response = await axios.post('/auth/refresh', { refreshToken });
            const newAccessToken = response.data.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            setStatusMessage('Token refreshed successfully');
            await checkAuth(); // Re-check auth after refresh
        } catch (err) {
            setStatusMessage(`Refresh failed: ${err.response?.data?.message || 'Unknown error'}`);
        }
    };

    const handleStatusCheck = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setStatusMessage('No access token available');
                return;
            }
            const response = await axios.get('/auth/status', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMessage(`Status: ${response.data.message}`);
            setIsAuthenticated(true);
        } catch (err) {
            setStatusMessage(`Status check failed: ${err.response?.data?.message || 'Unknown error'}`);
            setIsAuthenticated(false);
        }
    };

    const particlesInit = async (engine) => {
        await loadFull(engine);
    };

    return (
        <div className="app">
            <Particles
                id="tsparticles"
                init={particlesInit}
                options={{
                    background: { color: { value: 'transparent' } },
                    fpsLimit: 60,
                    interactivity: {
                        events: {
                            onClick: { enable: true, mode: 'push' },
                            onHover: { enable: true, mode: 'repulse' },
                            resize: true,
                        },
                        modes: {
                            push: { quantity: 4 },
                            repulse: { distance: 100, duration: 0.4 },
                        },
                    },
                    particles: {
                        color: { value: '#00d4ff' },
                        links: { color: '#b3e5fc', distance: 150, enable: true, opacity: 0.5, width: 1 },
                        move: { direction: 'none', enable: true, outModes: 'bounce', random: false, speed: 2 },
                        number: { density: { enable: true, area: 800 }, value: 80 },
                        opacity: { value: 0.5 },
                        shape: { type: 'circle' },
                        size: { value: { min: 1, max: 5 } },
                    },
                    detectRetina: true,
                }}
                className="particles-bg"
            />
            <nav className="navbar">
                <div className="navbar-brand">
                    <h1 className="brand-title">AuthVerse</h1>
                </div>
                <ul className="navbar-links">
                    {!isAuthenticated ? (
                        <>
                            <li><Link to="/" className="nav-link">Home</Link></li>
                            <li><Link to="/register" className="nav-link">Register</Link></li>
                            <li><Link to="/login" className="nav-link">Login</Link></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/" className="nav-link">Home</Link></li>
                            {/* <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li> */}
                        </>
                    )}
                </ul>
            </nav>

            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/" element={
                    <div className="home-container">
                        <h1 className="home-title">
                            <ReactTyped
                                strings={['Welcome to AuthVerse', 'TechnoHacks Auth System']}
                                typeSpeed={50}
                                backSpeed={30}
                                loop
                            />
                        </h1>
                        <p className="home-subtitle">
                            {isAuthenticated ? 'Your secure space awaits!' : 'Register or login to experience secure authentication'}
                        </p>
                        <div className="task-card" ref={taskCardRef}>
                            <h3 className="task-header">TechnoHacks Internship Task k</h3>
                            <p className="task-text">
                                A proud creation for <strong>TechnoHacks</strong>, where I’m interning. 
                                This authentication system is built with:
                            </p>
                            <ul className="task-list">
                                <li><strong>Front-end</strong>: React with registration and login forms.</li>
                                <li><strong>Back-end</strong>: Node.js/Express with routes for register, login, logout, status, and refresh.</li>
                                <li><strong>Database</strong>: MongoDB for secure user data storage.</li>
                                <li><strong>Auth</strong>: Passport.js with JWT for secure authentication.</li>
                                <li><strong>Caching</strong>: Redis for enhanced performance.</li>
                            </ul>
                            <p className="task-status">Status: <span className="completed">Completed</span></p>
                            {isAuthenticated && (
                                <div className="test-buttons">
                                    <button onClick={handleStatusCheck} className="test-btn">Check Status</button>
                                    <button onClick={handleRefreshToken} className="test-btn">Refresh Token</button>
                                    <button onClick={handleLogout} className="test-btn">Logout</button>
                                </div>
                            )}
                            <p className="status-message">{statusMessage}</p>
                        </div>
                    </div>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <div className="dashboard-container">
                            <h1 className="dashboard-title">Your Dashboard</h1>
                            <p className="dashboard-text">Welcome to your protected realm! Enjoy secure access.</p>
                            <div className="test-buttons">
                                <button onClick={handleStatusCheck} className="test-btn">Check Status</button>
                                <button onClick={handleRefreshToken} className="test-btn">Refresh Token</button>
                                <button onClick={handleLogout} className="test-btn">Logout</button>
                            </div>
                            <p className="status-message">{statusMessage}</p>
                        </div>
                    </ProtectedRoute>
                } />
                <Route path="*" element={<div className="not-found">404 - Lost in the Void</div>} />
            </Routes>

            <footer className="footer">
                <p>© 2025 TechnoHacks Internship | Built by <strong>Suresh Kumar</strong> with Passion</p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;