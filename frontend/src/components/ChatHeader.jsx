import { X } from "lucide-react"
import useChatStore from "../store/useChatStore"
import { useAuthStore } from "../store/useAuthStore"


const ChatHeader = () => {
    const {selectedUsers, setSelectedUsers, isTyping,users} = useChatStore()
    const {onlineUsers} = useAuthStore()


    const handleStatus = (userId) =>{
        const user = users.find(user => user._id === userId)
        if(user) return true;
    }


    return (
        <div className="border-base-300 border-b p-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img
                                src={selectedUsers.profilePic || "/avatar.png"}
                                alt={selectedUsers.name}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="font-medium">{selectedUsers.fullName || selectedUsers.name}</div>
                        <div className="text-sm text-zinc-400">
                            {selectedUsers.members 
                                ? selectedUsers.members.map((member) => member.fullName).join(", ") // Ensures no trailing comma
                                : handleStatus(selectedUsers._id) &&
                                    (isTyping ? "Typing.." : onlineUsers.includes(selectedUsers._id) ? "Online" : "Offline")
                            }
                        </div>
                    </div>
                </div>

                <button onClick={() => setSelectedUsers(null)}>
                        <X />
                </button>
            </div>
        </div>
    )
}

export default ChatHeader