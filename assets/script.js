// Google API settings
const CLIENT_ID = '851123776808-4nt2gsfre2i2s4jc34ilnrl46hvhlgmo.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';



// Authenticate user
function authenticate() {
  return gapi.auth2.getAuthInstance()
    .signIn({ scope: SCOPES });
}

function initClient() {
  gapi.load('client:auth2', () => {
    gapi.auth2.init({ client_id: CLIENT_ID }).then(() => {
      const authInstance = gapi.auth2.getAuthInstance();

      // If already signed in, use the existing session
      if (authInstance.isSignedIn.get()) {
        enableUpload();
      } else {
        document.getElementById('uploadButton').onclick = () => {
          authInstance.signIn({ scope: SCOPES }).then(() => {
            enableUpload();
            handleUpload(); // Immediately proceed after first login
          }).catch(err => {
            alert("Sign-in failed.");
            console.error(err);
          });
        };
      }
    });
  });
}

function enableUpload() {
  document.getElementById('uploadButton').onclick = handleUpload;
}

function handleUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    try {
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
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' })
        }
      );

      window.location = `/c/${id}`;
    } catch (e) {
      alert("Upload failed. Please try again.");
      console.error(e);
    }
  };

  input.click();
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
