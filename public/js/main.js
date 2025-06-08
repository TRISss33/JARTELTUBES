'use strict';

const socket = io(); // pastikan socket.io sudah connect
const webrtc = new Webrtc(socket, null, { log: true, warn: true, error: true });

const roomInput = document.getElementById('roomInput');
const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const notification = document.getElementById('notification');
const localVideo = document.getElementById('localVideo');
const videos = document.getElementById('videos');
const controls = document.getElementById('controls');
const toggleMicBtn = document.getElementById('toggleMicBtn');
const toggleCamBtn = document.getElementById('toggleCamBtn');

let localStream;
let micEnabled = true;
let camEnabled = true;

joinBtn.onclick = async () => {
  const room = roomInput.value.trim();
  const name = nameInput.value.trim() || 'Anonymous';

  if (!room) {
    notification.textContent = 'Room ID harus diisi!';
    return;
  }
  notification.textContent = '';

  try {
    localStream = await webrtc.getLocalStream({ audio: true }, { video: true });
    localVideo.srcObject = localStream;
    controls.style.display = 'block';

    // Update buttons
    joinBtn.disabled = true;
    leaveBtn.disabled = false;
    roomInput.disabled = true;
    nameInput.disabled = true;

    webrtc._localStream = localStream; // pastikan stream disimpan ke objek webrtc (kalau belum)

    webrtc.joinRoom(room);
  } catch (err) {
    notification.textContent = 'Gagal mendapatkan akses kamera/mikrofon.';
    console.error(err);
  }
};

leaveBtn.onclick = () => {
  webrtc.leaveRoom();

  // Reset UI
  joinBtn.disabled = false;
  leaveBtn.disabled = true;
  roomInput.disabled = false;
  nameInput.disabled = false;
  controls.style.display = 'none';
  notification.textContent = '';

  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localVideo.srcObject = null;
  }

  // Remove all remote videos
  for (const video of document.querySelectorAll('.remoteVideo')) {
    video.remove();
  }
};

toggleMicBtn.onclick = () => {
  if (!localStream) return;
  micEnabled = !micEnabled;
  localStream.getAudioTracks().forEach(track => (track.enabled = micEnabled));
  toggleMicBtn.textContent = micEnabled ? 'Mic On' : 'Mic Off';
};

toggleCamBtn.onclick = () => {
  if (!localStream) return;
  camEnabled = !camEnabled;
  localStream.getVideoTracks().forEach(track => (track.enabled = camEnabled));
  toggleCamBtn.textContent = camEnabled ? 'Cam On' : 'Cam Off';
};

// Event handlers dari Webrtc class
webrtc.addEventListener('newUser', (e) => {
  const { socketId, stream } = e.detail;
  console.log('New remote user connected:', socketId);

  if (document.getElementById('remoteVideo_' + socketId)) return;

  const remoteVideo = document.createElement('video');
  remoteVideo.id = 'remoteVideo_' + socketId;
  remoteVideo.autoplay = true;
  remoteVideo.playsInline = true;
  remoteVideo.srcObject = stream;
  remoteVideo.classList.add('remoteVideo');

  videos.appendChild(remoteVideo);
});

webrtc.addEventListener('removeUser', (e) => {
  const { socketId } = e.detail;
  console.log('User left:', socketId);

  const remoteVideo = document.getElementById('remoteVideo_' + socketId);
  if (remoteVideo) {
    remoteVideo.srcObject = null;
    remoteVideo.remove();
  }
});

webrtc.addEventListener('notification', (e) => {
  const { notification: msg } = e.detail;
  notification.textContent = msg;
});

webrtc.addEventListener('error', (e) => {
  const { error } = e.detail;
  notification.textContent = Error: ${error.message};
});

webrtc.addEventListener('createdRoom', (e) => {
  notification.textContent = Room ${e.detail.roomId} created, you are the initiator.;
});

webrtc.addEventListener('joinedRoom', (e) => {
  notification.textContent = Joined room ${e.detail.roomId}.;
});
