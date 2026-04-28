import { useState } from "react";
import useChatStore from "../../store/useChatStore";
import { Search } from "lucide-react";
import UsersList from "./UsersList";

const GroupMembers = () => {
    const[text,setText] = useState("");
    const {users} = useChatStore();
    return(
        <>
            <div className="flex items-center gap-3 border-b-base-300 border-b px-4">
                <Search className="w-4 h-4"/>
                <input
                    value={text}
                    onChange={(e) =>setText(e.target.value)}
                    placeholder="Search user..."
                    autoComplete="off"
                    className="bg-base-100 w-full h-10 text-sm outline-none"
                />
            </div>
            <div>
                 <UsersList users={users} value={text}/>
            </div>
        </>
    )
}

export default GroupMembers