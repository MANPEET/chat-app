import { ArrowLeft, X } from "lucide-react"

import useGroupStore from "../../store/useGroupStore";
import GroupDetails from "./GroupDetails";
import GroupMembers from "./GroupMembers";


export const AddGroup = () => {
    const{detailPageOpen,setDetailPageOpen,members,setShowAddGroupDialog} = useGroupStore()


    return(
        <>
            <div data-state="open" className="fixed inset-0 z-50 bg-base-300/70 data-[state=open]:animate-in data-[state=closed]:
            animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" data-aria-hidden="true" aria-hidden="true"
            onClick={() => setShowAddGroupDialog(false)}
            >
            </div>

            <div className="fixed z-50 left-[50%] top-[50%] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-base-300" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-base-100 rounded-lg py-3">
                        <header className="border-b-base-300 border-b px-4">
                            <div className="flex justify-between">
                                <div className="flex gap-4 items-center">
                                    {detailPageOpen ? <ArrowLeft className="w-5 h-5 cursor-pointer" onClick={() => setDetailPageOpen(false)}/> : ""}
                                    <h2 className="text-white font-semibold text-lg">New Group</h2>
                                </div>
                                <button onClick={() => setShowAddGroupDialog(false)}>
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                            <p className={`text-sm mb-4 ${detailPageOpen ? "ml-9" : ""}`}>Invite a user to create a new group message.</p>
                        </header>
                        {
                            detailPageOpen ? <GroupDetails /> : <GroupMembers />
                        }
                       
                        <div className="flex sm:flex-row sm:space-x-2 items-center p-4 justify-between">
                            <div className="text-muted-foreground text-sm">
                                {members?.length !=0 ? (

                                    members?.map((user) => (
                                        <div className="-space-x-2 overflow-hidden inline-block">
                                            <img
                                            key={user._id} 
                                            src={user.profilePic || "/avatar.png"}
                                            alt={user.fullName} 
                                            className="w-8 h-8 rounded-full object-cover" 
                                            />
                                        </div>
                                    ))
                                ) : (
                                <span>Select users to add to this thread</span>)
                                }
                            </div>
                            <button 
                            className={`rounded-md py-2 px-4 text-white ${
                            members?.length >= 2
                                ? "bg-primary"
                                : "bg-primary/10 cursor-not-allowed"
                            }`}
                            disabled={members?.length < 2}
                            onClick={() => setDetailPageOpen(true)}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
            </div>
        </>
    )}


