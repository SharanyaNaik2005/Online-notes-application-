                                                                                                                                                                                                                                              const loginForm = document.getElementById('login-form');const signupForm = document.getElementById('signup-form');
const showLogin = document.getElementById('show-login');
const showSignup = document.getElementById('show-signup');
const authMessage = document.getElementById('auth-message');
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const userInfo = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

const noteForm = document.getElementById('note-form');
const notesList = document.getElementById('notes-list');

let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

let editMode = false;      // track whether we are editing
let editNoteId = null;     // which note we are editing

function showMessage(msg) {
  authMessage.textContent = msg;
  setTimeout(() => authMessage.textContent = '', 3000);
}

function toggleAuthTabs() {
  showLogin.addEventListener('click', () => {
    showLogin.classList.add('active');
    showSignup.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  });

  showSignup.addEventListener('click', () => {
    showSignup.classList.add('active');
    showLogin.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });
}
toggleAuthTabs();

async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({email,password})
  });
  return res.json();
}

async function signup(name,email,password) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({name,email,password})
  });
  return res.json();
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await login(email,password);
  if(res.token){
    token = res.token;
    user = res.user;
    localStorage.setItem('token',token);
    localStorage.setItem('user',JSON.stringify(user));
    showDashboard();
  } else showMessage(res.message);
});

signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const res = await signup(name,email,password);
  if(res.token){
    token = res.token;
    user = res.user;
    localStorage.setItem('token',token);
    localStorage.setItem('user',JSON.stringify(user));
    showDashboard();
  } else showMessage(res.message);
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  token = null;
  user = null;
  dashboard.classList.add('hidden');
  authSection.classList.remove('hidden');
  userInfo.classList.add('hidden');
});

function showDashboard(){
  authSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  userInfo.classList.remove('hidden');
  userNameSpan.textContent = user.name || user.email;
  fetchNotes();
}

async function fetchNotes(){
  if(!token) return;
  const res = await fetch('/api/notes',{headers:{'Authorization':'Bearer '+token}});
  const notes = await res.json();
  notesList.innerHTML = '';
  notes.forEach(n=>{
    const div = document.createElement('div');
    div.className = 'note-card';
    div.innerHTML = `
      <h4>${n.title}</h4>
      <p>${n.content}</p>
      <button class="edit-btn" data-id="${n._id}">Edit</button>
      <button class="delete-btn" data-id="${n._id}">Delete</button>
    `;
    notesList.appendChild(div);

    div.querySelector('.delete-btn').addEventListener('click',()=>deleteNote(n._id));
    div.querySelector('.edit-btn').addEventListener('click',()=>startEdit(n));
  });
}

noteForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').value;

  if(editMode){
    // Update note
    await fetch('/api/notes/'+editNoteId,{
      method:'PUT',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({title,content})
    });
    editMode = false;
    editNoteId = null;
    noteForm.querySelector('button').textContent = 'Add Note';
  } else {
    // Create new note
    await fetch('/api/notes',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({title,content})
    });
  }

  document.getElementById('note-title').value='';
  document.getElementById('note-content').value='';
  fetchNotes();
});

function startEdit(note){
  editMode = true;
  editNoteId = note._id;
  document.getElementById('note-title').value = note.title;
  document.getElementById('note-content').value = note.content;
  noteForm.querySelector('button').textContent = 'Update Note';
}

async function deleteNote(id){
  await fetch('/api/notes/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+token}});
  fetchNotes();
}

// On page load
if(token && user) showDashboard();
