"use client"
import { useState } from 'react';
import PageHeader from '../../components/PageHeader';

let nextId = 4;

export default function RenderingListsPage() {
  const [users, setUsers] = useState([
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'},
    {id: 3, name: 'Carl'},
  ]);

  const addUser = () => {
    setUsers([...users, { id: nextId, name: `User ${nextId}` }]);
    nextId += 1;
  };

  const removeUser = (id) => setUsers(users.filter((u) => u.id !== id));
  return (
    <>
      <PageHeader
        title="Rendering Lists with map()"
        description="Every mapped element needs a unique, stable key — the item's id, never the array index."
      />
      <div className="demo">
        <button onClick={addUser}>Add User</button>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name}{' '}
              <button onClick={() => removeUser(user.id)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}