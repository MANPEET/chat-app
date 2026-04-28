import { Check } from "lucide-react";
import useGroupStore from "../../store/useGroupStore";



const UsersList = ({users,value}) => {

    const {members,setMembers} = useGroupStore();


  const handleChange = (user) => {
    if(members?.includes(user)){
        setMembers(members.filter((User) =>  User != user))
    }
    else{
        setMembers([...members, user]);
    }
  };

    const filteredUsers = users.filter((user) => user.fullName.toLowerCase().includes(value.toLowerCase()))
    return (
        <div className="px-2 py-1.5 border-b-base-300 border-b">
            {
                filteredUsers.length === 0 
                ? (
                    <p className="text-center text-sm font-bold text-white/90 py-6">No users found.</p>
                )
                :(
                    filteredUsers.map((user, i) => (

                        <div className="flex items-center gap-4 hover:bg-primary/20 rounded-sm py-1.5 px-2 mb-1 text-sm" key={i} 
                        onClick={() => handleChange(user)}>

                            <div className="avatar w-10 h-10 shrink-0">
                                <img src={user.profilePic || "/avatar.png"} alt="Profile Pic" className="aspect-square rounded-full h-full w-full object-cover" />
                            </div>
                            <div className="ml-2">
                                <p className="font-bold  text-white">{user.fullName}</p>
                                <span className="text-muted-foreground">{user.email}</span>
                            </div>

                            {members?.includes(user) ? 
                            (
                                <div className="ml-auto">
                                    <Check className="w-4 h-4"/>
                                </div>
                            )
                            : ""}
                        </div>
                )
            ))}
        </div>
    );
};



export default UsersList;