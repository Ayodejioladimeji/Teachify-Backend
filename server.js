require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();

// The socket section
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// Routes
app.use('/user', require('./routes/userRoutes'));
app.use('/api', require('./routes/categoryRouter'));
app.use('/api', require('./routes/upload'));
app.use('/api', require('./routes/coursesRouter'));
app.use('/api', require('./routes/PostRouter'));

// connect to mongodb
const URI = process.env.MONGO_URI;
mongoose.connect(
  URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) throw err;
    console.log('connected to database');
  }
);

// app.get('/', (req, res) => {
//   res.send('WELCOME TO TEACHIFY BACKEND [GLITTERS TEAM]');
// });

// THE SECTION OF THE SOCKET
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

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
  console.log('Server is running on port', PORT);
});
