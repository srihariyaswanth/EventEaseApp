import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const JobDetails = () => {
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobData = async () => {
        setLoading(true);
        try {
            const jobRes = await axios.get(`http://localhost:5001/api/jobs/${jobId}`);
            const appRes = await axios.get(`http://localhost:5001/api/applications/job/${jobId}`);
            setJob(jobRes.data);
            setApplications(appRes.data);
        } catch (err) {
            console.error("Failed to fetch job details", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobData();
    }, [jobId]);

    const handleUpdateStatus = async (appId, status) => {
        try {
            await axios.put(`http://localhost:5001/api/applications/${appId}`, { status });
            fetchJobData();
        } catch (err) {
            console.error(`Failed to ${status} application`, err);
        }
    };

    if (loading) return <p>Loading job details...</p>;
    if (!job) return <p>Job not found.</p>;

    return (
        <div className="job-details-page">
            <Link to="/dashboard" className="back-link">&larr; Back to Dashboard</Link>
            <header className="job-details-header">
                <h2>{job.title}</h2>
                <span className={`job-status ${job.status}`}>{job.status}</span>
            </header>
            
            <h3>Applicants</h3>
            <div className="applicants-list">
                {applications.length > 0 ? (
                    applications.map(app => (
                        <div key={app._id} className="applicant-card">
                            <div className="applicant-info">
                                <strong>{app.worker.name}</strong>
                                <span>{app.worker.email}</span>
                            </div>
                            <div className="applicant-status">
                                <p>Status: <span className={`status-${app.status}`}>{app.status}</span></p>
                            </div>
                            {job.status === 'open' && app.status === 'pending' && (
                                <div className="applicant-actions">
                                    <button onClick={() => handleUpdateStatus(app._id, 'accepted')} className="btn-accept">Accept</button>
                                    <button onClick={() => handleUpdateStatus(app._id, 'rejected')} className="btn-reject">Reject</button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No one has applied for this job yet.</p>
                )}
            </div>
        </div>
    );
};

export default JobDetails;