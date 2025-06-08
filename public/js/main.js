'use strict';
const socket = io();
const webrtc = new Webrtc(socket, {/* pcConfig... */});
const localVideo = document.querySelector('#localVideo-container video');
const videoGrid = document.querySelector('#videoGrid');
const micBtn = document.querySelector('#micBtn');
const camBtn = document.querySelector('#camBtn');
const roomInput = document.querySelector('#roomId');
const nameInput = document.querySelector('#userNameInput');
const notif = document.querySelector('#notification');
const localNameSpan = document.querySelector('#localName');

webrtc.addEventListener('createdRoom', e => { notif.textContent = Created room ${e.detail.roomId}; });
webrtc.addEventListener('joinedRoom', e => { notif.textContent = Joined room ${e.detail.roomId}; });
webrtc.addEventListener('leftRoom', e => { notif.textContent = Left room ${e.detail.roomId}; videoGrid.innerHTML=''; });
webrtc.addEventListener('newUser', e => addRemoteUser(e.detail.socketId, e.detail.stream));
webrtc.addEventListener('removeUser', e => document.getElementById(e.detail.socketId)?.remove());
webrtc.addEventListener('kicked', () => { notif.textContent = 'You were kicked'; videoGrid.innerHTML=''; });

webrtc.getLocalStream(true, true).then(stream => { localVideo.srcObject = stream; });

document.getElementById('joinBtn').onclick = () => {
  const room = roomInput.value.trim(); const nm = nameInput.value.trim()||'Anonymous';
  if (!room) { notif.textContent='Masukkan Room ID!'; return; }
  webrtc.joinRoom(room);
  localNameSpan.textContent = nm;
};

document.getElementById('leaveBtn').onclick = () => webrtc.leaveRoom();

micBtn.onclick = () => {
  const on = micBtn.classList.toggle('off');
  micBtn.textContent = on ? '🔇' : '🎤';
  webrtc.toggleAudio(!on);
};

camBtn.onclick = () => {
  const off = camBtn.classList.toggle('off');
  camBtn.textContent = off ? '📷' : '📹';
  webrtc.toggleVideo(!off);
};

function addRemoteUser(id, stream) {
  const cont = document.createElement('div');
  cont.className = 'grid-item'; cont.id = id;

  const vid = document.createElement('video');
  vid.autoplay = true; vid.playsInline = true; vid.srcObject = stream;

  const name = document.createElement('p');
  name.textContent = id;

  const ctrls = document.createElement('div');
  ctrls.className = 'controls';

  const mic = document.createElement('button');
  mic.className='btn-toggle mic-toggle';
  mic.textContent='🎤';
  mic.onclick = () => {
    mic.classList.toggle('off');
    stream.getAudioTracks().forEach(t=>t.enabled = !t.enabled);
    mic.textContent = mic.classList.contains('off')?'🔇':'🎤';
  };

  const cam = document.createElement('button');
  cam.className='btn-toggle video-toggle';
  cam.textContent='📹';
  cam.onclick = () => {
    cam.classList.toggle('off');
    stream.getVideoTracks().forEach(t=>t.enabled = !t.enabled);
    cam.textContent = cam.classList.contains('off')?'📷':'📹';
  };

  ctrls.append(mic, cam);
  cont.append(name, vid, ctrls);

  if (webrtc.isAdmin) {
    const kick = document.createElement('button');
    kick.className = 'kick_btn'; kick.textContent = 'Kick';
    kick.onclick = () => socket.emit('kickout', id, webrtc.room);
    cont.appendChild(kick);
  }

  videoGrid.appendChild(cont);
}
