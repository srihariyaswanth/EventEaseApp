import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  // DEBUG: This will show in the console if the component is rendering.
  console.log('Login component has rendered.');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    // DEBUG: This will show if the form's onSubmit event is firing.
    console.log('Form submitted!');
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', formData);
      console.log('Login successful:', response.data);
      onLogin(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to log in. Please check your credentials.');
    }
  };

  const handleButtonClick = () => {
      // DEBUG: This is the most direct test. Does the button click itself do anything?
      console.log('Login button was clicked!');
  }

  return (
    <div className="form-container">
      <h2>Login to your Account</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        {/* We add an onClick to the button for direct debugging */}
        <button type="submit" onClick={handleButtonClick}>Login</button>
      </form>
    </div>
  );
};

export default Login;
