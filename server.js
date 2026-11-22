
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const { Server } = require("socket.io");

const connectDB = require("./config/db");

const User = require("./models/User");
const Message = require("./models/Message");

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const noteRoutes = require("./routes/noteRoutes");
const messageRoutes = require("./routes/messageRoutes");
const messageEmitter = require("./events/messageEvents");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/messages", messageRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Secure Connect API is running!",
    status: "Healthy"
  });
});

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------
// SOCKET.IO AUTHENTICATION
// ------------------------------------

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;

    next();

  } catch (error) {
    next(new Error("Invalid or expired authentication token"));
  }
});

// ------------------------------------
// REAL-TIME MESSAGING
// ------------------------------------

io.on("connection", (socket) => {

  console.log("Authenticated user connected:", socket.user.name);

  // Every user joins their personal room
  socket.join(`user:${socket.user._id}`);

  // Send private message
  socket.on("private_message", async (data, callback) => {
    try {
      const receiverId = data?.receiverId;

      const messageText =
        typeof data?.message === "string"
          ? data.message.trim()
          : "";

      // Validate receiver ID
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        throw new Error("Invalid receiver ID");
      }

      // Prevent sending messages to yourself
      if (socket.user._id.toString() === receiverId) {
        throw new Error("You cannot message yourself");
      }

      // Validate message
      if (!messageText || messageText.length > 2000) {
        throw new Error("Message must contain 1 to 2000 characters");
      }

      // Check receiver exists
      const receiver = await User.findById(receiverId);

      if (!receiver) {
        throw new Error("Receiver not found");
      }

      // Save message in MongoDB
      const savedMessage = await Message.create({
        sender: socket.user._id,
        receiver: receiver._id,
        message: messageText
      });

      // Populate sender and receiver details
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate("sender", "name email")
        .populate("receiver", "name email");

// Trigger custom EventEmitter event
messageEmitter.emit("messageSent", {
  sender: populatedMessage.sender.name,
  receiver: populatedMessage.receiver.name,
  message: populatedMessage.message
});


      // Send message to receiver's personal room
      io.to(`user:${receiver._id}`).emit(
        "receive_message",
        populatedMessage
      );

      // Confirm message to sender
      if (typeof callback === "function") {
        callback({
          success: true,
          message: populatedMessage
        });
      }

      console.log("Message sent successfully");

    } catch (error) {
      console.error("Message Error:", error.message);

      if (typeof callback === "function") {
        callback({
          success: false,
          message: error.message
        });
      }
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.name);
  });

});

// ------------------------------------
// START SERVER
// ------------------------------------

const startServer = async () => {
  try {

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long.");
    }

    await connectDB();

    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
      console.log("--------------------------------");
      console.log("Secure Connect Server Started");
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log("--------------------------------");
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
