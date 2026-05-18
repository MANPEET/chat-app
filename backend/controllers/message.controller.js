import cloudinary from "../lib/cloudinary.js"
import { getReceiverSocketId, io } from "../lib/socket.js"
import Group from "../models/groupSchema.js";

import Message from "../models/messageSchema.js"
import User from "../models/userSchema.js"


export const getUsersForSidebar = async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

      const usersWithLastMessage = await Promise.all(
        filteredUsers.map(async(user) => {
          const lastMessage = await Message.findOne({
            $or:[
              {senderId : loggedInUserId, receiverId: user._id},
              {senderId: user._id, receiverId: loggedInUserId}
            ],
            group: null
          })
          .sort({createdAt: -1}) //Descending
          .select("text image audio createdAt senderId isDelivered readAt")

          return {
            ...user.toObject(),
            lastMessage: lastMessage ? {
              text: lastMessage.text || null,
              image: lastMessage.image ? true : false,  
              audio: lastMessage.audio ? true : false,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              isDelivered: lastMessage.isDelivered,
              readAt: lastMessage.readAt,
            }
            : null
          }
        })
      )

      usersWithLastMessage.sort((a,b) => {
        if(!a.lastMessage && !b.lastMessage) return 0
        if(!a.lastMessage) return 1
        if(!b.lastMessage) return -1

        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      })
  
      res.status(200).json(usersWithLastMessage);
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

      const senderSocketId = getReceiverSocketId(senderId.toString())
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
  const userId = socket.handshake.query.userId;
  if (!userId) return;

  // ── 1-on-1 undelivered messages (unchanged) ──────────────────────────────
  const unDeliveredMessages = await Message.find({
    receiverId: userId,
    isDelivered: false,
    group: null
  });

  for (const message of unDeliveredMessages) {
    message.isDelivered = true;
    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDelivered", { messageId: message._id });
    }
  }

  // ── FIX 1: Group undelivered messages when user comes online ─────────────
  const undeliveredGroupMessages = await Message.find({
    group: { $ne: null },
    "deliveredTo.user": { $ne: userId },
    senderId: { $ne: userId }
  });

  const now = new Date();

  for (const message of undeliveredGroupMessages) {
    message.deliveredTo.push({ user: userId, at: now });
    await message.save();

    // Fetch group to know total member count
    const group = await Group.findById(message.group);
    if (!group) continue;

    const otherMemberCount = group.members.filter(
      m => m.toString() !== message.senderId.toString()
    ).length;

    const allDelivered = message.deliveredTo.length >= otherMemberCount;

    console.log("[DELIVERY CHECK]", {
        messageId: message._id,
        deliveredToLength: message.deliveredTo.length,
        otherMemberCount,
        allDelivered,
        senderOnline: !!getReceiverSocketId(message.senderId.toString())
    });

    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId && allDelivered) {
      io.to(senderSocketId).emit("groupMessageDelivered", {
        messageId: message._id,
        userId,
        at: now
      });
    }
  }

  // ── 1-on-1 mark as read (unchanged) ──────────────────────────────────────
  socket.on("markMessageAsRead", async ({ chatId }) => {
    const unreadMessages = await Message.find({
      senderId: chatId,
      receiverId: userId,
      readAt: null,
      group: null
    });

    const now = new Date();
    for (const message of unreadMessages) {
      message.readAt = now;
      message.isDelivered = true;
      await message.save();

      const senderSocketId = getReceiverSocketId(message.senderId?.toString());
      io.to(senderSocketId).emit("messageRead", {
        messageId: message._id,
        readAt: now,
      });
    }
  });

  // ── FIX 2: Blue tick only when ALL members have read ─────────────────────
  socket.on("markGroupMessageAsRead", async ({ groupId }) => {
    const unreadMessages = await Message.find({
        group: groupId,
        "readBy.user": { $ne: userId },
        senderId: { $ne: userId }
    });

    if (!unreadMessages?.length) return;

    const group = await Group.findById(groupId);
    if (!group) return;

    const now = new Date();

    for (const message of unreadMessages) {
        message.readBy.push({ user: userId, readAt: now });

        const alreadyDelivered = message.deliveredTo.some(
            d => d.user.toString() === userId.toString()
        );
        if (!alreadyDelivered) {
            message.deliveredTo.push({ user: userId, at: now });
        }

        await message.save();

        const senderSocketId = getReceiverSocketId(message.senderId.toString());
        if (!senderSocketId) continue;

        // ✅ Calculate per-message: exclude THIS message's sender, not unreadMessages[0]'s
        const otherMemberCount = group.members.filter(
            m => m.toString() !== message.senderId.toString()
        ).length;

        const allRead = message.readBy.length >= otherMemberCount;

        if (allRead) {
            io.to(senderSocketId).emit("groupMessageRead", {
                messageId: message._id,
                readAt: now,
                userId
            });
        } else {
            io.to(senderSocketId).emit("groupMessagePartialRead", {
                messageId: message._id,
                readBy: message.readBy
            });
        }
    }
});
};

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

