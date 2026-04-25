import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { createTechnician, deleteTechnician, getTechnicians, updateTechnician, updateTechnicianStatus } from '../services/technicianService';

const SPECIALIZATION_OPTIONS = [
  'Electrical',
  'Network',
  'Hardware',
  'Software',
  'Maintenance',
];

function TechniciansPage() {
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    password: '',
    confirmPassword: '',
  });

  const loadTechnicians = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getTechnicians();
      setTechnicians(data);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load technicians.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicians();
  }, []);

  const handleCreate = () => {
    setEditingTechnician(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      password: '',
      confirmPassword: '',
    });
    setShowModal(true);
  };

  const handleEdit = (technician) => {
    setEditingTechnician(technician);
    setFormData({
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      specialization: technician.specialization || '',
      password: '',
      confirmPassword: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this technician?')) {
      return;
    }

    try {
      await deleteTechnician(id);
      await loadTechnicians();
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete technician.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateTechnicianStatus(id, status);
      await loadTechnicians();
    } catch (statusError) {
      setError(statusError.message || 'Failed to update technician status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTechnician) {
        await updateTechnician(editingTechnician.id, formData);
      } else {
        await createTechnician(formData);
      }
      setShowModal(false);
      await loadTechnicians();
    } catch (submitError) {
      setError(submitError.message || 'Failed to save technician.');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <main className="ticket-page">
      <header className="ticket-page-head">
        <div>
          <p className="home-kicker">Maintenance & Incident Ticketing</p>
          <h1>Technician Management</h1>
          <p>Manage technicians for ticket assignment and maintenance tasks.</p>
        </div>
        <button type="button" className="ticket-link-btn ghost-btn" onClick={handleCreate}>
          Add Technician
        </button>
      </header>

      <section className="ticket-table-panel">
        {isLoading ? <p>Loading technicians...</p> : null}
        {!isLoading && error ? <p className="field-error">{error}</p> : null}
        {!isLoading && !error && technicians.length === 0 ? <p>No technicians found.</p> : null}

        {!isLoading && technicians.length > 0 ? (
          <div className="ticket-table-wrap">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Specialization</th>
                  <th>Status</th>
                  <th>Assigned Tickets</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((technician) => (
                  <tr key={technician.id}>
                    <td>{technician.name}</td>
                    <td>{technician.email}</td>
                    <td>{technician.phone}</td>
                    <td>{technician.specialization || '-'}</td>
                    <td>
                      <span className={`status-badge status-${technician.status.toLowerCase()}`}>
                        {technician.status}
                      </span>
                    </td>
                    <td>{technician.assignedTicketIds?.length || 0}</td>
                    <td>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => handleEdit(technician)}
                        >
                          Edit
                        </button>
                        <select
                          value={technician.status}
                          onChange={(e) => handleStatusChange(technician.id, e.target.value)}
                          className="ghost-btn"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="ON_LEAVE">On Leave</option>
                        </select>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => handleDelete(technician.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingTechnician ? 'Edit Technician' : 'Add Technician'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="specialization">Specialization *</label>
                <select
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Specialization</option>
                  {SPECIALIZATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingTechnician}
                  placeholder={editingTechnician ? 'Leave blank to keep current password' : ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!editingTechnician}
                  placeholder={editingTechnician ? 'Leave blank to keep current password' : ''}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingTechnician ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default TechniciansPage;
