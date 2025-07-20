import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WorkerDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appliedJobs, setAppliedJobs] = useState(new Set());

    const handleApply = async (jobId) => {
        try {
            await axios.post('http://localhost:5001/api/applications', { jobId });
            setAppliedJobs(prev => new Set(prev).add(jobId));
        } catch (err) {
            if (err.response && err.response.status === 400) {
                alert('You have already applied for this job.');
                setAppliedJobs(prev => new Set(prev).add(jobId));
            } else {
                console.error('Failed to apply for job', err);
                alert('An error occurred while applying.');
            }
        }
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/jobs');
                setJobs(res.data);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    return (
        <div className="worker-layout">
            <h2>Available Jobs</h2>
            <div className="job-listings-container">
                 {loading ? <p>Loading jobs...</p> :
                  jobs.length > 0 ? (
                    jobs.map(job => (
                        <div key={job._id} className="job-card-worker">
                            <div className="job-card-main">
                                <h3>{job.title}</h3>
                                <p className="job-organizer">Posted by: {job.organizer.name}</p>
                                <div className="job-details-grid">
                                    <p><strong>Role:</strong> {job.role}</p>
                                    <p><strong>Location:</strong> {job.location}</p>
                                    <p><strong>Date:</strong> {new Date(job.time).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="job-card-apply">
                                <p className="job-pay">${job.pay}</p>
                                <button 
                                    onClick={() => handleApply(job._id)} 
                                    className="apply-button"
                                    disabled={appliedJobs.has(job._id)}
                                >
                                    {appliedJobs.has(job._id) ? 'Applied' : 'Apply Now'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No open jobs available at the moment. Check back soon!</p>
                )}
            </div>
        </div>
    );
};

export default WorkerDashboard;
