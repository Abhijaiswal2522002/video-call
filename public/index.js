const socket = io('/');
const peer = new Peer();
let myVideoStream;
let myId;
const videoGrid = document.getElementById('videoDiv');
const myVideo = document.createElement('video');
myVideo.muted = true; // Mute the local video
const peerConnections = {};
let isMuted = false; // Track mute state

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  myVideoStream = stream;
  addVideo(myVideo, stream);

  peer.on('call', call => {
    call.answer(stream);
    const vid = document.createElement('video');
    call.on('stream', userStream => {
      addVideo(vid, userStream);
    });
    call.on('error', (err) => {
      alert(err);
    });
    call.on("close", () => {
      vid.remove();
    });
    peerConnections[call.peer] = call;
  });
}).catch(err => {
  alert("Error accessing media devices: " + err.message);
});

peer.on('open', (id) => {
  myId = id;
  socket.emit("newUser", id, roomID);
});

peer.on('error', (err) => {
  alert("Peer error: " + err.type);
});

socket.on('userJoined', id => {
  const call = peer.call(id, myVideoStream);
  const vid = document.createElement('video');
  call.on('error', (err) => {
    alert("Call error: " + err);
  });
  call.on('stream', userStream => {
    addVideo(vid, userStream);
  });
  call.on('close', () => {
    vid.remove();
  });
  peerConnections[id] = call;
});

socket.on('userDisconnect', id => {
  if (peerConnections[id]) {
    peerConnections[id].close();
    delete peerConnections[id];
  }
});

// Function to add video to the grid
function addVideo(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

// Function to toggle mute
function toggleMute() {
  isMuted = !isMuted;
  myVideoStream.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
  const muteBtn = document.getElementById('muteBtn');
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
}

// Function to cancel the call
function cancelCall() {
  if (confirm("Are you sure you want to cancel the call?")) {
    for (let id in peerConnections) {
      peerConnections[id].close();
    }
    peer.disconnect();
    socket.disconnect();
    window.location.href = "/";  // Redirect to homepage
  }
}

// Update user count
socket.on('updateUserCount', (userList) => {
  const userCountElement = document.getElementById('userCount');
  userCountElement.textContent = `Participants: ${userList.length}`;
});
