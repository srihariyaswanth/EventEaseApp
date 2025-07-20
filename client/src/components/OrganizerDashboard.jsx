import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const OrganizerDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', role: '', pay: '', location: '', time: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchJobs = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/jobs/organizer');
            setJobs(res.data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('http://localhost:5001/api/jobs', formData);
            setFormData({ title: '', description: '', role: '', pay: '', location: '', time: '' });
            fetchJobs();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post job.');
        }
    };
    
    return (
        <div className="organizer-layout">
            <section className="job-form-section">
                <h3>Post a New Job</h3>
                <form onSubmit={handleSubmit} className="job-form">
                    {error && <p className="error-message">{error}</p>}
                    <input type="text" name="title" placeholder="Job Title (e.g., 'Wedding Photographer')" value={formData.title} onChange={handleChange} required />
                    <textarea name="description" placeholder="Job Description" value={formData.description} onChange={handleChange} rows="4" required />
                    <input type="text" name="role" placeholder="Role (e.g., 'Photographer')" value={formData.role} onChange={handleChange} required />
                    <input type="number" name="pay" placeholder="Pay ($)" value={formData.pay} onChange={handleChange} required />
                    <input type="text" name="location" placeholder="Location (e.g., 'Grand Hyatt Ballroom')" value={formData.location} onChange={handleChange} required />
                    <input type="datetime-local" name="time" value={formData.time} onChange={handleChange} required />
                    <button type="submit" className="submit-job-button">Post Job</button>
                </form>
            </section>
            <section className="job-list-section">
                <h3>Your Posted Jobs</h3>
                <div className="job-listings-container">
                    {loading ? <p>Loading jobs...</p> :
                     jobs.length > 0 ? (
                        jobs.map(job => (
                            <Link to={`/jobs/${job._id}`} key={job._id} className="job-card-link">
                                <div className="job-card-organizer">
                                    <div className="job-card-header">
                                        <h4>{job.title}</h4>
                                        <span className={`job-status ${job.status}`}>{job.status}</span>
                                    </div>
                                    <p><strong>Role:</strong> {job.role}</p>
                                    <p><strong>Pay:</strong> ${job.pay}</p>
                                    <p><strong>Date:</strong> {new Date(job.time).toLocaleDateString()}</p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p>You have not posted any jobs yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default OrganizerDashboard;