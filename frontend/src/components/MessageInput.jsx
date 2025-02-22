import { Image, Send, X } from "lucide-react";
import { useRef, useState } from "react"
import useChatStore from "../store/useChatStore";
import toast from "react-hot-toast";

const MessageInput = () => {
    const [text,setText] = useState("")
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null)
    const {sendMessage, setIsTyping,selectedUsers} = useChatStore()
    const typingTimeoutRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if(!file.type.startsWith("image/")){
            toast.error("Please select an image file")
            return;
        }
        const reader = new FileReader()
        reader.onloadend = () =>{
            setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const removeImage = () => {
        setImagePreview(null)
        console.log(fileInputRef.current)
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleMessage = async (e) =>{
        e.preventDefault()
        if(!text.trim() && !imagePreview) return

        try {
            await sendMessage({
                text:text,
                image: imagePreview
            })

            setText("")
            setImagePreview(null)

            if(fileInputRef.current) fileInputRef.current.value = ""
        } catch (error) {
            console.error(error)
            toast.error(error.response.data.message)
        }
    }

    const handleInputChange = (e) => {
        setText(e.target.value)
        setIsTyping(true);

        if(typingTimeoutRef.current){
            clearTimeout(typingTimeoutRef.current)
        }


        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1500);
    }
    return(
        <div className="p-4 w-full">
            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img src={imagePreview} className="w-20 h-20 object-cover rounded-lg border border-zinc-700" alt="Preview"/>
                        <button type="submit" className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center 
                        justify-center bg-base-300">
                            <X onClick={removeImage} className="size-3"/>
                        </button>
                    </div>
                </div>
            )}
            <form onSubmit={handleMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        value={text}
                        onChange={(e) =>{
                            handleInputChange(e)
                        }} 
                        ref={typingTimeoutRef}
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                    />

                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />

                    <button
                        type="button"
                        className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
                        onClick={()=>fileInputRef.current?.click()}
                    >
                        <Image size={20}/>
                    </button>
                </div>
                <button
                    type="submit"
                    className="btn btn-sm btn-circle"
                    disabled={!text.trim()}
                >
                    <Send size={22} />
                </button>
            </form>
        </div>
    )
}

export default MessageInput