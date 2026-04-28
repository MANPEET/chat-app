import { useEffect } from "react";
import useChatStore from "../store/useChatStore"
import { Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import useGroupStore from "../store/useGroupStore";

import { useState } from "react";
import { AddGroup } from "./Groups/AddGroup";

const Sidebar = () => {

    const {selectedUsers,getUsers,users,setSelectedUsers} = useChatStore();
    const {onlineUsers} = useAuthStore()
    const {getGroups,groups,showAddGroupDialog,setShowAddGroupDialog} = useGroupStore()

    useEffect(() =>{
        getGroups()
        getUsers()
    },[getUsers,getGroups])


    return(
        <>
            <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            
            <div className="border-b border-base-300 w-full p-5 pr-3 z-10 ">
                <div className="flex items-center w-full justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5"/>
                        <span className="font-semibold hidden lg:block">Contacts</span>
                    </div>

                    <button 
                        className="group relative cursor-pointer"
                        onClick={() => setShowAddGroupDialog(true)}
                    >
                        <div className="bg-base-100 w-8 h-8 rounded-full text-center text-white text-xl hover:bg-white/10 transition duration-200">
                            +
                        </div>
                        <div className="absolute  right-1 mb-2 w-max px-3 py-1 text-sm text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-colors z-50">
                            Create A Group
                        </div>
                    </button>
                </div>
            </div>
            
            <div className=" pb-3 w-full min-w-0 overflow-y-scroll">
                {(users).map((item,index) =>{
                    return(
                        <div
                        className={`flex justify-between p-3 items-center hover:bg-base-300 ${selectedUsers?._id === item._id ? "bg-base-300 ring-1 ring-base-300" : "" }`}
                        key={index}
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

                {(groups).map((group) => {
                    return(
                        <div
                            className={`flex justify-between p-3 items-center hover:bg-base-300 ${selectedUsers?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : "" }`}
                            key={group._id}
                        >
                            <button
                                onClick= {() => setSelectedUsers(group)}
                                className="w-full flex items-center gap-3 transition-colors"
                            >
                                <div className="relative mx-auto lg:mx-0">
                                    <img
                                        src={group.profilePic || "/avatar.png"}
                                        alt={group.name}
                                        className="size-12 rounded-full object-cover"
                                    />
                                </div>

                                <div className="hidden lg:block text-left">
                                    <div className="font-medium">{group.name}</div>
                                    <div className="text-md flex flex-wrap w-full">
                                        {group.members?.map((member,index) => (
                                            <div key={member._id} className="text-ellipsis mr-1 ">
                                                {member.fullName}
                                                {index < group.members.length - 1 && ", "}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </button>
                        </div>
                    )
                })}
            </div>
            </aside>

            {showAddGroupDialog && <AddGroup />}
        </>
    )
}

export default Sidebar