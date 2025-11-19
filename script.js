// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCARL-ty-60zXRoOj72utwo1ftVqz-9ABo",
    authDomain: "table-tennis-ball-launcher.firebaseapp.com",
    projectId: "table-tennis-ball-launcher",
    storageBucket: "table-tennis-ball-launcher.firebasestorage.app",
    messagingSenderId: "1006741586196",
    appId: "1:1006741586196:web:329de35e46dc4091d80201"
};

// Initialize Firebase
let app, auth, db;
let firebaseInitialized = false;

function initFirebase() {
    if (firebaseInitialized) return;
    
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
        
        // Setup auth state listener
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User logged in:', user.uid);
                loadUserData(user.uid);
            } else {
                console.log('No user logged in');
            }
        });
    } catch (error) {
        console.error('Firebase initialization error:', error);
        alert('Failed to initialize Firebase. Please refresh the page.');
    }
}

// Initialize Firebase when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}

// Application State
let currentUser = null;
let isConnected = false;
let currentMode = null;
let sessionStart = null;

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'flex';
}

function showControl() {
    showPage('controlPage');
    updateControlPage();
}

async function showHistory() {
    showPage('historyPage');
    await renderHistory();
}

function showProfile() {
    showPage('profilePage');
    document.getElementById('editName').value = currentUser.name;
    document.getElementById('editEmail').value = currentUser.email;
}

// Authentication with Firebase
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (!firebaseInitialized) {
        alert('Firebase is still loading. Please wait...');
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Load user data from Firestore
        await loadUserData(user.uid);

        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        showControl();
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            alert('Invalid email or password');
        } else if (error.code === 'auth/invalid-email') {
            alert('Invalid email format');
        } else if (error.code === 'auth/invalid-credential') {
            alert('Invalid credentials. Please check your email and password.');
        } else {
            alert('Login failed: ' + error.message);
        }
    }
}

async function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    if (!firebaseInitialized) {
        alert('Firebase is still loading. Please wait...');
        return;
    }

    try {
        // Create user in Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        });

        currentUser = {
            uid: user.uid,
            name: name,
            email: email
        };

        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';

        showControl();
        alert('Account created successfully!');
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'auth/email-already-in-use') {
            alert('Email already exists');
        } else if (error.code === 'auth/invalid-email') {
            alert('Invalid email format');
        } else if (error.code === 'auth/weak-password') {
            alert('Password is too weak');
        } else {
            alert('Registration failed: ' + error.message);
        }
    }
}

async function handleLogout() {
    if (currentMode) {
        await stopSession();
    }
    if (isConnected) {
        disconnectLauncher();
    }

    try {
        await auth.signOut();
        currentUser = null;
        showPage('loginPage');
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
}

// Load User Data from Firebase
async function loadUserData(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            currentUser = {
                uid: uid,
                name: userData.name,
                email: userData.email
            };
            showControl();
        } else {
            console.error('User data not found');
            alert('User data not found. Please contact support.');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Failed to load user data: ' + error.message);
    }
}

// Profile Update
async function updateProfile() {
    const newName = document.getElementById('editName').value;

    if (!newName) {
        alert('Please enter a name');
        return;
    }

    try {
        await db.collection('users').doc(currentUser.uid).update({
            name: newName
        });

        currentUser.name = newName;
        showControl();
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Failed to update profile: ' + error.message);
    }
}

// ESP32 Connection
async function connectToLauncher() {
    const esp32IP = document.getElementById('esp32IP').value;

    try {
        // In real implementation, make HTTP request to ESP32
        // const response = await fetch(`http://${esp32IP}/connect`);
        // if (!response.ok) throw new Error('Connection failed');
        
        // Simulate connection
        isConnected = true;
        updateConnectionStatus();
        updateModeButtons();
        alert('Connected to launcher successfully!');
        
        // Real implementation would be:
        // const response = await fetch(`http://${esp32IP}/connect`);
        // const data = await response.json();
        // if (data.status === 'connected') { ... }
        
    } catch (error) {
        alert('Failed to connect to launcher. Make sure ESP32 is powered on and connected to WiFi.');
        console.error('Connection error:', error);
    }
}

function disconnectLauncher() {
    if (currentMode) {
        stopSession();
    }
    isConnected = false;
    updateConnectionStatus();
    updateModeButtons();
}

function updateConnectionStatus() {
    const statusBadge = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    const connectBtn = document.getElementById('connectBtn');
    const ipInput = document.getElementById('esp32IP');

    if (isConnected) {
        statusBadge.className = 'status-badge status-connected';
        statusText.textContent = 'Connected';
        connectBtn.textContent = 'Disconnect';
        connectBtn.onclick = disconnectLauncher;
        connectBtn.className = 'btn btn-danger btn-full';
        ipInput.disabled = true;
    } else {
        statusBadge.className = 'status-badge status-disconnected';
        statusText.textContent = 'Disconnected';
        connectBtn.textContent = 'Connect to Launcher';
        connectBtn.onclick = connectToLauncher;
        connectBtn.className = 'btn btn-primary btn-full';
        ipInput.disabled = false;
    }
}

// Mode Selection
async function selectMode(mode) {
    if (!isConnected) {
        alert('Please connect to launcher first');
        return;
    }

    // Stop previous session if exists
    if (currentMode) {
        await stopSession();
    }

    currentMode = mode;
    sessionStart = new Date();

    // Update UI
    updateModeButtons();
    showActiveMode();

    try {
        // Send command to ESP32
        const esp32IP = document.getElementById('esp32IP').value;
        
        // Real implementation:
        // await fetch(`http://${esp32IP}/mode`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ mode: mode })
        // });
        
        console.log(`Mode changed to: ${mode}`);
    } catch (error) {
        console.error('Failed to change mode:', error);
    }
}

async function stopSession() {
    if (!currentMode || !sessionStart) return;

    const endTime = new Date();
    const duration = Math.floor((endTime - sessionStart) / 1000); // in seconds

    try {
        // Save session to Firebase
        await db.collection('sessions').add({
            userId: currentUser.uid,
            mode: currentMode,
            duration: duration,
            startTime: sessionStart.toISOString(),
            endTime: endTime.toISOString(),
            date: sessionStart.toLocaleDateString(),
            time: sessionStart.toLocaleTimeString()
        });

        console.log('Session saved to Firebase');
    } catch (error) {
        console.error('Error saving session:', error);
        alert('Failed to save session: ' + error.message);
    }

    currentMode = null;
    sessionStart = null;

    updateModeButtons();
    hideActiveMode();
}

function updateModeButtons() {
    const modes = ['fast', 'slow', 'continuous'];
    
    modes.forEach(mode => {
        const btn = document.getElementById(`${mode}Mode`);
        btn.disabled = !isConnected;
        
        if (currentMode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function showActiveMode() {
    const activeMode = document.getElementById('activeMode');
    const activeModeText = document.getElementById('activeModeText');
    activeModeText.textContent = currentMode;
    activeMode.style.display = 'block';
}

function hideActiveMode() {
    const activeMode = document.getElementById('activeMode');
    activeMode.style.display = 'none';
}

// History - Load from Firebase
async function renderHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="loading">Loading history...</div>';

    if (!currentUser) {
        historyList.innerHTML = `
            <div class="history-empty">
                <p>Please log in to view history</p>
            </div>
        `;
        return;
    }

    try {
        // Query sessions for current user
        const querySnapshot = await db.collection('sessions')
            .where('userId', '==', currentUser.uid)
            .get();

        const sessions = [];
        querySnapshot.forEach((doc) => {
            sessions.push(doc.data());
        });

        // Sort sessions client-side by startTime (newest first)
        sessions.sort((a, b) => {
            return new Date(b.startTime) - new Date(a.startTime);
        });

        if (sessions.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>No training sessions yet. Start practicing!</p>
                </div>
            `;
            return;
        }

        const historyHTML = sessions.map(session => {
            const iconSVG = getIconForMode(session.mode);
            return `
                <div class="history-item">
                    <div class="history-content">
                        <div class="history-left">
                            ${iconSVG}
                            <div class="history-info">
                                <h3>${session.mode} Mode</h3>
                                <p>${session.date} at ${session.time}</p>
                            </div>
                        </div>
                        <div class="history-right">
                            <div class="history-duration">${formatDuration(session.duration)}</div>
                            <div class="history-label">Duration</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        historyList.innerHTML = historyHTML;
    } catch (error) {
        console.error('Error loading history:', error);
        console.error('Full error details:', error.code, error.message);
        historyList.innerHTML = `
            <div class="history-empty">
                <p>Failed to load history. Please check console for details.</p>
                <p style="font-size: 0.875rem; color: #ef4444; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
    }
}

function getIconForMode(mode) {
    const icons = {
        fast: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
        slow: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>',
        continuous: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>'
    };
    return icons[mode] || '';
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

// Update Control Page
function updateControlPage() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
    }
    updateConnectionStatus();
    updateModeButtons();
    if (currentMode) {
        showActiveMode();
    } else {
        hideActiveMode();
    }
}

// Allow Enter key for login
document.addEventListener('DOMContentLoaded', function() {
    const loginPassword = document.getElementById('loginPassword');
    const registerPassword = document.getElementById('registerPassword');
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    if (registerPassword) {
        registerPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleRegister();
            }
        });
    }
});