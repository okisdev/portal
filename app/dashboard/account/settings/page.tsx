'use client';

import type React from 'react';
import { useState } from 'react';

const SettingsPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', { name, email, password });
  };

  return (
    <div className='settings-page'>
      <h1>Account Settings</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='name'>Name:</label>
          <input type='text' id='name' value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor='email'>Email:</label>
          <input type='email' id='email' value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor='password'>Password:</label>
          <input type='password' id='password' value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type='submit'>Save Changes</button>
      </form>
    </div>
  );
};

export default SettingsPage;
