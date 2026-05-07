import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import './Login.css';

// Assets
import clouds from '../../assets/logincloude.png';
import downImage from '../../assets/logindownimage.png';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password,
                role: 'admin'
            });

            if (response.data.success) {
                const { token, user } = response.data;
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('adminUser', JSON.stringify(user));
                onLoginSuccess(user, token);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-full-page">
            {/* Background Decorations */}
            <div className="background-decorations">
                <img src={clouds} alt="" className="cloud cloud-1" />
                <img src={clouds} alt="" className="cloud cloud-2" />
                <img src={downImage} alt="" className="street-landscape" />
                <div className="road-line">
                    <div className="moving-car">
                        <svg width="60" height="30" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 40H110V50H10V40Z" fill="#151515"/>
                            <path d="M15 40L25 20H85L100 40H15Z" fill="#f28b2c"/>
                            <path d="M30 23L35 23L35 35L20 35L30 23Z" fill="#333"/>
                            <path d="M40 23H60V35H40V23Z" fill="#333"/>
                            <path d="M65 23H80L82 35H65V23Z" fill="#333"/>
                            <circle cx="30" cy="48" r="8" fill="#111" stroke="#333" strokeWidth="2"/>
                            <circle cx="85" cy="48" r="8" fill="#111" stroke="#333" strokeWidth="2"/>
                            <circle cx="30" cy="48" r="3" fill="#444"/>
                            <circle cx="85" cy="48" r="3" fill="#444"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Login Card */}
            <div className="login-card">
                <div className="login-card-content">
                    <h1 className="card-title">Let's Get Started</h1>
                    <p className="card-subtitle">Sign into continue to DRZEUS</p>

                    {error && <div className="login-error-msg">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form-custom">
                        {/* User Name Input */}
                        <div className="custom-input-group">
                            <fieldset className="custom-fieldset">
                                <legend className="custom-legend">User Name</legend>
                                <input
                                    type="email"
                                    className="custom-field-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </fieldset>
                        </div>

                        {/* Password Input */}
                        <div className="custom-input-group password-input-container">
                            <fieldset className="custom-fieldset">
                                <legend className="custom-legend">Pass Word</legend>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="custom-field-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </fieldset>
                            <div 
                                className="password-toggle-custom" 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" />
                                <span>Remember Me</span>
                            </label>
                            <a href="#reset" className="forgot-password">
                                <Lock size={14} className="lock-icon" />
                                Forgot Password?
                            </a>
                        </div>

                        <button 
                            type="submit" 
                            className="sign-in-btn-orange" 
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
