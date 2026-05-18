import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId  } from "../lib/socket.js";
import Group from "../models/groupSchema.js";
import Message from "../models/messageSchema.js";

export const getGroups = async(req,res) => {
    try {
        const userId = req.user._id

        if(!userId) return res.status(400).json({message: "User not authorized"});

        const groups = await Group.find({members: userId}).populate("members", "_id fullName profilePic");

        const groupsWithLastMessage = await Promise.all(
            groups.map(async(group) => {
                const lastMessage = await Message.findOne({
                    group: group._id
                })
                .sort({createdAt: -1})
                .select("text image audio senderId createdAt")
                .populate("senderId", "fullName")

                return {
                    ...group.toObject(),
                    lastMessage: lastMessage ? {
                        text: lastMessage.text || null,
                        image: lastMessage.image ? true : false,
                        audio: lastMessage.audio ? true : false,
                        senderId: lastMessage.senderId._id,
                        senderName: lastMessage.senderId.fullName,
                        createdAt: lastMessage.createdAt,
                    }
                    : null
                }
            }) 
        )

        groupsWithLastMessage.sort((a,b) => {
            if(!a.lastMessage && !b.lastMessage) return 0
            if(!a.lastMessage) return 1
            if(!b.lastMessage) return -1

            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
        })

        return res.status(200).json(groupsWithLastMessage)
    } catch (error) {
        console.error("Error in getGroups",error.message)
        return res.status(400).json(error.message)
        
    }
}

export const addGroup = async(req,res) => {
    try {
        const userId = req.user._id;
        const {name, description, members} = req.body

        if(!name || !members || members.length < 2) return res.status(400).json({message: "name required and Group should consist of more than 2 members"})

        const newGroup = new Group({
            name: name,
            description: description,
            members: [...new Set([...members.map(id => id.toString()), userId.toString()])]
        })

        await newGroup.save();

        const group = await Group.findById(newGroup._id)
            .populate("members", "fullName email");

        if(group){
            return res.status(200).json(group)
        }
    } catch (error) {
        console.error("Error in addGroup",error.message)
    }
}

export const getGroupMessage = async(req,res) => {
    try {
        const {id: groupId} = req.params
        const userId = req.user?._id

        if(!groupId) return res.status(400).json({message: "Invalid Data"})

        const group = await Group.findById(groupId)

        if(!group) return res.status(400).json({message: `No Group found with ${groupId}`})

        const messages = await Message.find({group: groupId})
            .populate("senderId", "fullName profilePic")
            .sort({ createdAt: 1 });


        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            text: msg.text,
            image: msg.image,
            audio: msg.audio,
            createdAt: msg.createdAt,
            group: msg.group,
            sender: msg.senderId, 
            deliveredTo: msg.deliveredTo,
            readBy: msg.readBy,    
        }));

        return res.status(200).json(formattedMessages);
        
    } catch (error) {
        console.error("Error fetching group messages:", error.message);
        res.status(500).json({ message: "Failed to fetch group messages" });
    }
}

export const sendGroupMessage = async(req, res) => {
    try {
        const { text, image, audio } = req.body;
        const { id: groupId } = req.params;
        const senderId = req.user._id;

        if (!groupId || !text) {
            return res.status(400).json({ message: "Invalid Message Data" });
        }

        const group = await Group.findById(groupId);

        if (!group || !group.members.includes(senderId))
            return res.status(400).json({ message: "Group doesn't exist or you are not allowed to message in the group" });

        let imageUrl;
        if (image) {
            const response = await cloudinary.uploader.upload(image);
            imageUrl = response.secure_url;
        }

        let audioUrl;
        if (audio) {
            const response = await cloudinary.uploader.upload(audio, {
                resource_type: "video",
                folder: "audio_messages"
            });
            audioUrl = response.secure_url;
        }

        const now = new Date();

        // ✅ Pre-populate deliveredTo with ALL members who are online right now
        const initialDeliveredTo = [{ user: senderId, at: now }]; // sender always included

        for (const memberId of group.members) {
            if (memberId.toString() === senderId.toString()) continue; // skip sender

            const memberSocketId = getReceiverSocketId(memberId.toString());
            if (memberSocketId) {
                // This member is online — mark as delivered immediately
                initialDeliveredTo.push({ user: memberId, at: now });
            }
        }

        const groupMessage = new Message({
            senderId,
            text,
            image: imageUrl,
            audio: audioUrl,
            receivers: group.members,
            group: group._id,
            deliveredTo: initialDeliveredTo,          // ✅ all online members included
            readBy: [{ user: senderId, readAt: now }], // sender has "read" their own message
        });

        await groupMessage.save();

        const populatedMessage = await Message.findById(groupMessage._id)
            .populate("senderId", "fullName profilePic");

        const formattedMessage = {
            _id: populatedMessage._id,
            text: populatedMessage.text,
            image: populatedMessage.image,
            audio: populatedMessage.audio,
            createdAt: populatedMessage.createdAt,
            group: populatedMessage.group,
            sender: populatedMessage.senderId,
            deliveredTo: populatedMessage.deliveredTo,
            readBy: populatedMessage.readBy,
        };

        io.to(groupId).emit("newGroupMessage", formattedMessage);

        // ✅ Check if all members are already online → emit delivered immediately
        const otherMembers = group.members.filter(
            m => m.toString() !== senderId.toString()
        );
        const allDelivered = otherMembers.every(
            m => getReceiverSocketId(m.toString())
        );

        if (allDelivered) {
            const senderSocketId = getReceiverSocketId(senderId.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit("groupMessageDelivered", {
                    messageId: groupMessage._id,
                    userId: senderId,
                    at: now
                });
            }
        }

        return res.status(200).json(formattedMessage);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

