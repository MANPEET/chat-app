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
    }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;
