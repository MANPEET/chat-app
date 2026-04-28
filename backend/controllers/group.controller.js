import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import Group from "../models/groupSchema.js";
import Message from "../models/messageSchema.js";

export const getGroups = async(req,res) => {
    try {
        const userId = req.user._id

        if(!userId) return res.status(400).json({message: "User not authorized"});

        const groups = await Group.find({members: userId}).populate("members", "_id fullName profilePic");

        return res.status(200).json(groups)
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
            createdAt: msg.createdAt,
            group: msg.group,
            sender: msg.senderId, 
        }));

        return res.status(200).json(formattedMessages);
        
    } catch (error) {
        console.error("Error fetching group messages:", error.message);
        res.status(500).json({ message: "Failed to fetch group messages" });
    }
}

export const sendGroupMessage = async(req,res) => {
    try {
        const {text,image} = req.body;
        const {id: groupId} = req.params;
        const senderId = req.user._id


        if(!groupId || !text ){
            return res.status(400).json({message: "Invalid Message Data"})
        }

        const group = await Group.findById(groupId)

        if(!group || !group.members.includes(senderId)) 
            return res.status(400).json({message: "Group doesn't exist or you are not allowed to message in the group"})

        let imageUrl;
        if(image){
            const response = await cloudinary.uploader.upload(image)
            imageUrl = response.secure_url; 
        }

        const groupMessage = new Message({
            senderId,
            text,
            image:imageUrl,
            receivers: group.members,
            group:group._id
        })

        if(groupMessage){
            await groupMessage.save();

            const populatedMessage = await Message.findById(groupMessage._id)
                .populate("senderId", "fullName profilePic");

            const formattedMessage = {
                _id: populatedMessage._id,
                text: populatedMessage.text,
                image: populatedMessage.image,
                createdAt: populatedMessage.createdAt,
                group: populatedMessage.group,
                sender: populatedMessage.senderId, 
            };

            io.to(groupId).emit("newGroupMessage", formattedMessage)
            return res.status(200).json(formattedMessage)
        }
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({message: "Internal Server Error"});
    }
}

