// client/src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css'; // Import App.css for shared styles

function Login({ setIsAuthenticated }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value.trim() }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await axios.post('/auth/login', formData);
            localStorage.setItem('accessToken', response.data.data.accessToken);
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
            setIsAuthenticated(true);
            const from = location.state?.from || '/';
            navigate(from, { replace: true });
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
            console.error('Login error:', {
                message: err.response?.data?.message,
                status: err.response?.status,
                data: err.response?.data
            });
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Enter AuthVerse</h2>
                {error && <p className="error-message">{error}</p>}
                {location.state?.message && (
                    <p className="success-message">{location.state.message}</p>
                )}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="submit-btn">Login Now</button>
                </form>
            </div>
        </div>
    );
}

export default Login;