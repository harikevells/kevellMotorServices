import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, CheckCircle, Wrench } from 'lucide-react';
import axios from 'axios';
import './Login.css';

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
                localStorage.setItem('token', token);
                localStorage.setItem('adminUser', JSON.stringify(user));
                onLoginSuccess(user, token);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            {/* Left Side: Branding & Illustration */}
            <div className="login-left">
                {/* <div className="brand-logo">
                    <div className="logo-icon-wrapper">
                        <Wrench size={32} color="#c9992a" />
                    </div>
                    <div>
                        <h1>Kevell</h1>
                        <p>Motor Services</p>
                    </div>
                </div>
                
                <div className="slogan">
                    "Reliable Automotive Solutions for Every Journey"
                </div> */}

                <div className="illustration-container">
                    <img 
                        src="/assets/car_repair_illustration.png" 
                        alt="Kevell Service" 
                        className="illustration-image"
                        onError={(e) => {
                            e.target.src = "https://img.freepik.com/free-vector/mechanic-repairing-car-workshop_23-2148281144.jpg";
                        }}
                    />
                </div>

                {/* <div className="login-footer">
                    designed and engineered by <strong>haspr</strong>
                </div> */}
            </div>

            {/* Right Side: Login Form */}
            <div className="login-right">
                <div className="login-form-container">
                    <div className="login-header">
                        <h2>Admin</h2>
                        {/* <p>Attendance</p> */}
                    </div>

                    {/* <div className="login-divider"></div> */}

                    {/* <p className="form-instruction">Enter Your Admin Credentials Below</p> */}

                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="login-input-group">
                            <input
                                type="email"
                                className="login-input"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="login-input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="login-input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div 
                                className="password-toggle-icon" 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="login-btn" 
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Confirm'}
                        </button>
                    </form>

                    <div className="secondary-action">
                        Sign in instead
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
