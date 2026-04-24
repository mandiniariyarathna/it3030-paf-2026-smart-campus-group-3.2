import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '../services/userService';

const ROLES = ['USER', 'TECHNICIAN', 'ADMIN'];

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getAllUsers();
      setUsers(data || []);
    } catch {
      setError('Unable to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      await loadUsers();
    } catch {
      setError('Failed to update role.');
    }
  };

  return (
    <main className="home-page">
      <section className="admin-page-header">
        <p className="home-kicker">Admin</p>
        <h1>User Management</h1>
        <p>Review user access and update roles safely.</p>
      </section>

      {error ? <p className="field-error">{error}</p> : null}
      {isLoading ? <p className="page-loader">Loading users...</p> : null}

      {!isLoading ? (
        <section className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select value={user.role} onChange={(event) => handleRoleChange(user.id, event.target.value)}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </main>
  );
}

export default UserManagementPage;
