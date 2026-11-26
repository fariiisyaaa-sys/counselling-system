const KEY = 'counseleEaseData';
const SESSION_USER = 'counselEaseUser';
const SESSION_ROLE = 'counselEaseRole';
const defaultData = {
  users: [
    { id: 'u-demo-counsellor', name: 'Demo Counsellor', email: 'admin@counsel.ease', password: 'Admin123!', role: 'counsellor' },
    { id: 'u-demo-client-aina', name: 'Aina Rahman', email: 'aina@example.com', password: 'Client123!', role: 'client' },
    { id: 'u-demo-client-daniel', name: 'Daniel Lee', email: 'daniel@example.com', password: 'Client123!', role: 'client' }
  ],
  clients: [
    { id: 'c1', userId: 'u-demo-client-aina', name: 'Aina Rahman', email: 'aina@example.com', phone: '012-3456789', age: 21, notes: '', counsellorId: 'u-demo-counsellor' },
    { id: 'c2', userId: 'u-demo-client-daniel', name: 'Daniel Lee', email: 'daniel@example.com', phone: '013-4567890', age: 24, notes: '', counsellorId: 'u-demo-counsellor' }
  ],
  appointments: [
    { id: 'a1', clientId: 'c1', date: '2026-12-02', time: '10:00', counsellor: 'Demo Counsellor', counsellorId: 'u-demo-counsellor', status: 'Confirmed' },
    { id: 'a2', clientId: 'c2', date: '2026-12-03', time: '14:00', counsellor: 'Demo Counsellor', counsellorId: 'u-demo-counsellor', status: 'Pending' },
    { id: 'a-demo-completed', clientId: 'c1', date: '2026-11-20', time: '10:00', counsellor: 'Demo Counsellor', counsellorId: 'u-demo-counsellor', status: 'Completed' }
  ],
  records: [],
  feedbacks: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId(prefix) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

function roleForEmail(email) {
  return email.trim().toLowerCase().endsWith('@counsel.ease') ? 'counsellor' : 'client';
}

function getData() {
  const raw = localStorage.getItem(KEY);
  const data = raw ? JSON.parse(raw) : clone(defaultData);
  if (!data || !Array.isArray(data.users) || !Array.isArray(data.clients) ||
      !Array.isArray(data.appointments) || !Array.isArray(data.records)) {
    throw new Error('CounselEase browser data is invalid. Clear this site’s local storage to restart the prototype.');
  }

  let changed = !raw;
  if (!Array.isArray(data.feedbacks)) {
    data.feedbacks = [];
    changed = true;
  }
  data.users.forEach((user, index) => {
    if (!user.id) {
      user.id = index === 0 && (user.email || '').toLowerCase() === 'admin@counsel.ease'
        ? 'u-demo-counsellor'
        : makeId('u');
      changed = true;
    }
    const role = roleForEmail(user.email || '');
    if (user.role !== role) {
      user.role = role;
      changed = true;
    }
  });
  if (!data.appointments.some(item => item.id === 'a-demo-completed') &&
      data.clients.some(item => item.id === 'c1')) {
    data.appointments.push({
      id: 'a-demo-completed', clientId: 'c1', date: '2026-11-20', time: '10:00',
      counsellor: 'Demo Counsellor', counsellorId: 'u-demo-counsellor', status: 'Completed'
    });
    changed = true;
  }
  data.clients.forEach(client => {
    if (!client.id) {
      client.id = makeId('c');
      changed = true;
    }
  });
  [
    { clientId: 'c1', userId: 'u-demo-client-aina', name: 'Aina Rahman', email: 'aina@example.com', password: 'Client123!' },
    { clientId: 'c2', userId: 'u-demo-client-daniel', name: 'Daniel Lee', email: 'daniel@example.com', password: 'Client123!' }
  ].forEach(demo => {
    const client = data.clients.find(item => item.id === demo.clientId);
    if (!client) return;
    let account = data.users.find(item => item.email.trim().toLowerCase() === demo.email);
    if (!account) {
      const id = data.users.some(item => item.id === demo.userId) ? makeId('u') : demo.userId;
      account = { id, name: demo.name, email: demo.email, password: demo.password, role: 'client' };
      data.users.push(account);
      changed = true;
    }
    if (client.userId !== account.id) {
      client.userId = account.id;
      changed = true;
    }
  });
  data.appointments.forEach(appointment => {
    if (!appointment.id) {
      appointment.id = makeId('a');
      changed = true;
    }
    if (!appointment.counsellorId) {
      const owner = data.users.find(user =>
        user.role === 'counsellor' &&
        user.name.trim().toLowerCase() === (appointment.counsellor || '').trim().toLowerCase()
      );
      if (owner) {
        appointment.counsellorId = owner.id;
        changed = true;
      }
    }
  });
  data.records.forEach(record => {
    if (!record.id) {
      record.id = makeId('r');
      changed = true;
    }
  });
  if (changed) saveData(data);
  return data;
}

function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function currentUser() {
  const session = sessionStorage.getItem(SESSION_USER);
  if (!session) return null;
  let saved;
  try {
    saved = JSON.parse(session);
  } catch (error) {
    console.error('Unable to read the CounselEase login session.', error);
    clearSession();
    return null;
  }
  if (!saved || typeof saved !== 'object') {
    clearSession();
    return null;
  }
  const data = getData();
  const user = data.users.find(item => item.id === saved.id);
  if (!user || user.role !== sessionStorage.getItem(SESSION_ROLE) || user.role !== saved.role) {
    clearSession();
    return null;
  }
  return user;
}

function clearSession() {
  sessionStorage.removeItem(SESSION_USER);
  sessionStorage.removeItem(SESSION_ROLE);
}

function dashboardFor(user) {
  return user && user.role === 'client' ? 'client-dashboard.html' : 'dashboard.html';
}

function guardPage(page) {
  const user = currentUser();
  if (page === 'login' || page === 'register') {
    if (user) {
      location.replace(dashboardFor(user));
      return false;
    }
    return true;
  }
  if (!user) {
    location.replace('index.html');
    return false;
  }
  const clientPage = ['client-dashboard', 'my-appointments', 'my-records'].includes(page);
  if (page === 'feedback' && user.role === 'counsellor') {
    location.replace('counsellor-feedback.html');
    return false;
  }
  if ((clientPage && user.role !== 'client') ||
      (['dashboard', 'clients', 'appointments', 'records', 'counsellor-feedback'].includes(page) && user.role !== 'counsellor') ||
      (page === 'feedback' && user.role !== 'client')) {
    location.replace(dashboardFor(user));
    return false;
  }
  return true;
}

function el(id) {
  return document.getElementById(id);
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function empty(message) {
  return `<div class="empty-state">${esc(message)}</div>`;
}

function table(headers, rows) {
  return rows.length
    ? `<table><thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`
    : empty('No information available yet.');
}

function profileFor(data, user) {
  return data.clients.find(client => client.userId === user.id) || null;
}

function appointmentBelongsToCounsellor(appointment, user) {
  if (appointment.counsellorId) return appointment.counsellorId === user.id;
  return (appointment.counsellor || '').trim().toLowerCase() === user.name.trim().toLowerCase();
}

function appointmentForRecord(data, record, user) {
  const client = user.role === 'client' ? profileFor(data, user) : null;
  if (user.role === 'client' && (!client || record.clientId !== client.id)) return null;
  if (user.role === 'counsellor' && record.counsellorId && record.counsellorId !== user.id) return null;

  const appointmentId = record.appointmentId || record.appointment_id;
  const appointments = data.appointments.filter(appointment =>
    (!appointmentId || appointment.id === appointmentId) &&
    appointment.clientId === record.clientId &&
    appointment.status === 'Completed' &&
    (user.role !== 'counsellor' || appointmentBelongsToCounsellor(appointment, user))
  );
  const ownedAppointments = appointments.filter(appointment => {
    const counsellor = data.users.find(item =>
      item.role === 'counsellor' &&
      (item.id === appointment.counsellorId ||
        (!appointment.counsellorId && item.name.trim().toLowerCase() === (appointment.counsellor || '').trim().toLowerCase()))
    );
    return counsellor && (!record.counsellorId || record.counsellorId === counsellor.id);
  });
  if (appointmentId) return ownedAppointments.length === 1 ? ownedAppointments[0] : null;
  const dateMatches = ownedAppointments.filter(appointment => appointment.date === record.date);
  if (dateMatches.length === 1) return dateMatches[0];
  if (dateMatches.length > 1) return null;
  return ownedAppointments.length === 1 ? ownedAppointments[0] : null;
}

function recordForAppointment(data, appointment, user) {
  return data.records.find(record => {
    const linkedAppointmentId = record.appointmentId || record.appointment_id;
    return linkedAppointmentId
      ? linkedAppointmentId === appointment.id
      : appointmentForRecord(data, record, user)?.id === appointment.id;
  }) || null;
}

function clientsForCounsellor(data, user) {
  const assignedIds = new Set([
    ...data.appointments.filter(item => appointmentBelongsToCounsellor(item, user)).map(item => item.clientId),
    ...data.records.filter(item => appointmentForRecord(data, item, user)).map(item => item.clientId)
  ]);
  return data.clients.filter(client =>
    client.counsellorId === user.id ||
    assignedIds.has(client.id) ||
    (!client.counsellorId && user.id === 'u-demo-counsellor')
  );
}

function clientName(data, id) {
  return data.clients.find(client => client.id === id)?.name || 'Deleted client';
}

function setupShell() {
  const user = currentUser();
  const page = document.body.dataset.page;
  const brand = document.querySelector('.side-brand');
  if (brand) brand.href = dashboardFor(user);
  document.querySelectorAll('#sideUser, #topUser').forEach(node => { node.textContent = user.name; });
  const welcome = el('welcomeName');
  if (welcome) welcome.textContent = user.name.split(' ')[0];

  const links = user.role === 'counsellor'
    ? [
      ['dashboard', 'dashboard.html', '▦', 'Dashboard'],
      ['clients', 'clients.html', '♙', 'Clients'],
      ['appointments', 'appointments.html', '▣', 'Appointments'],
      ['records', 'records.html', '▤', 'Session records'],
      ['counsellor-feedback', 'counsellor-feedback.html', '☆', 'Feedback'],
      ['profile', 'profile.html', '♡', 'Profile']
    ]
    : [
      ['client-dashboard', 'client-dashboard.html', '▦', 'Dashboard'],
      ['my-appointments', 'my-appointments.html', '▣', 'My appointments'],
      ['my-records', 'my-records.html', '▤', 'My Session Records'],
      ['feedback', 'feedback.html', '☆', 'Feedback'],
      ['profile', 'profile.html', '♡', 'My profile']
    ];
  const nav = document.querySelector('.sidebar nav');
  if (nav) {
    nav.innerHTML = links.map(([key, href, icon, label]) =>
      `<a href="${href}" data-nav="${key}">${icon} <span>${label}</span></a>`
    ).join('') + '<a href="index.html" data-logout>↪ <span>Log out</span></a>';
    nav.style.setProperty('--nav-item-count', String(links.length + 1));
    nav.querySelector(`[data-nav="${page}"]`)?.classList.add('active');
    nav.querySelector('[data-logout]').addEventListener('click', event => {
      event.preventDefault();
      clearSession();
      location.href = 'index.html';
    });
  }
  const logoutButton = el('logoutBtn');
  if (logoutButton) {
    logoutButton.hidden = true;
  }
}

function loginPage() {
  el('loginForm').addEventListener('submit', event => {
    event.preventDefault();
    const email = el('loginEmail').value.trim().toLowerCase();
    const password = el('loginPassword').value;
    const error = el('loginError');
    error.textContent = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error.textContent = 'Enter a valid email address.';
      return;
    }
    const user = getData().users.find(item =>
      item.email.trim().toLowerCase() === email && item.password === password
    );
    if (!user || user.role !== roleForEmail(email)) {
      error.textContent = 'Incorrect email or password. Please try again.';
      return;
    }
    sessionStorage.setItem(SESSION_USER, JSON.stringify({
      id: user.id, name: user.name, email: user.email, role: user.role
    }));
    sessionStorage.setItem(SESSION_ROLE, user.role);
    location.href = dashboardFor(user);
  });
}

function registerPage() {
  const registrationClientDetails = el('registerClientDetails');
  const updateRegistrationDetails = () => {
    const email = el('regEmail').value.trim();
    registrationClientDetails.hidden = Boolean(email && roleForEmail(email) === 'counsellor');
  };
  el('regEmail').addEventListener('input', updateRegistrationDetails);
  updateRegistrationDetails();
  el('registerForm').addEventListener('submit', event => {
    event.preventDefault();
    const error = el('registerError');
    error.textContent = '';
    const name = el('regName').value.trim();
    const email = el('regEmail').value.trim().toLowerCase();
    const password = el('regPassword').value;
    if (name.length < 2) {
      error.textContent = 'Enter your full name.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error.textContent = 'Enter a valid email address.';
      return;
    }
    if (password.length < 8) {
      error.textContent = 'Password must be at least 8 characters.';
      return;
    }
    if (password !== el('regConfirm').value) {
      error.textContent = 'Passwords do not match.';
      return;
    }

    const data = getData();
    if (data.users.some(user => user.email.trim().toLowerCase() === email)) {
      error.textContent = 'An account with this email already exists.';
      return;
    }
    const role = roleForEmail(email);
    const age = el('regAge').value;
    if (role === 'client' && age &&
        (!Number.isInteger(Number(age)) || Number(age) < 1 || Number(age) > 120)) {
      error.textContent = 'Age must be a whole number between 1 and 120.';
      el('regAge').focus();
      return;
    }
    const user = { id: makeId('u'), name, email, password, role };
    data.users.push(user);
    if (role === 'client') {
      data.clients.push({
        id: makeId('c'), userId: user.id, name, email,
        phone: el('regPhone').value.trim(), age, notes: ''
      });
    }
    saveData(data);
    alert(`Account created as a ${role}. You can now log in.`);
    location.href = 'index.html';
  });
}

function dashboardPage() {
  const user = currentUser();
  setupShell();
  const data = getData();
  const today = new Date().toISOString().slice(0, 10);
  const appointments = data.appointments.filter(item => appointmentBelongsToCounsellor(item, user));
  const records = data.records.filter(item => appointmentForRecord(data, item, user));
  const clients = clientsForCounsellor(data, user);
  const upcomingAppointments = appointments.filter(item => item.date >= today && item.status !== 'Pending');
  el('statClients').textContent = clients.length;
  el('statCounsellors').textContent = data.users.filter(item => item.role === 'counsellor').length;
  el('statUpcoming').textContent = upcomingAppointments.length;
  el('statAppointments').textContent = appointments.length;
  el('dashboardAppointments').innerHTML = table(
    ['Client', 'Date', 'Time', 'Status'],
    upcomingAppointments
      .slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5)
      .map(item => `<tr><td class="person-cell">${esc(clientName(data, item.clientId))}</td><td>${esc(item.date)}</td><td>${esc(item.time)}</td><td><span class="status">${esc(item.status)}</span></td></tr>`)
  );
  const activity = [
    ...appointments.filter(item => item.status !== 'Pending').map(item => ({ date: item.date, text: `Appointment scheduled for ${clientName(data, item.clientId)}` })),
    ...records.map(item => ({ date: item.date, text: `Session record for ${clientName(data, item.clientId)}` }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  el('dashboardActivity').innerHTML = activity.length
    ? activity.map(item => `<div class="activity-item"><span class="activity-dot"></span><div><p>${esc(item.text)}</p><small>${esc(item.date)}</small></div></div>`).join('')
    : empty('No recent activity yet.');
}

function clientDashboardPage() {
  const user = currentUser();
  setupShell();
  const data = getData();
  const client = profileFor(data, user);
  if (!client) {
    location.replace('index.html');
    clearSession();
    return;
  }
  const appointments = data.appointments.filter(item => item.clientId === client.id)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(item => item.date >= today);
  el('clientAppointmentCount').textContent = appointments.length;
  el('clientUpcomingCount').textContent = upcoming.length;
  el('clientProfileSummary').innerHTML = [
    `<div class="activity-item"><span class="activity-dot"></span><div><p>${esc(client.name)}</p><small>Full name</small></div></div>`,
    `<div class="activity-item"><span class="activity-dot"></span><div><p>${esc(client.email)}</p><small>Email address</small></div></div>`,
    `<div class="activity-item"><span class="activity-dot"></span><div><p>${esc(client.phone || 'Not provided')}</p><small>Phone number</small></div></div>`
  ].join('');
  el('clientDashboardAppointments').innerHTML = table(
    ['Date', 'Time', 'Counsellor', 'Status'],
    upcoming.slice(0, 5).map(item =>
      `<tr><td>${esc(item.date)}</td><td>${esc(item.time)}</td><td>${esc(item.counsellor || 'Counsellor')}</td><td><span class="status ${item.status === 'Pending' ? 'pending' : ''}">${esc(item.status)}</span></td></tr>`
    )
  );
}

function clientsPage() {
  const user = currentUser();
  setupShell();
  const modal = el('clientModal');
  const form = el('clientForm');
  function render() {
    const data = getData();
    const query = el('clientSearch').value.toLowerCase();
    const list = clientsForCounsellor(data, user).filter(client =>
      (client.name + client.email + client.phone).toLowerCase().includes(query)
    );
    el('clientsTable').innerHTML = table(
      ['Client', 'Email', 'Phone', 'Age', 'Actions'],
      list.map(client => `<tr><td class="person-cell">${esc(client.name)}</td><td>${esc(client.email)}</td><td>${esc(client.phone)}</td><td>${esc(client.age)}</td><td><button class="table-action" data-edit="${esc(client.id)}">Edit</button><button class="table-action delete-action" data-delete="${esc(client.id)}">Delete</button></td></tr>`)
    );
  }
  function open(client) {
    form.reset();
    el('clientId').value = client?.id || '';
    el('clientEmail').readOnly = Boolean(client?.userId);
    el('clientModalTitle').textContent = client ? 'Edit client' : 'Add client';
    if (client) {
      el('clientName').value = client.name;
      el('clientEmail').value = client.email;
      el('clientPhone').value = client.phone;
      el('clientAge').value = client.age;
      el('clientNotes').value = client.notes || '';
    }
    modal.classList.remove('hidden');
  }
  function close() { modal.classList.add('hidden'); }
  el('addClientBtn').onclick = () => open();
  el('closeClientModal').onclick = el('cancelClient').onclick = close;
  el('clientSearch').oninput = render;
  el('clientsTable').onclick = event => {
    const target = event.target;
    const id = target.dataset.edit || target.dataset.delete;
    if (!id) return;
    const data = getData();
    const client = clientsForCounsellor(data, user).find(item => item.id === id);
    if (!client) return;
    if (target.dataset.edit) open(client);
    else if (confirm('Delete this client? Related appointments and records will remain in this prototype.')) {
      data.clients = data.clients.filter(item => item.id !== id);
      saveData(data);
      render();
    }
  };
  form.onsubmit = event => {
    event.preventDefault();
    const data = getData();
    const id = el('clientId').value;
    const existing = id && clientsForCounsellor(data, user).find(item => item.id === id);
    if (id && !existing) return;
    const client = {
      id: id || makeId('c'), name: el('clientName').value.trim(),
      email: existing?.userId ? existing.email : el('clientEmail').value.trim(), phone: el('clientPhone').value.trim(),
      age: el('clientAge').value, notes: el('clientNotes').value.trim(),
      counsellorId: existing?.counsellorId || user.id,
      ...(existing?.userId ? { userId: existing.userId } : {})
    };
    if (existing?.userId) {
      const linkedUser = data.users.find(item => item.id === existing.userId);
      if (linkedUser) linkedUser.name = client.name;
    }
    if (id) data.clients = data.clients.map(item => item.id === id ? client : item);
    else data.clients.push(client);
    saveData(data);
    close();
    render();
  };
  render();
}

function appointmentsPage() {
  const user = currentUser();
  setupShell();
  function hasSessionRecord(data, appointment) {
    return data.records.some(record => {
      const linkedId = record.appointmentId || record.appointment_id;
      return linkedId
        ? linkedId === appointment.id
        : appointmentForRecord(data, record, user)?.id === appointment.id;
    });
  }
  function fillClients() {
    const list = clientsForCounsellor(getData(), user);
    el('appointmentClient').innerHTML = list.map(client =>
      `<option value="${esc(client.id)}">${esc(client.name)}</option>`
    ).join('');
    return list.length;
  }
  function render() {
    const data = getData();
    const appointments = data.appointments.filter(item => appointmentBelongsToCounsellor(item, user));
    el('appointmentsTable').innerHTML = table(
      ['Client', 'Date', 'Time', 'Counsellor', 'Status', 'Actions'],
      appointments.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(item =>
        `<tr><td class="person-cell">${esc(clientName(data, item.clientId))}</td><td>${esc(item.date)}</td><td>${esc(item.time)}</td><td>${esc(item.counsellor)}</td><td><select class="appointment-status-select" data-status="${esc(item.id)}" aria-label="Status for appointment ${esc(item.id)}">${['Pending', 'Confirmed', 'Completed'].map(status => `<option${item.status === status ? ' selected' : ''}>${status}</option>`).join('')}</select></td><td><button class="table-action delete-action" data-cancel="${esc(item.id)}">Cancel</button></td></tr>`
      )
    );
  }
  function open() {
    if (!fillClients()) {
      alert('Please add or assign a client first.');
      return;
    }
    el('appointmentForm').reset();
    el('appointmentCounsellor').value = user.name;
    el('appointmentDate').min = new Date().toISOString().slice(0, 10);
    el('appointmentModal').classList.remove('hidden');
  }
  function close() { el('appointmentModal').classList.add('hidden'); }
  el('addAppointmentBtn').onclick = open;
  el('closeAppointmentModal').onclick = el('cancelAppointment').onclick = close;
  el('appointmentsTable').onclick = event => {
    const id = event.target.dataset.cancel;
    if (!id || !confirm('Cancel this appointment?')) return;
    const data = getData();
    if (data.feedbacks.some(item => item.appointment_id === id)) {
      alert('This appointment cannot be cancelled because feedback has already been submitted.');
      return;
    }
    const appointment = data.appointments.find(item =>
      item.id === id && appointmentBelongsToCounsellor(item, user)
    );
    if (appointment && hasSessionRecord(data, appointment)) {
      alert('This appointment cannot be cancelled because a session record exists.');
      return;
    }
    data.appointments = data.appointments.filter(item =>
      item.id !== id || !appointmentBelongsToCounsellor(item, user)
    );
    saveData(data);
    render();
  };
  el('appointmentsTable').onchange = event => {
    const id = event.target.dataset.status;
    if (!id) return;
    const data = getData();
    const appointment = data.appointments.find(item =>
      item.id === id && appointmentBelongsToCounsellor(item, user)
    );
    if (!appointment) {
      event.target.value = '';
      return;
    }
    if (event.target.value !== 'Completed' &&
        data.feedbacks.some(item => item.appointment_id === id)) {
      alert('This appointment cannot leave Completed status after feedback has been submitted.');
      render();
      return;
    }
    if (event.target.value !== 'Completed' && hasSessionRecord(data, appointment)) {
      alert('This appointment cannot leave Completed status while a session record exists.');
      render();
      return;
    }
    appointment.status = event.target.value;
    saveData(data);
    render();
  };
  el('appointmentForm').onsubmit = event => {
    event.preventDefault();
    const data = getData();
    const clientId = el('appointmentClient').value;
    if (!clientsForCounsellor(data, user).some(client => client.id === clientId)) return;
    data.appointments.push({
      id: makeId('a'), clientId, date: el('appointmentDate').value,
      time: el('appointmentTime').value, counsellor: user.name,
      counsellorId: user.id, status: el('appointmentStatus').value
    });
    saveData(data);
    close();
    render();
  };
  render();
}

function recordsPage() {
  const user = currentUser();
  setupShell();
  const message = (text, type) => {
    el('recordMessage').textContent = text;
    el('recordMessage').className = `feedback-message ${type || ''}`;
  };
  function completedAppointments(data, editingRecordId) {
    return data.appointments.filter(appointment =>
      appointment.status === 'Completed' &&
      appointmentBelongsToCounsellor(appointment, user) &&
      (!recordForAppointment(data, appointment, user) ||
        recordForAppointment(data, appointment, user).id === editingRecordId)
    ).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }
  function fillAppointments(data, editingRecordId) {
    const appointments = completedAppointments(data, editingRecordId);
    el('recordAppointment').innerHTML = '<option value="">Select a completed appointment</option>' +
      appointments.map(appointment =>
        `<option value="${esc(appointment.id)}">${esc(appointment.id)} · ${esc(appointment.date)} · ${esc(clientName(data, appointment.clientId))}</option>`
      ).join('');
    return appointments;
  }
  function render() {
    const data = getData();
    const records = data.records.map(record => ({
      record,
      appointment: appointmentForRecord(data, record, user)
    })).filter(item => item.appointment);
    el('recordsTable').innerHTML = table(
      ['Client', 'Appointment', 'Session date', 'Session notes', 'Progress', 'Recommendations', 'Actions'],
      records.map(({ record, appointment }) =>
        `<tr><td class="person-cell">${esc(clientName(data, record.clientId))}</td><td>${esc(appointment.id)}</td><td>${esc(record.date || appointment.date)}</td><td class="record-cell">${esc(record.summary || '—')}</td><td class="record-cell">${esc(record.progress || '—')}</td><td class="record-cell">${esc(record.recommendations || record.followup || '—')}</td><td><button type="button" class="table-action" data-edit-record="${esc(record.id)}">Edit</button><button type="button" class="table-action delete-action" data-delete-record="${esc(record.id)}">Delete</button></td></tr>`
      )
    );
  }
  function close() { el('recordModal').classList.add('hidden'); }
  function updateAppointmentDetails() {
    const data = getData();
    const appointment = data.appointments.find(item =>
      item.id === el('recordAppointment').value &&
      item.status === 'Completed' &&
      appointmentBelongsToCounsellor(item, user)
    );
    el('recordClientName').value = appointment ? clientName(data, appointment.clientId) : '';
    if (appointment && !el('recordId').value) el('recordDate').value = appointment.date;
  }
  function open(recordId) {
    const data = getData();
    const record = recordId ? data.records.find(item => item.id === recordId) : null;
    const appointment = record && appointmentForRecord(data, record, user);
    if (recordId && (!record || !appointment)) {
      message('This record is not linked to one of your completed appointments.', 'error');
      return;
    }
    el('recordForm').reset();
    el('recordId').value = record ? record.id : '';
    el('recordModalTitle').textContent = record ? 'Edit session record' : 'New session record';
    const appointments = fillAppointments(data, record && record.id);
    if (!record && !appointments.length) {
      message('No completed appointments are available for a new session record.', 'error');
      return;
    }
    if (record) {
      el('recordAppointment').value = appointment.id;
      el('recordAppointment').disabled = true;
      updateAppointmentDetails();
      el('recordDate').value = record.date || appointment.date;
      el('recordSummary').value = record.summary || '';
      el('recordProgress').value = record.progress || '';
      el('recordRecommendations').value = record.recommendations || record.followup || '';
    } else {
      el('recordAppointment').disabled = false;
      el('recordAppointment').value = appointments[0].id;
      updateAppointmentDetails();
    }
    el('recordError').textContent = '';
    el('recordModal').classList.remove('hidden');
  }
  el('addRecordBtn').onclick = () => open('');
  el('recordAppointment').onchange = updateAppointmentDetails;
  el('closeRecordModal').onclick = el('cancelRecord').onclick = close;
  el('recordsTable').onclick = event => {
    const editId = event.target.closest('[data-edit-record]')?.dataset.editRecord;
    if (editId) {
      open(editId);
      return;
    }
    const id = event.target.closest('[data-delete-record]')?.dataset.deleteRecord;
    if (!id) return;
    const data = getData();
    const record = data.records.find(item => item.id === id);
    if (!record || !appointmentForRecord(data, record, user)) {
      message('You can delete only records linked to your completed appointments.', 'error');
      return;
    }
    if (!confirm('Delete this session record?')) return;
    data.records = data.records.filter(item => item.id !== id);
    saveData(data);
    render();
  };
  el('recordForm').onsubmit = event => {
    event.preventDefault();
    const data = getData();
    const id = el('recordId').value;
    const record = id ? data.records.find(item => item.id === id) : null;
    const linkedAppointment = record && appointmentForRecord(data, record, user);
    const appointmentId = record
      ? linkedAppointment && linkedAppointment.id
      : el('recordAppointment').value;
    const appointment = data.appointments.find(item =>
      item.id === appointmentId &&
      item.status === 'Completed' &&
      appointmentBelongsToCounsellor(item, user)
    );
    if (record && !appointmentForRecord(data, record, user)) {
      el('recordError').textContent = 'You can edit only records linked to your completed appointments.';
      return;
    }
    if (!appointment) {
      el('recordError').textContent = 'Select one of your completed appointments.';
      return;
    }
    const summary = el('recordSummary').value.trim();
    if (!summary) {
      el('recordError').textContent = 'Enter session notes before saving.';
      el('recordSummary').focus();
      return;
    }
    const duplicate = recordForAppointment(data, appointment, user);
    if (duplicate && (!record || duplicate.id !== record.id)) {
      el('recordError').textContent = 'A session record already exists for this appointment.';
      return;
    }
    const recommendations = el('recordRecommendations').value.trim();
    const values = {
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      counsellorId: user.id,
      date: el('recordDate').value,
      summary,
      progress: el('recordProgress').value.trim(),
      recommendations,
      followup: recommendations
    };
    if (record) Object.assign(record, values);
    else data.records.push({ id: makeId('r'), ...values });
    saveData(data);
    close();
    render();
    message(record ? 'Session record updated successfully.' : 'Session record saved successfully.', 'success');
  };
  render();
}

function myRecordsPage() {
  const user = currentUser();
  setupShell();
  const closeDetails = () => el('clientRecordDetailsModal').classList.add('hidden');
  function render() {
    const data = getData();
    const client = profileFor(data, user);
    if (!client) {
      el('clientRecordsTable').innerHTML = empty('No client profile is linked to this account.');
      return;
    }
    const records = data.records.map(record => ({
      record,
      appointment: record.clientId === client.id
        ? appointmentForRecord(data, record, user)
        : null
    })).filter(item => item.appointment)
      .sort((a, b) => (b.record.date || b.appointment.date).localeCompare(a.record.date || a.appointment.date));
    el('clientRecordsTable').innerHTML = table(
      ['Session date', 'Counsellor', 'Appointment ID', 'Session notes', 'Progress', 'Recommendations', 'Details'],
      records.map(({ record, appointment }) => {
        const counsellor = data.users.find(item => item.id === appointment.counsellorId) ||
          data.users.find(item => item.role === 'counsellor' &&
            item.name.trim().toLowerCase() === (appointment.counsellor || '').trim().toLowerCase());
        return `<tr><td>${esc(record.date || appointment.date)}</td><td class="person-cell">${esc(counsellor ? counsellor.name : appointment.counsellor || 'Counsellor')}</td><td>${esc(appointment.id)}</td><td class="record-cell">${esc(record.summary || '—')}</td><td class="record-cell">${esc(record.progress || '—')}</td><td class="record-cell">${esc(record.recommendations || record.followup || '—')}</td><td><button type="button" class="table-action" data-view-client-record="${esc(record.id)}">View details</button></td></tr>`;
      })
    );
  }
  el('clientRecordsTable').onclick = event => {
    const recordId = event.target.closest('[data-view-client-record]')?.dataset.viewClientRecord;
    if (!recordId) return;
    const data = getData();
    const client = profileFor(data, user);
    const record = data.records.find(item => item.id === recordId && client && item.clientId === client.id);
    const appointment = record && appointmentForRecord(data, record, user);
    if (!record || !appointment) {
      el('clientRecordsTable').innerHTML = empty('This session record is not available for your account.');
      return;
    }
    const counsellor = data.users.find(item => item.id === appointment.counsellorId) ||
      data.users.find(item => item.role === 'counsellor' &&
        item.name.trim().toLowerCase() === (appointment.counsellor || '').trim().toLowerCase());
    el('clientRecordDetailDate').textContent = record.date || appointment.date;
    el('clientRecordDetailCounsellor').textContent = counsellor ? counsellor.name : appointment.counsellor || 'Counsellor';
    el('clientRecordDetailAppointment').textContent = appointment.id;
    el('clientRecordDetailSummary').textContent = record.summary || 'No session notes provided.';
    el('clientRecordDetailProgress').textContent = record.progress || 'No progress notes provided.';
    el('clientRecordDetailRecommendations').textContent = record.recommendations || record.followup || 'No recommendations provided.';
    el('clientRecordDetailsModal').classList.remove('hidden');
  };
  document.querySelectorAll('[data-close-client-record]').forEach(button => {
    button.addEventListener('click', closeDetails);
  });
  el('clientRecordDetailsModal').onclick = event => {
    if (event.target === el('clientRecordDetailsModal')) closeDetails();
  };
  render();
}

function myAppointmentsPage() {
  const user = currentUser();
  setupShell();
  const dataForUser = () => {
    const data = getData();
    const client = profileFor(data, user);
    return { data, client };
  };
  function render() {
    const { data, client } = dataForUser();
    const appointments = client
      ? data.appointments.filter(item => item.clientId === client.id)
        .slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      : [];
    el('clientAppointmentsTable').innerHTML = table(
      ['Date', 'Time', 'Counsellor', 'Status'],
      appointments.map(item =>
        `<tr><td>${esc(item.date)}</td><td>${esc(item.time)}</td><td>${esc(item.counsellor || 'Counsellor')}</td><td><span class="status ${item.status === 'Pending' ? 'pending' : ''}">${esc(item.status)}</span></td></tr>`
      )
    );
  }
  function open() {
    const counsellors = getData().users.filter(item => item.role === 'counsellor');
    if (!counsellors.length) {
      alert('There are no counsellors available to book with yet.');
      return;
    }
    el('clientAppointmentCounsellor').innerHTML = counsellors.map(item =>
      `<option value="${esc(item.id)}">${esc(item.name)}</option>`
    ).join('');
    el('clientAppointmentForm').reset();
    el('clientAppointmentCounsellor').innerHTML = counsellors.map(item =>
      `<option value="${esc(item.id)}">${esc(item.name)}</option>`
    ).join('');
    el('clientAppointmentDate').min = new Date().toISOString().slice(0, 10);
    el('clientAppointmentModal').classList.remove('hidden');
  }
  function close() { el('clientAppointmentModal').classList.add('hidden'); }
  el('bookAppointmentBtn').onclick = open;
  el('closeClientAppointmentModal').onclick = el('cancelClientAppointment').onclick = close;
  el('clientAppointmentForm').onsubmit = event => {
    event.preventDefault();
    const { data, client } = dataForUser();
    const counsellor = data.users.find(item =>
      item.id === el('clientAppointmentCounsellor').value && item.role === 'counsellor'
    );
    if (!client || !counsellor) {
      el('clientAppointmentError').textContent = 'Select a valid counsellor.';
      return;
    }
    data.appointments.push({
      id: makeId('a'), clientId: client.id,
      date: el('clientAppointmentDate').value, time: el('clientAppointmentTime').value,
      counsellor: counsellor.name, counsellorId: counsellor.id, status: 'Pending'
    });
    saveData(data);
    close();
    render();
  };
  render();
}

function feedbackParticipants(data, appointment) {
  const client = data.clients.find(item => item.id === appointment.clientId);
  const clientUser = client && data.users.find(item => item.id === client.userId && item.role === 'client');
  const counsellor = data.users.find(item =>
    item.role === 'counsellor' && (
      (appointment.counsellorId && item.id === appointment.counsellorId) ||
      (!appointment.counsellorId && item.name.trim().toLowerCase() === (appointment.counsellor || '').trim().toLowerCase())
    )
  );
  if (!clientUser || !counsellor || clientUser.id === counsellor.id) return null;
  return { client, clientUser, counsellor };
}

function feedbackPage() {
  const user = currentUser();
  setupShell();
  let historyFilter = 'all';
  const message = (text, type) => {
    const node = el('feedbackMessage');
    node.textContent = text;
    node.className = `feedback-message ${type || ''}`;
  };
  const userName = (data, id) => data.users.find(item => item.id === id)?.name || 'Unavailable user';
  const feedbackDirection = (entry, viewerId) => {
    if (entry.feedback_by_user_id === viewerId) return 'given';
    if (entry.feedback_for_user_id === viewerId) return 'received';
    return '';
  };
  function render() {
    const data = getData();
    const ownAppointments = data.appointments.filter(appointment => {
      if (appointment.status !== 'Completed') return false;
      const participants = feedbackParticipants(data, appointment);
      return participants && (
        user.role === 'client'
          ? participants.clientUser.id === user.id
          : participants.counsellor.id === user.id
      );
    }).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const given = data.feedbacks.filter(item => item.feedback_by_user_id === user.id);
    const received = data.feedbacks.filter(item => item.feedback_for_user_id === user.id);
    const average = received.length
      ? (received.reduce((sum, item) => sum + Number(item.rating), 0) / received.length).toFixed(1)
      : '—';
    el('feedbackGivenCount').textContent = given.length;
    el('feedbackReceivedCount').textContent = received.length;
    el('feedbackAverageRating').textContent = average;

    const currentAppointmentId = el('feedbackAppointment').value;
    el('feedbackAppointment').innerHTML = '<option value="">Select a completed appointment</option>' +
      ownAppointments.map(appointment => {
        const alreadyGiven = data.feedbacks.some(item =>
          item.appointment_id === appointment.id && item.feedback_by_user_id === user.id
        );
        return `<option value="${esc(appointment.id)}"${alreadyGiven ? ' data-submitted="true"' : ''}>${esc(appointment.id)} · ${esc(appointment.date)}${alreadyGiven ? ' · Feedback given' : ''}</option>`;
      }).join('');
    if (ownAppointments.some(item => item.id === currentAppointmentId)) {
      el('feedbackAppointment').value = currentAppointmentId;
    }
    updateRecipient();

    const filtered = data.feedbacks.filter(item => {
      const direction = feedbackDirection(item, user.id);
      return direction && (historyFilter === 'all' || historyFilter === direction);
    }).sort((a, b) => b.appointment_id.localeCompare(a.appointment_id));
    el('feedbackHistory').innerHTML = table(
      ['Appointment ID', 'Appointment date', 'Feedback giver', 'Feedback recipient', 'Rating', 'Comment', 'Type'],
      filtered.map(item => {
        const appointment = data.appointments.find(entry => entry.id === item.appointment_id);
        const type = feedbackDirection(item, user.id);
        return `<tr><td class="person-cell">${esc(item.appointment_id)}</td><td>${esc(appointment?.date || 'Appointment unavailable')}</td><td>${esc(userName(data, item.feedback_by_user_id))}</td><td>${esc(userName(data, item.feedback_for_user_id))}</td><td><span class="rating-display" aria-label="${esc(item.rating)} out of 5 stars">${'★'.repeat(Number(item.rating))}${'☆'.repeat(5 - Number(item.rating))}</span> ${esc(item.rating)}/5</td><td class="feedback-comment">${esc(item.comment)}</td><td><span class="feedback-type ${type}">${type === 'given' ? 'Feedback given' : 'Feedback received'}</span></td></tr>`;
      })
    );
    document.querySelectorAll('[data-feedback-filter]').forEach(button => {
      button.classList.toggle('active', button.dataset.feedbackFilter === historyFilter);
      button.setAttribute('aria-pressed', String(button.dataset.feedbackFilter === historyFilter));
    });
  }
  function updateRecipient() {
    const data = getData();
    const appointment = data.appointments.find(item => item.id === el('feedbackAppointment').value);
    const participants = appointment && feedbackParticipants(data, appointment);
    const recipient = participants && (
      user.role === 'client' ? participants.counsellor : participants.clientUser
    );
    el('feedbackRecipient').textContent = recipient ? recipient.name : 'Select a completed appointment to see the recipient.';
    el('feedbackAppointmentDetails').textContent = appointment
      ? `Appointment ${appointment.id} · ${appointment.date} at ${appointment.time}`
      : '';
    const alreadyGiven = appointment && data.feedbacks.some(item =>
      item.appointment_id === appointment.id && item.feedback_by_user_id === user.id
    );
    const maxReached = appointment && data.feedbacks.filter(item => item.appointment_id === appointment.id).length >= 2;
    el('feedbackSubmit').disabled = !appointment || alreadyGiven || maxReached || !recipient;
    if (alreadyGiven) message('You have already submitted feedback for this appointment.', 'error');
    else if (maxReached) message('This appointment already has the maximum of two feedback entries.', 'error');
  }

  el('feedbackAppointment').addEventListener('change', () => {
    message('', '');
    updateRecipient();
  });
  el('feedbackForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = getData();
    const appointment = data.appointments.find(item => item.id === el('feedbackAppointment').value);
    const participants = appointment && feedbackParticipants(data, appointment);
    const expectedGiver = participants && (user.role === 'client' ? participants.clientUser.id : participants.counsellor.id);
    const recipient = participants && (user.role === 'client' ? participants.counsellor.id : participants.clientUser.id);
    const rating = Number(el('feedbackRating').value);
    const comment = el('feedbackComment').value.trim();
    if (!appointment || appointment.status !== 'Completed' || !participants || expectedGiver !== user.id) {
      message('Select a completed appointment assigned to your account.', 'error');
      return;
    }
    if (data.feedbacks.some(item => item.appointment_id === appointment.id && item.feedback_by_user_id === user.id)) {
      message('You have already submitted feedback for this appointment.', 'error');
      updateRecipient();
      render();
      return;
    }
    if (data.feedbacks.filter(item => item.appointment_id === appointment.id).length >= 2) {
      message('This appointment already has the maximum of two feedback entries.', 'error');
      updateRecipient();
      return;
    }
    if (!recipient || recipient === user.id) {
      message('Feedback giver and recipient must be different users.', 'error');
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      message('Choose a rating from 1 to 5 stars.', 'error');
      return;
    }
    if (!comment) {
      message('Enter a comment before submitting feedback.', 'error');
      el('feedbackComment').focus();
      return;
    }
    data.feedbacks.push({
      feedback_id: makeId('f'), appointment_id: appointment.id,
      feedback_by_user_id: user.id, feedback_for_user_id: recipient,
      rating, comment
    });
    saveData(data);
    el('feedbackForm').reset();
    el('feedbackRating').value = '';
    document.querySelectorAll('[data-rating]').forEach(star => {
      star.setAttribute('aria-checked', 'false');
      star.classList.remove('selected');
    });
    message('Thank you — your feedback was submitted successfully.', 'success');
    render();
  });
  document.querySelectorAll('[data-rating]').forEach(star => {
    star.addEventListener('click', () => {
      const selected = Number(star.dataset.rating);
      el('feedbackRating').value = String(selected);
      document.querySelectorAll('[data-rating]').forEach(item => {
        const active = Number(item.dataset.rating) <= selected;
        item.classList.toggle('selected', active);
        item.setAttribute('aria-checked', String(Number(item.dataset.rating) === selected));
      });
    });
  });
  document.querySelectorAll('[data-feedback-filter]').forEach(button => {
    button.addEventListener('click', () => {
      historyFilter = button.dataset.feedbackFilter;
      render();
    });
  });
  render();
}

function counsellorFeedbackPage() {
  const user = currentUser();
  setupShell();
  let activeTab = 'received';
  const ratingMarkup = rating =>
    `<span class="rating-display" aria-label="${esc(rating)} out of 5 stars">${'★'.repeat(Number(rating))}${'☆'.repeat(5 - Number(rating))}</span> <b>${esc(rating)}/5</b>`;
  const showMessage = (text, type) => {
    const node = el('counsellorFeedbackMessage');
    node.textContent = text;
    node.className = `feedback-message ${type || ''}`;
  };
  const getContext = (data, entry, direction) => {
    const appointment = data.appointments.find(item => item.id === entry.appointment_id);
    if (!appointment || appointment.status !== 'Completed' || !appointmentBelongsToCounsellor(appointment, user)) {
      return null;
    }
    const participants = feedbackParticipants(data, appointment);
    if (!participants || participants.counsellor.id !== user.id) return null;
    const belongsToView = direction === 'received'
      ? entry.feedback_for_user_id === user.id && entry.feedback_by_user_id === participants.clientUser.id
      : entry.feedback_by_user_id === user.id && entry.feedback_for_user_id === participants.clientUser.id;
    return belongsToView ? { appointment, client: participants.client, participants } : null;
  };
  const relevantEntries = (data, direction) => data.feedbacks
    .map(entry => ({ entry, context: getContext(data, entry, direction) }))
    .filter(item => item.context)
    .sort((a, b) => (b.context.appointment.date + b.context.appointment.time)
      .localeCompare(a.context.appointment.date + a.context.appointment.time));

  function render() {
    const data = getData();
    const received = relevantEntries(data, 'received');
    const given = relevantEntries(data, 'given');
    const currentAppointmentId = el('counsellorFeedbackAppointment').value;
    const completedAppointments = data.appointments.filter(appointment => {
      if (appointment.status !== 'Completed' || !appointmentBelongsToCounsellor(appointment, user)) return false;
      const participants = feedbackParticipants(data, appointment);
      return participants && participants.counsellor.id === user.id;
    }).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    el('counsellorFeedbackAppointment').innerHTML = '<option value="">Select a completed appointment</option>' +
      completedAppointments.map(appointment => {
        const alreadyGiven = data.feedbacks.some(item =>
          item.appointment_id === appointment.id && item.feedback_by_user_id === user.id
        );
        return `<option value="${esc(appointment.id)}">${esc(appointment.id)} · ${esc(appointment.date)}${alreadyGiven ? ' · Feedback given' : ''}</option>`;
      }).join('');
    if (completedAppointments.some(item => item.id === currentAppointmentId)) {
      el('counsellorFeedbackAppointment').value = currentAppointmentId;
    }
    updateCounsellorRecipient(data);

    const ratings = received.map(item => Number(item.entry.rating));
    const average = ratings.length
      ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
      : '—';
    el('counsellorAverageRating').textContent = average;
    el('counsellorFeedbackReceivedCount').textContent = received.length;
    el('counsellorFiveStarCount').textContent = ratings.filter(rating => rating === 5).length;
    el('counsellorAttentionCount').textContent = ratings.filter(rating => rating <= 2).length;

    const ratingFilter = el('receivedRatingFilter').value;
    const dateFilter = el('receivedDateFilter').value;
    const clientFilter = el('receivedClientFilter').value.trim().toLowerCase();
    const filteredReceived = received.filter(({ entry, context }) =>
      (!ratingFilter || Number(entry.rating) === Number(ratingFilter)) &&
      (!dateFilter || context.appointment.date === dateFilter) &&
      (!clientFilter || context.client.name.toLowerCase().includes(clientFilter))
    );
    el('receivedFeedbackTable').innerHTML = table(
      ['Client', 'Appointment date', 'Rating', 'Comment', 'Feedback status', 'Details'],
      filteredReceived.map(({ entry, context }) => {
        const needsAttention = Number(entry.rating) <= 2;
        return `<tr><td class="person-cell">${esc(context.client.name)}</td><td>${esc(context.appointment.date)}</td><td>${ratingMarkup(entry.rating)}</td><td class="feedback-comment">${esc(entry.comment)}</td><td><span class="feedback-state ${needsAttention ? 'attention' : ''}">${needsAttention ? 'Needs attention' : 'No attention needed'}</span></td><td><button type="button" class="table-action feedback-action" data-view-feedback="${esc(entry.feedback_id)}">View details</button></td></tr>`;
      })
    );
    el('givenFeedbackTable').innerHTML = table(
      ['Client', 'Appointment date', 'Rating', 'Comment', 'Action'],
      given.map(({ entry, context }) =>
        `<tr><td class="person-cell">${esc(context.client.name)}</td><td>${esc(context.appointment.date)}</td><td>${ratingMarkup(entry.rating)}</td><td class="feedback-comment">${esc(entry.comment)}</td><td><button type="button" class="table-action feedback-action" data-edit-feedback="${esc(entry.feedback_id)}">Edit feedback</button></td></tr>`
      )
    );
  }
  function setTab(tab) {
    activeTab = tab;
    el('receivedFeedbackPanel').classList.toggle('hidden', tab !== 'received');
    el('givenFeedbackPanel').classList.toggle('hidden', tab !== 'given');
    el('receivedFeedbackTab').classList.toggle('active', tab === 'received');
    el('givenFeedbackTab').classList.toggle('active', tab === 'given');
    el('receivedFeedbackTab').setAttribute('aria-selected', String(tab === 'received'));
    el('givenFeedbackTab').setAttribute('aria-selected', String(tab === 'given'));
  }
  function closeDetails() {
    el('receivedFeedbackDetailsModal').classList.add('hidden');
  }
  function closeEdit() {
    el('editOwnFeedbackModal').classList.add('hidden');
    el('ownFeedbackEditError').textContent = '';
  }
  function setEditRating(rating) {
    el('ownFeedbackEditRating').value = String(rating);
    document.querySelectorAll('[data-own-rating]').forEach(star => {
      const selected = Number(star.dataset.ownRating) <= rating;
      star.classList.toggle('selected', selected);
      star.setAttribute('aria-checked', String(Number(star.dataset.ownRating) === rating));
    });
  }
  function setCounsellorRating(rating) {
    el('counsellorFeedbackRating').value = String(rating);
    document.querySelectorAll('[data-counsellor-rating]').forEach(star => {
      const selected = Number(star.dataset.counsellorRating) <= rating;
      star.classList.toggle('selected', selected);
      star.setAttribute('aria-checked', String(Number(star.dataset.counsellorRating) === rating));
    });
  }
  function updateCounsellorRecipient(data) {
    const appointment = data.appointments.find(item => item.id === el('counsellorFeedbackAppointment').value);
    const participants = appointment && feedbackParticipants(data, appointment);
    const client = participants && participants.counsellor.id === user.id ? participants.client : null;
    const alreadyGiven = appointment && data.feedbacks.some(item =>
      item.appointment_id === appointment.id && item.feedback_by_user_id === user.id
    );
    const maxReached = appointment && data.feedbacks.filter(item => item.appointment_id === appointment.id).length >= 2;
    el('counsellorFeedbackRecipient').textContent = client
      ? client.name
      : 'Select a completed appointment to see the client.';
    el('counsellorFeedbackAppointmentDetails').textContent = appointment
      ? `Appointment ${appointment.id} · ${appointment.date} at ${appointment.time}`
      : '';
    el('counsellorFeedbackSubmit').disabled = !appointment || !client || alreadyGiven || maxReached;
    if (alreadyGiven) showMessage('You have already submitted feedback for this appointment.', 'error');
    else if (maxReached) showMessage('This appointment already has the maximum of two feedback entries.', 'error');
  }
  function showReceivedDetails(feedbackId) {
    const data = getData();
    const entry = data.feedbacks.find(item => item.feedback_id === feedbackId);
    const context = entry && getContext(data, entry, 'received');
    if (!entry || !context) {
      showMessage('This feedback is not available in your appointment records.', 'error');
      render();
      return;
    }
    el('receivedDetailClient').textContent = context.client.name;
    el('receivedDetailDate').textContent = context.appointment.date;
    el('receivedDetailRating').innerHTML = `${'★'.repeat(Number(entry.rating))}${'☆'.repeat(5 - Number(entry.rating))} ${esc(entry.rating)}/5`;
    el('receivedDetailStatus').textContent = Number(entry.rating) <= 2 ? 'Needs attention' : 'No attention needed';
    el('receivedDetailStatus').className = Number(entry.rating) <= 2 ? 'feedback-state attention' : 'feedback-state';
    el('receivedDetailComment').textContent = entry.comment;
    el('receivedFeedbackDetailsModal').classList.remove('hidden');
  }
  function openEdit(feedbackId) {
    const data = getData();
    const entry = data.feedbacks.find(item => item.feedback_id === feedbackId);
    const context = entry && getContext(data, entry, 'given');
    if (!entry || !context) {
      showMessage('You may edit only feedback you submitted for your own completed appointments.', 'error');
      render();
      return;
    }
    el('ownFeedbackEditId').value = entry.feedback_id;
    el('ownFeedbackEditContext').textContent = `${context.client.name} · Appointment ${context.appointment.id} · ${context.appointment.date}`;
    el('ownFeedbackEditComment').value = entry.comment;
    el('ownFeedbackEditError').textContent = '';
    setEditRating(Number(entry.rating));
    el('editOwnFeedbackModal').classList.remove('hidden');
  }

  document.querySelectorAll('[data-counsellor-feedback-tab]').forEach(button => {
    button.addEventListener('click', () => setTab(button.dataset.counsellorFeedbackTab));
  });
  [el('receivedRatingFilter'), el('receivedDateFilter')].forEach(input => input.addEventListener('change', render));
  el('receivedClientFilter').addEventListener('input', render);
  el('counsellorFeedbackAppointment').addEventListener('change', () => {
    showMessage('', '');
    updateCounsellorRecipient(getData());
  });
  el('counsellorFeedbackSubmitForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = getData();
    const appointment = data.appointments.find(item => item.id === el('counsellorFeedbackAppointment').value);
    const participants = appointment && feedbackParticipants(data, appointment);
    const entryCount = appointment
      ? data.feedbacks.filter(item => item.appointment_id === appointment.id).length
      : 0;
    if (!appointment || appointment.status !== 'Completed' ||
        !appointmentBelongsToCounsellor(appointment, user) ||
        !participants || participants.counsellor.id !== user.id) {
      showMessage('Select a completed appointment assigned to you.', 'error');
      return;
    }
    if (data.feedbacks.some(item =>
      item.appointment_id === appointment.id && item.feedback_by_user_id === user.id
    )) {
      showMessage('You have already submitted feedback for this appointment.', 'error');
      updateCounsellorRecipient(data);
      return;
    }
    if (entryCount >= 2) {
      showMessage('This appointment already has the maximum of two feedback entries.', 'error');
      updateCounsellorRecipient(data);
      return;
    }
    const rating = Number(el('counsellorFeedbackRating').value);
    const comment = el('counsellorFeedbackComment').value.trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      showMessage('Choose a rating from 1 to 5 stars.', 'error');
      return;
    }
    if (!comment) {
      showMessage('Enter a comment before submitting feedback.', 'error');
      el('counsellorFeedbackComment').focus();
      return;
    }
    data.feedbacks.push({
      feedback_id: makeId('f'), appointment_id: appointment.id,
      feedback_by_user_id: user.id, feedback_for_user_id: participants.clientUser.id,
      rating, comment
    });
    saveData(data);
    el('counsellorFeedbackSubmitForm').reset();
    el('counsellorFeedbackRating').value = '';
    document.querySelectorAll('[data-counsellor-rating]').forEach(star => {
      star.classList.remove('selected');
      star.setAttribute('aria-checked', 'false');
    });
    render();
    showMessage('Your feedback was submitted successfully.', 'success');
  });
  el('receivedFeedbackTable').addEventListener('click', event => {
    const button = event.target.closest('[data-view-feedback]');
    if (button) showReceivedDetails(button.dataset.viewFeedback);
  });
  el('givenFeedbackTable').addEventListener('click', event => {
    const button = event.target.closest('[data-edit-feedback]');
    if (button) openEdit(button.dataset.editFeedback);
  });
  document.querySelectorAll('[data-close-feedback-details]').forEach(button => {
    button.addEventListener('click', closeDetails);
  });
  document.querySelectorAll('[data-close-own-feedback]').forEach(button => {
    button.addEventListener('click', closeEdit);
  });
  document.querySelectorAll('[data-own-rating]').forEach(star => {
    star.addEventListener('click', () => setEditRating(Number(star.dataset.ownRating)));
  });
  document.querySelectorAll('[data-counsellor-rating]').forEach(star => {
    star.addEventListener('click', () => setCounsellorRating(Number(star.dataset.counsellorRating)));
  });
  el('counsellorFeedbackEditForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = getData();
    const feedbackId = el('ownFeedbackEditId').value;
    const entry = data.feedbacks.find(item => item.feedback_id === feedbackId);
    const context = entry && getContext(data, entry, 'given');
    if (!entry || !context || entry.feedback_by_user_id !== user.id) {
      el('ownFeedbackEditError').textContent = 'This feedback is not yours to edit.';
      return;
    }
    const rating = Number(el('ownFeedbackEditRating').value);
    const comment = el('ownFeedbackEditComment').value.trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      el('ownFeedbackEditError').textContent = 'Choose a rating from 1 to 5 stars.';
      return;
    }
    if (!comment) {
      el('ownFeedbackEditError').textContent = 'Enter a comment before saving.';
      el('ownFeedbackEditComment').focus();
      return;
    }
    entry.rating = rating;
    entry.comment = comment;
    saveData(data);
    closeEdit();
    render();
    showMessage('Your feedback changes were saved successfully.', 'success');
  });
  render();
  setTab(activeTab);
}

function profilePage() {
  const user = currentUser();
  setupShell();
  const data = getData();
  const client = profileFor(data, user);
  el('profileName').value = user.name;
  el('profileEmail').value = user.email;
  if (client) {
    el('profilePhone').value = client.phone || '';
    el('profileAge').value = client.age || '';
  } else {
    el('profilePhone').closest('label').hidden = true;
    el('profileAge').closest('label').hidden = true;
  }
  el('profileForm').onsubmit = event => {
    event.preventDefault();
    const name = el('profileName').value.trim();
    const age = el('profileAge').value;
    if (name.length < 2) {
      el('profileError').textContent = 'Enter your full name.';
      return;
    }
    if (client && age &&
        (!Number.isInteger(Number(age)) || Number(age) < 1 || Number(age) > 120)) {
      el('profileError').textContent = 'Age must be a whole number between 1 and 120.';
      el('profileAge').focus();
      return;
    }
    const currentData = getData();
    const account = currentData.users.find(item => item.id === user.id);
    if (!account) {
      clearSession();
      location.replace('index.html');
      return;
    }
    account.name = name;
    const ownClient = currentData.clients.find(item => item.userId === user.id);
    if (ownClient) {
      ownClient.name = name;
      ownClient.phone = el('profilePhone').value.trim();
      ownClient.age = age;
    }
    saveData(currentData);
    location.reload();
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (!guardPage(page)) return;
  if (page === 'login') loginPage();
  else if (page === 'register') registerPage();
  else if (page === 'dashboard') dashboardPage();
  else if (page === 'client-dashboard') clientDashboardPage();
  else if (page === 'clients') clientsPage();
  else if (page === 'appointments') appointmentsPage();
  else if (page === 'records') recordsPage();
  else if (page === 'my-appointments') myAppointmentsPage();
  else if (page === 'my-records') myRecordsPage();
  else if (page === 'feedback') feedbackPage();
  else if (page === 'counsellor-feedback') counsellorFeedbackPage();
  else if (page === 'profile') profilePage();
});
