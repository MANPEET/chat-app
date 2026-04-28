import { NotebookPen, Users } from "lucide-react"
import useGroupStore from "../..//store/useGroupStore"
import { useState } from "react"


const GroupDetails = () =>{
    const[name,setName] = useState("")
    const[description,setDescription]=useState("")
    const {addGroup,members} = useGroupStore()

    return (
        <form className="p-4 border-b-base-300 border-b flex flex-col gap-2">
            <div className="space-y-1.5 mb-4">
                <div className="text-md text-white mb-1 flex items-center gap-2">
                    <Users className="w-4 h-4" onClick={async() => await addGroup({
                        name:name,
                        description:description,
                        members:members.map(m => m._id)
                    })}/>
                    <p className="font-semibold">Group Name</p>
                </div>
                <input type="text" 
                className="h-full w-full border text-zinc-400 rounded-lg px-3 py-1.5 bg-base-200 outline-none text-sm" 
                placeholder="Enter Group Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
                
            </div>

            <div className="space-y-1.5 mb-4">
                <div className="text-md text-white mb-1 flex items-center gap-2">
                    <NotebookPen className="w-4 h-4" />
                    <p className="font-semibold">Group Description</p>
                </div>
                <textarea type="text" 
                className="h-full w-full border text-zinc-400 rounded-lg px-3 py-1.5 bg-base-200 outline-none text-sm overflow-hidden
                resize-none" 
                placeholder="Enter Group Description"
                row="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                />
            </div>
        </form>
    )
}

export default GroupDetails