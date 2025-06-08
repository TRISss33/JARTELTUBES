let peerConnection;
const configuration = { 
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // Tambahkan TURN server jika diperlukan
  ] 
};

function initializeWebRTC(localStream) {
  peerConnection = new RTCPeerConnection(configuration);

  // Tambahkan local stream ke koneksi
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Event handlers
  peerConnection.onicecandidate = handleICECandidateEvent;
  peerConnection.ontrack = handleTrackEvent;
  peerConnection.oniceconnectionstatechange = handleICEConnectionStateChange;

  // Buat offer (implementasi signaling sederhana)
  createOffer();
}

async function createOffer() {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Dalam implementasi real, kirim offer ke remote peer via signaling server
    // Contoh: socket.emit('offer', offer);
    console.log('Offer created:', offer);
    
  } catch (error) {
    console.error('Error creating offer:', error);
    showNotification("Gagal memulai panggilan", true);
  }
}

function handleICECandidateEvent(event) {
  if (event.candidate) {
    // Kirim candidate ke remote peer via signaling server
    console.log('ICE Candidate:', event.candidate);
  }
}

function handleTrackEvent(event) {
  const remoteVideoGrid = document.getElementById('videoGrid');
  const userId = remote-${Date.now()}; // ID unik untuk user
  
  const gridItem = document.createElement('div');
  gridItem.className = 'grid-item';
  gridItem.id = container-${userId};
  gridItem.innerHTML = `
    <video id="video-${userId}" autoplay></video>
    <p>User ${userId.replace('remote-', '')}</p>
    <button class="kick_btn" onclick="kickUser('${userId}')">
      <i class="fas fa-user-times"></i>
    </button>
  `;
  
  remoteVideoGrid.appendChild(gridItem);
  
  const remoteVideo = document.getElementById(video-${userId});
  remoteVideo.srcObject = event.streams[0];
}

function handleICEConnectionStateChange() {
  const state = peerConnection.iceConnectionState;
  console.log('ICE state:', state);
  
  if (state === 'disconnected' || state === 'failed') {
    showNotification("Koneksi terputus", true);
    document.getElementById('hangupButton').click();
  }
}

function closeWebRTCConnections() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
}

// Fungsi untuk handle signaling (contoh sederhana)
async function handleOffer(offer) {
  if (!peerConnection) return;
  
  try {
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    // Kirim answer ke remote peer
    console.log('Answer created:', answer);
    
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}

// Expose fungsi ke global
window.initializeWebRTC = initializeWebRTC;
window.closeWebRTCConnections = closeWebRTCConnections;
window.handleOffer = handleOffer;
