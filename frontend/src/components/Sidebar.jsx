import { useEffect } from "react";
import useChatStore from "../store/useChatStore"
import { Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";


const Sidebar = () => {
    const {selectedUsers,getUsers,users,setSelectedUsers,isUsersLoading} = useChatStore();
    const {onlineUsers} = useAuthStore()


    useEffect(() =>{
        getUsers()
    },[getUsers])

    console.log(selectedUsers)

    return(
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            
            <div className="border-b border-base-300 w-full p-5 z-10">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5"/>
                    <span className="font-semibold hidden lg:block">Contacts</span>
                </div>
            </div>
            
            <div className=" pb-3 w-full min-w-0">
                {(users).map((item) =>{
                    return(
                        <div
                        className={`flex justify-between p-3 items-center hover:bg-base-300 ${selectedUsers?._id === item._id ? "bg-base-300 ring-1 ring-base-300" : "" }`}
                        key={item._id}
                        >
                            <button
                                onClick= {() => setSelectedUsers(item)}
                                className="w-full flex items-center gap-3 transition-colors"
                            >
                                <div className="relative mx-auto lg:mx-0">
                                    <img
                                        src={item.profilePic || "/avatar.png"}
                                        alt={item.name}
                                        className="size-12 rounded-full object-cover"
                                    />
                                    {onlineUsers.includes(item._id) && (
                                        <span className="absolute bottom-0 right-0 bg-green-500 ring-2 size-3 ring-zinc-900 rounded-full"/>
                                    )}
                                </div>

                                <div className="hidden lg:block text-left">
                                    <div className="font-medium truncate">{item.fullName}</div>
                                    <div className="text-sm text-zinc-400">
                                        {onlineUsers.includes(item._id) ? "Online" : "Offline"}
                                    </div>
                                </div>
                            </button>

                            
                        </div>
                        
                    )   
                })}

            </div>
        </aside>
    )
}

export default Sidebar