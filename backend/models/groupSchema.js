import mongoose from "mongoose";

const groupSchema = mongoose.Schema({
    name: {
        type: String
    },
    description: {
        type: String,
    },
    members:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true
        }
    ],
})

const Group = new mongoose.model("Group",groupSchema)

export default Group;