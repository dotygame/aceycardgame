// Google API settings
const CLIENT_ID = '851123776808-4nt2gsfre2i2s4jc34ilnrl46hvhlgmo.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Initialize Google API client
function initClient() {
  gapi.load('client:auth2', () => {
    gapi.auth2.init({ client_id: CLIENT_ID });
  });
}

// Authenticate user
function authenticate() {
  return gapi.auth2.getAuthInstance()
    .signIn({ scope: SCOPES });
}

// Upload file to Drive and make public
async function uploadAndShare(file) {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
  const metadata = new Blob([JSON.stringify({ name: file.name })], { type: 'application/json' });
  const form = new FormData();
  form.append('metadata', metadata);
  form.append('file', file);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: form }
  );
  const { id } = await uploadRes.json();

  await fetch(
    `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
    { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    }
  );
  return id;
}

// Handle upload flow
async function handleUpload() {
  await authenticate();
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = async () => {
    const file = input.files[0];
    try {
      const fileId = await uploadAndShare(file);
      window.location = `/c/${fileId}`;
    } catch (e) {
      alert('Upload failed. Please try again.');
      console.error(e);
    }
  };
  input.click();
}

// Handle view card page
function loadCardView() {
  const params = new URLSearchParams(window.location.search);
  const fileId = params.get('id');
  if (!fileId) { window.location = '/'; return; }

  const url = `https://drive.google.com/uc?id=${fileId}`;
  const container = document.getElementById('mediaContainer');
  const element = document.createElement('img');
  element.src = url;
  container.appendChild(element);

  document.getElementById('newCardBtn').onclick = () => location = '/';
}

// Bootstrap
window.addEventListener('load', () => {
  if (typeof gapi !== 'undefined') initClient();
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const uploadBtn = document.getElementById('uploadButton');
    if (uploadBtn) uploadBtn.onclick = handleUpload;
  }
  if (window.location.pathname.endsWith('card.html')) {
    loadCardView();
  }
});
