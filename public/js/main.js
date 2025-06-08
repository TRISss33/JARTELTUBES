document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const hangupButton = document.getElementById('hangupButton');
  const toggleVideo = document.getElementById('toggleVideo');
  const toggleAudio = document.getElementById('toggleAudio');
  const connectionStatus = document.getElementById('connection-status');
  
  let localStream;
  let isVideoOn = true;
  let isAudioOn = true;

  // Initialize
  updateConnectionStatus(false);

  // Event Listeners
  startButton.addEventListener('click', startCall);
  hangupButton.addEventListener('click', hangUp);
  toggleVideo.addEventListener('click', toggleLocalVideo);
  toggleAudio.addEventListener('click', toggleLocalAudio);

  async function startCall() {
    try {
      showNotification("Memulai panggilan...");
      localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      document.getElementById('localVideo').srcObject = localStream;
      updateConnectionStatus(true);
      startButton.disabled = true;
      hangupButton.disabled = false;
      
      // Inisialisasi WebRTC (implementasi di webrtc.js)
      initializeWebRTC(localStream);
      
    } catch (error) {
      showNotification(Error: ${error.message}, true);
      console.error("Error accessing media devices:", error);
    }
  }

  function hangUp() {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('localVideo').srcObject = null;
    updateConnectionStatus(false);
    startButton.disabled = false;
    hangupButton.disabled = true;
    
    // Bersihkan semua video remote
    document.getElementById('videoGrid').innerHTML = '';
    
    // Implementasi cleanup WebRTC (di webrtc.js)
    closeWebRTCConnections();
    showNotification("Panggilan diakhiri");
  }

  function toggleLocalVideo() {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      isVideoOn = !videoTracks[0].enabled;
      videoTracks[0].enabled = isVideoOn;
      toggleVideo.innerHTML = <i class="fas fa-video${isVideoOn ? '' : '-slash'}"></i> ${isVideoOn ? 'Video On' : 'Video Off'};
    }
  }

  function toggleLocalAudio() {
    if (!localStream) return;
    
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      isAudioOn = !audioTracks[0].enabled;
      audioTracks[0].enabled = isAudioOn;
      toggleAudio.innerHTML = <i class="fas fa-microphone${isAudioOn ? '' : '-slash'}"></i> ${isAudioOn ? 'Audio On' : 'Audio Off'};
    }
  }

  function updateConnectionStatus(isConnected) {
    connectionStatus.textContent = isConnected ? "Online 🟢" : "Offline 🔴";
    connectionStatus.style.color = isConnected ? "#4CAF50" : "#F44336";
  }

  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--primary-color)';
    
    const notificationArea = document.getElementById('notification-area');
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Expose fungsi ke global untuk akses dari HTML
  window.kickUser = (userId) => {
    const videoEl = document.getElementById(video-${userId});
    if (videoEl) {
      videoEl.closest('.grid-item').remove();
      showNotification(User ${userId} telah dikick);
    }
  };
});
