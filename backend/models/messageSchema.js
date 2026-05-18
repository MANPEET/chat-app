import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    receivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    audio: {
        type: String,
    },
    group:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },

    //1 on 1 chat
    isDelivered : { type: Boolean, default: false },
    readAt: { type: Date, default: null },

    //GroupChat
    deliveredTo: {
        type: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            at: { type: Date }
        }],
        default: [] 
    },

   readBy: {
        type: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            readAt: { type: Date }
        }],
        default: [] 
    },

}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;
