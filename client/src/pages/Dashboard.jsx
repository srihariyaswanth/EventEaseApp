import React from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizerDashboard from '../components/OrganizerDashboard';
import WorkerDashboard from '../components/WorkerDashboard';

// The onLogout function is passed down from App.jsx
const Dashboard = ({ user, onLogout }) => {
    const navigate = useNavigate();

    if (!user) {
        return <div>Loading dashboard...</div>;
    }

    const handleLogoutClick = () => {
        onLogout();
        navigate('/login'); // Redirect to login after logout
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Welcome, {user.name}</h1>
                <button onClick={handleLogoutClick} className="logout-button">
                    Logout
                </button>
            </header>
            <div className="dashboard-content">
                {user.role === 'organizer' ? <OrganizerDashboard /> : <WorkerDashboard />}
            </div>
        </div>
    );
};

export default Dashboard;