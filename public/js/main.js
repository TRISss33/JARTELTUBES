const socket = io();
const pcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const webrtc = new Webrtc(socket, pcConfig);

const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const toggleMicBtn = document.getElementById('toggleMicBtn');
const toggleCamBtn = document.getElementById('toggleCamBtn');
const controls = document.getElementById('controls');
const notification = document.getElementById('notification');
const roomInput = document.getElementById('roomInput');
const localVideo = document.getElementById('localVideo');
const videosContainer = document.getElementById('videos');

let micOn = true;
let camOn = true;

joinBtn.addEventListener('click', async () => {
  const roomId = roomInput.value.trim();
  if (!roomId) return;

  joinBtn.disabled = true;
  notification.textContent = "Joining...";

  try {
    const stream = await webrtc.getLocalStream();
    localVideo.srcObject = stream;
    webrtc.joinRoom(roomId);
    leaveBtn.disabled = false;
    controls.style.display = 'block';
    notification.textContent = "";
  } catch (err) {
    console.error(err);
    notification.textContent = "Could not access camera/mic: " + err.message;
    joinBtn.disabled = false;
  }
});

leaveBtn.addEventListener('click', () => {
  webrtc.leaveRoom();
  joinBtn.disabled = false;
  leaveBtn.disabled = true;
  controls.style.display = 'none';
  localVideo.srcObject = null;
  videosContainer.querySelectorAll("video:not(#localVideo)").forEach(v => v.remove());
});

toggleMicBtn.addEventListener('click', () => {
  micOn = !micOn;
  webrtc.toggleAudio(micOn);
  toggleMicBtn.textContent = micOn ? 'Mic On' : 'Mic Off';
});

toggleCamBtn.addEventListener('click', () => {
  camOn = !camOn;
  webrtc.toggleVideo(camOn);
  toggleCamBtn.textContent = camOn ? 'Cam On' : 'Cam Off';
});

webrtc.addEventListener('newUser', e => {
  const { socketId, stream } = e.detail;
  const video = document.createElement('video');
  video.id = `remote-${socketId}`;
  video.autoplay = true;
  video.playsInline = true;
  video.srcObject = stream;
  videosContainer.appendChild(video);
});

webrtc.addEventListener('removeUser', e => {
  const video = document.getElementById(`remote-${e.detail.socketId}`);
  if (video) video.remove();
});

webrtc.addEventListener('kicked', () => {
  alert('You have been kicked from the room.');
  location.reload();
});
