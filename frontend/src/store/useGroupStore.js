import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import useChatStore from "./useChatStore";

const useGroupStore = create((set,get) => ({
    groups:[],
    detailPageOpen:false,
    groupScreen: false,
    members: [], 
    showAddGroupDialog:false,

  
    getGroups: async() =>{
        try{
            const res = await axiosInstance.get(`/groups/get-group`)
            set({groups :res.data})
        }
        catch(error){
            toast.error("Error in fetching groups")
        }
    },

    addGroup: async(groupData) => {
        const { groups } = get();
        try {
            if (!groupData.name) {
                toast.error("Name is required");
                return;
            }
    
            const res = await axiosInstance.post(`/groups/add-group`, groupData);
            set((state) => ({
                groups: [...state.groups, res.data],
                showAddGroupDialog: false,
                detailPageOpen: false,
                members: [],
            }));

            
            toast.success("Group created successfully");
        } catch (error) {
            console.error("Error in adding groups", error);
        }
    },

    getGroupMessage: async (groupId) => {
        try {
            const res = await axiosInstance.get(
                `/groups/get-group-message/${groupId}`
            );

            useChatStore.setState({ messages: res.data });
        } catch (error) {
            console.error(error);
            toast.error("Error fetching group messages");
        }
    },

    sendGroupMessage: async (messageData) => {
        try {
            await axiosInstance.post(
                `/groups/send-group-message/${messageData.groupId}`,
                messageData
            );

        } catch (error) {
            console.error("Error sending group message", error);
        }
    },
    

    setDetailPageOpen: (detailPageOpen) => set({detailPageOpen}),
    setGroupScreenLoaded: (groupScreen) => set({groupScreen}),
    setMembers: (members) => set({members}),
    setShowAddGroupDialog: (showAddGroupDialog) => set({showAddGroupDialog})
}))

export default useGroupStore