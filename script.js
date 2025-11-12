const USERS_KEY = 'device_profiler_users';
const DEVICES_KEY = 'device_profiler_devices';
const CURRENT_USER_KEY = 'device_profiler_current_user';


let currentUser = null;
let editingDeviceId = null;


document.addEventListener('DOMContentLoaded', () => {
    currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    
    if (currentUser) {
        showDashboard();
    } else {
        showAuth();
    }

    setupEventListeners();
});


function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('deviceForm').addEventListener('submit', handleDeviceSubmit);
}


function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
}


function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        showToast('Welcome back!');
        showDashboard();
    } else {
        showToast('Invalid email or password', true);
    }
}

function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showToast("Passwords don't match", true);
        return;
    }

    if (password.length < 8) {
        showToast('Password must be at least 8 characters', true);
        return;
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        showToast('User already exists', true);
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        email,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    
    showToast('Account created successfully!');
    showDashboard();
}

function logout() {
    currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    showToast('Logged out successfully');
    showAuth();
}


function showAuth() {
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    document.getElementById('userEmail').textContent = currentUser.email;
    loadDevices();
}


function loadDevices() {
    const devices = getUserDevices();
    const tableBody = document.getElementById('deviceTableBody');
    const emptyState = document.getElementById('emptyState');
    const deviceTable = document.getElementById('deviceTable');
    const deviceCount = document.getElementById('deviceCount');

    deviceCount.textContent = `${devices.length} device${devices.length !== 1 ? 's' : ''} registered`;

    if (devices.length === 0) {
        emptyState.style.display = 'block';
        deviceTable.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    deviceTable.style.display = 'block';

    tableBody.innerHTML = devices.map(device => `
        <tr>
            <td>
                <div class="device-icon">
                    ${getDeviceIcon(device.type)}
                    ${device.name}
                </div>
            </td>
            <td>${device.type}</td>
            <td><span class="status-badge status-${device.status.toLowerCase().replace(' ', '-')}">${device.status}</span></td>
            <td>${device.assignedUser}</td>
            <td>${new Date(device.lastActiveDate).toLocaleDateString()}</td>
            <td>
                <div class="action-btns">
                    <button class="icon-btn" onclick="editDevice('${device.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="openDeleteDialog('${device.id}', '${device.name}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getDeviceIcon(type) {
    const icons = {
        'Laptop': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        'Desktop': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        'Phone': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
        'Tablet': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
        'Other': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect></svg>'
    };
    return icons[type] || icons['Other'];
}

function openAddDevice() {
    editingDeviceId = null;
    document.getElementById('dialogTitle').textContent = 'Add New Device';
    document.getElementById('saveBtn').textContent = 'Add Device';
    document.getElementById('deviceForm').reset();
    document.getElementById('lastActiveDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('deviceDialog').style.display = 'flex';
}

function editDevice(id) {
    const devices = getAllDevices();
    const device = devices.find(d => d.id === id);
    
    if (device) {
        editingDeviceId = id;
        document.getElementById('dialogTitle').textContent = 'Edit Device';
        document.getElementById('saveBtn').textContent = 'Save Changes';
        document.getElementById('deviceName').value = device.name;
        document.getElementById('deviceType').value = device.type;
        document.getElementById('deviceStatus').value = device.status;
        document.getElementById('assignedUser').value = device.assignedUser;
        document.getElementById('lastActiveDate').value = device.lastActiveDate;
        document.getElementById('deviceDialog').style.display = 'flex';
    }
}

function handleDeviceSubmit(e) {
    e.preventDefault();
    
    const deviceData = {
        name: document.getElementById('deviceName').value,
        type: document.getElementById('deviceType').value,
        status: document.getElementById('deviceStatus').value,
        assignedUser: document.getElementById('assignedUser').value,
        lastActiveDate: document.getElementById('lastActiveDate').value,
    };

    if (editingDeviceId) {
        updateDevice(editingDeviceId, deviceData);
        showToast('Device updated successfully');
    } else {
        addDevice(deviceData);
        showToast('Device added successfully');
    }

    closeDeviceDialog();
    loadDevices();
}

function closeDeviceDialog() {
    document.getElementById('deviceDialog').style.display = 'none';
    editingDeviceId = null;
}

let deleteDeviceId = null;

function openDeleteDialog(id, name) {
    deleteDeviceId = id;
    document.getElementById('deleteDeviceName').textContent = name;
    document.getElementById('deleteDialog').style.display = 'flex';
}

function closeDeleteDialog() {
    document.getElementById('deleteDialog').style.display = 'none';
    deleteDeviceId = null;
}

function confirmDelete() {
    if (deleteDeviceId) {
        deleteDevice(deleteDeviceId);
        showToast('Device deleted successfully');
        loadDevices();
        closeDeleteDialog();
    }
}


function getUsers() {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
}

function getAllDevices() {
    const data = localStorage.getItem(DEVICES_KEY);
    return data ? JSON.parse(data) : [];
}

function getUserDevices() {
    if (!currentUser) return [];
    const allDevices = getAllDevices();
    return allDevices.filter(d => d.userId === currentUser.id);
}

function addDevice(deviceData) {
    const allDevices = getAllDevices();
    const newDevice = {
        id: Date.now().toString(),
        ...deviceData,
        userId: currentUser.id
    };
    allDevices.push(newDevice);
    localStorage.setItem(DEVICES_KEY, JSON.stringify(allDevices));
}

function updateDevice(id, updates) {
    const allDevices = getAllDevices();
    const index = allDevices.findIndex(d => d.id === id);
    if (index !== -1) {
        allDevices[index] = { ...allDevices[index], ...updates };
        localStorage.setItem(DEVICES_KEY, JSON.stringify(allDevices));
    }
}

function deleteDevice(id) {
    const allDevices = getAllDevices();
    const filtered = allDevices.filter(d => d.id !== id);
    localStorage.setItem(DEVICES_KEY, JSON.stringify(filtered));
}


function showToast(message, isError = false) {
    const toast = document.getElementById('');
    toast.textContent = message;
    toast.style.background = isError ? '#ef4444' : '#1e293b';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
