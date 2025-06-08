'use strict';

class Webrtc extends EventTarget {
  constructor(socket, pcConfig) {
    super();
    this.socket = socket;
    this.pcConfig = pcConfig;
    this._localStream = null;
    this.pcs = {};
    this.streams = {};
    this.room = null;
    this.myId = null;

    this._emit = (name, details) =>
      this.dispatchEvent(new CustomEvent(name, { detail: details }));

    socket.on('created', (room, id) => {
      this.room = room;
      this.myId = id;
      this._emit('createdRoom', { roomId: room });
    });

    socket.on('joined', (room, id) => {
      this.room = room;
      this.myId = id;
      this._emit('joinedRoom', { roomId: room });
      socket.emit('message', { type: 'gotstream' }, null, room);
    });

    socket.on('leave', room => {
      this._emit('leftRoom', { roomId: room });
      this._removeAll();
    });

    socket.on('kickout', id => {
      if (id === this.myId) {
        this._emit('kicked');
        this._removeAll();
      } else {
        this._remove(id);
      }
    });

    socket.on('message', (msg, from) => this._handleMessage(msg, from));
  }

  joinRoom(room) {
    this.socket.emit('create or join', room);
  }

  leaveRoom() {
    this.socket.emit('leave', this.room);
  }

  getLocalStream(audio = true, video = true) {
    return navigator.mediaDevices
      .getUserMedia({ audio, video })
      .then(stream => {
        this._localStream = stream;
        return stream;
      });
  }

  toggleAudio(enabled) {
    if (this._localStream) {
      this._localStream.getAudioTracks().forEach(t => (t.enabled = enabled));
    }
  }

  toggleVideo(enabled) {
    if (this._localStream) {
      this._localStream.getVideoTracks().forEach(t => (t.enabled = enabled));
    }
  }

  _handleMessage(msg, from) {
    const type = msg.type;
    if (type === 'offer') this._answer(from, msg);
    else if (type === 'answer') this.pcs[from]?.setRemoteDescription(msg);
    else if (type === 'candidate') this.pcs[from]?.addIceCandidate(new RTCIceCandidate(msg.candidate));
    else if (type === 'gotstream') this._connect(from);
  }

  _connect(id) {
    if (!this._localStream) return;
    if (!this.pcs[id]) this._createPC(id);
    this._localStream.getTracks().forEach(track =>
      this.pcs[id].addTrack(track, this._localStream)
    );
    this.pcs[id]
      .createOffer()
      .then(desc => {
        this.pcs[id].setLocalDescription(desc);
        this.socket.emit('message', desc, id, this.room);
      })
      .catch(err => console.error(err));
  }

  _createPC(id) {
    const pc = new RTCPeerConnection(this.pcConfig);
    pc.onicecandidate = e => {
      if (e.candidate) {
        this.socket.emit(
          'message',
          { type: 'candidate', candidate: e.candidate },
          id,
          this.room
        );
      }
    };
    pc.ontrack = e => {
      if (!this.streams[id]) {
        this.streams[id] = e.streams[0];
        this._emit('newUser', { socketId: id, stream: this.streams[id] });
      }
    };
    this.pcs[id] = pc;
  }

  _answer(id, offer) {
    this._createPC(id);
    this.pcs[id]
      .setRemoteDescription(offer)
      .then(() => this.pcs[id].createAnswer())
      .then(desc => {
        this.pcs[id].setLocalDescription(desc);
        this.socket.emit('message', desc, id, this.room);
      })
      .catch(err => console.error(err));
  }

  _remove(id) {
    if (this.pcs[id]) {
      this.pcs[id].close();
      delete this.pcs[id];
    }
    delete this.streams[id];
    this._emit('removeUser', { socketId: id });
  }

  _removeAll() {
    Object.keys(this.pcs).forEach(id => this._remove(id));
  }
}
