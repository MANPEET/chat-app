import { Camera, Mail, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore"
import { useState } from "react";

const ProfilePage = () => {

    const {isUpdatingProfile, authUser, updateProfile} = useAuthStore()
    const [selectedImg,setSelectedImg] = useState(null)
    const handleUpload = async(e) => {
        const file = e.target.files[0];

        if(!file) return

        const reader = new FileReader();
        reader.readAsDataURL(file)
        

        reader.onload = async() =>{
            const base64image = reader.result;
            setSelectedImg(base64image)
            await updateProfile({profilePic: base64image})
        }
    }

    return(
        <div className="h-screen pt-20">
            <div className="max-w-2xl mx-auto py-8 p-4">
                <div className="bg-base-300 rounded-xl p-6 space-y-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold">Profile</h1>
                        <p className="mt-2">Your Profile Information</p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <img src={selectedImg || authUser.profilePic || "/avatar.png"} alt="Profile" 
                            className="size-32 rounded-full onject-cover border-4"/>

                            <label 
                            htmlFor="avatar-upload"
                            className={`absolute bottom-0 right-0 bg-base-content hover:scale-105 p-2 rounded-full 
                                cursor-pointer transition-all duration-200
                                ${isUpdatingProfile  ? "animate-pulse pointer-events-none" : ""}
                            `}>
                                <Camera className="w-5 h-5 text-base-200" />
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    disabled={isUpdatingProfile}
                                />
                            </label>
                        </div>
                        <p className="text-zinc-400 text-sm">
                                {isUpdatingProfile ?  "Uploading..." : "Click the camera icon to update your photo"}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <p className="font-semibold">Full Name</p>
                            </div>
                            <p className="h-full border rounded-lg px-4 py-2.5 bg-base-200">{authUser?.fullName}</p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <p className="font-semibold">Email Address</p>
                            </div>
                            <p className="h-full border rounded-lg px-4 py-2.5 bg-base-200">{authUser?.email}</p>
                        </div>
                    </div>

                    <div className="px-6">
                        <h2 className="font-md text-zinc-400 text-lg mb-4">Account Information</h2>
                        <div className="space-y-3 text-sm">
                            <div className="py-2 flex items-center justify-between border-zinc-700 border-b text-zinc-400">
                                <span>Member Since</span>
                                <span>{authUser?.createdAt.split("T")[0]}</span>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="py-4 flex items-center justify-between border-zinc-700 border-b text-zinc-400">
                                <span>Account Status</span>
                                {authUser ? <span className="text-green-500">Active</span> : <span className="text-red-500">InActive</span>}
                            </div>
                        </div>
                    </div>
                </div>

                
            </div>
        </div>
    )
}

export default ProfilePage