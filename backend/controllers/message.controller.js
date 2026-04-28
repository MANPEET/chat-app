import cloudinary from "../lib/cloudinary.js"
import { getReceiverSocketId, io } from "../lib/socket.js"

import Message from "../models/messageSchema.js"
import User from "../models/userSchema.js"


export const getUsersForSidebar = async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
  
      res.status(200).json(filteredUsers);
    } catch (error) {
      console.error("Error in getUsersForSidebar: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  export const getMessages = async (req, res) => {
    try {
      const { id: userToChatId } = req.params;
      const myId = req.user._id;
  
      const messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      }).populate("senderId", "fullName profilePic")
        .sort({ createdAt: 1 });
      
            

        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            text: msg.text,
            image: msg.image,
            createdAt: msg.createdAt,
            group: msg.group,
            audio: msg.audio,
            sender: msg.senderId, 
        }));
  
      res.status(200).json(formattedMessages);
    } catch (error) {
      console.log("Error in getMessages controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  export const sendMessage = async (req, res) => {
    try {
      const { text, image, audio } = req.body;
      const { id: receiverId } = req.params;
      const senderId = req.user._id;
  
      let imageUrl;
      if (image) {
        // Upload base64 image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      }

      let audioUrl;
      if(audio){
        const uploadResponse = await cloudinary.uploader.upload(audio , {
          resource_type: "video",
          folder: "audio_messages"
        })
        audioUrl = uploadResponse.secure_url;
      }
  
      const newMessage = new Message({
        senderId,
        receiverId,
        text,
        audio: audioUrl,
        image: imageUrl,
      });
  
      await newMessage.save();

      const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "fullName profilePic")

      
      const formattedMessage = {
          _id: populatedMessage._id,
          text: populatedMessage.text,
          image: populatedMessage.image,
          createdAt: populatedMessage.createdAt,
          sender: populatedMessage.senderId, 
      };
  
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", formattedMessage);
      }
  
      res.status(201).json(formattedMessage);
    } catch (error) {
      console.log("Error in sendMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  export const handleTyping = (socket, io) => {
    // 1-on-1 typing
    socket.on("typing", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", {
                userId: socket.user._id,
                user: {
                    _id: socket.user._id,
                    fullName: socket.user.fullName,
                    profilePic: socket.user.profilePic,
                },
            });
        }
    });

    socket.on("stopTyping", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userStoppedTyping", {
                userId: socket.user._id,
            });
        }
    });

    // Group typing — broadcasts to the room, excluding the sender
    socket.on("groupTyping", ({ groupId }) => {
        socket.to(groupId).emit("userTyping", {
            userId: socket.user._id,
            user: {
                _id: socket.user._id,
                fullName: socket.user.fullName,
                profilePic: socket.user.profilePic,
            },
        });
    });

    socket.on("groupStopTyping", ({ groupId }) => {
        socket.to(groupId).emit("userStoppedTyping", {
            userId: socket.user._id,
        });
    });
};

