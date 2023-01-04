import { Server } from 'socket.io';

const io = new Server({
  cors: {
    origin: 'https://teachify-learning.netlify.app',
  },
});

let onlineUsers = [];

const addNewUser = (fullname, socketId) => {
  !onlineUsers.some((user) => user.fullname === fullname) &&
    onlineUsers.push({ fullname, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (receive) => {
  return onlineUsers.find((user) => user.fullname === receive);
};

// =====================================================
io.on('connection', (socket) => {
  socket.on('newUser', (fullname) => {
    addNewUser(fullname, socket.id);
  });

  socket.on('sendNotification', ({ senderName, receiverName, type }) => {
    const receiver = getUser(receiverName);

    if (receiver === undefined) return null;

    io.to(receiver.socketId).emit('getNotification', {
      senderName,
      type,
    });
  });

  socket.on('disconnect', () => {
    removeUser(socket.id);
  });
});

io.listen(5000);
