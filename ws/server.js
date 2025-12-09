const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: '*' }});

const PORT = process.env.PORT || 3000;

let viewers = 0;
let allowPlayback = true; // admin toggle
const chats = []; // keep small in memory

app.get('/status', (req, res) => {
  res.json({ viewers, allowPlayback, chatCount: chats.length });
});

// basic admin action (toggle) - simple endpoint
app.post('/admin/toggle', express.json(), (req, res) => {
  allowPlayback = !!req.body.allow;
  io.emit('admin:toggle', { allowPlayback });
  res.json({ ok: true, allowPlayback });
});

io.on('connection', (socket) => {
  // when client connects, it should emit 'viewer:join' with { streamKey }
  socket.on('viewer:join', (data) => {
    viewers++;
    socket.streamKey = data?.streamKey || 'unknown';
    io.emit('viewers:update', { viewers });
  });

  socket.on('viewer:leave', () => {
    if (viewers > 0) viewers--;
    io.emit('viewers:update', { viewers });
  });

  // chat messages
  socket.on('chat:message', (msg) => {
    const message = {
      id: Date.now(),
      nick: msg.nick || 'Anon',
      text: msg.text || '',
      ts: new Date().toISOString()
    };
    chats.push(message);
    if (chats.length > 500) chats.shift();
    io.emit('chat:new', message);
  });

  // admin request for chat history
  socket.on('admin:getChat', () => {
    socket.emit('admin:chatHistory', chats);
  });

  socket.on('disconnect', () => {
    if (socket.streamKey) {
      if (viewers > 0) viewers--;
      io.emit('viewers:update', { viewers });
    }
  });
});

http.listen(PORT, () => {
  console.log(`WS server listening on ${PORT}`);
});

