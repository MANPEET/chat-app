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
          isDelivered: msg.isDelivered, 
          readAt: msg.readAt
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

    const receiverSocketId =  getReceiverSocketId(receiverId);

    if(receiverSocketId){
      newMessage.isDelivered = true;
      await newMessage.save();
    }

    const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "fullName profilePic")

    
    const formattedMessage = {
        _id: populatedMessage._id,
        text: populatedMessage.text,
        image: populatedMessage.image,
        createdAt: populatedMessage.createdAt,
        audio: populatedMessage.audio,
        sender: populatedMessage.senderId, 
        isDelivered: populatedMessage.isDelivered, 
        readAt: populatedMessage.readAt,
    };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", formattedMessage);

      const senderSocketId = getReceiverSocketId(populatedMessage.senderId.toString())
      if(senderSocketId){
        io.to(senderSocketId).emit("messageDelivered", {
          messageId: newMessage._id
        })
      }
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

export const handleDelivery = async(socket, io) => {
  const userId = socket.handshake.query.userId

  if(!userId) return

  //We are finding all the unread messages for userId, userId is the id for the person who is currently logged in
  const unDeliveredMessages = await Message.find({
    receiverId: userId,
    isDelivered: false,
    group: null
  })

  //Now we found all the messages so let's mark them as delivered since the user is not logged in now.
  for (const message of unDeliveredMessages){
    message.isDelivered = true
    await message.save();

    //We are fetching the socketId for the sender
    const senderSocketId =  getReceiverSocketId(message.senderId.toString())

    if(senderSocketId){
      
      // We are letting the sender know that your message was delivered to the receiver now.
      io.to(senderSocketId).emit("messageDelivered", {
        messageId: message._id
      })
    }
  }

  socket.on("markMessageAsRead", async({chatId}) => {

    //You are fetching the messages which was sent to you by the chatId user, chatId is the other person's Id with whom you are
    //chatting and userId is yours Id (the person logged in the application currently).

    const unreadMessages = await Message.find({
      senderId: chatId,
      receiverId: userId,
      readAt: null,
      group: null    // Only for 1on1 chat
    })

    const now = new Date();
    for(const message of unreadMessages){
      message.readAt = now;
      message.isDelivered = true;  // If let's say the message is not delivered
      await message.save()

      const senderSocketId =  getReceiverSocketId(message.senderId?.toString())

      //Now letting the sender know hey this person just seen your message
      io.to(senderSocketId).emit("messageRead", {
        messageId: message._id,
        readAt: now,
      })
    }
  })
}

export const getUnreadMessagesCount = async (req, res) => {
    const { senderId } = req.params;
    const userId = req.user._id; 

    if (!userId || !senderId) return res.json({ count: 0 });

    try {
        const count = await Message.countDocuments({
            receiverId: userId,
            senderId: senderId,
            readAt: null,
            isDelivered: true,
            group: null
        });

        res.json({ count });
    } catch (error) {
        console.error("Error getting unread count:", error);
        res.status(500).json({ count: 0 });
    }
}

