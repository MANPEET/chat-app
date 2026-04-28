import { Image, Send, X, Mic, Square } from "lucide-react";
import { useRef, useState } from "react"
import useChatStore from "../store/useChatStore";
import toast from "react-hot-toast";
import useGroupStore from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = () => {
    const [text, setText] = useState("")
    const [imagePreview, setImagePreview] = useState(null);
    const [audioPreview, setAudioPreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const fileInputRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const typingTimeoutRef = useRef(null);

    const { sendMessage, selectedUsers } = useChatStore()
    const { sendGroupMessage } = useGroupStore();
    const { socket } = useAuthStore();

    const isGroupChat = !!selectedUsers?.members;

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return;
        }
        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result)
        reader.readAsDataURL(file)
    }

    const removeImage = () => {
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
                const reader = new FileReader()
                reader.onloadend = () => setAudioPreview(reader.result)
                reader.readAsDataURL(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (error) {
            toast.error("Microphone access denied")
        }
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop()
        setIsRecording(false)
    }

    const removeAudio = () => setAudioPreview(null)

    const handleInputChange = (e) => {
        setText(e.target.value);

        if (!socket || !selectedUsers?._id) return;

        if (isGroupChat) {
            socket.emit("groupTyping", { groupId: selectedUsers._id });
        } else {
            socket.emit("typing", { receiverId: selectedUsers._id });
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (isGroupChat) {
                socket.emit("groupStopTyping", { groupId: selectedUsers._id });
            } else {
                socket.emit("stopTyping", { receiverId: selectedUsers._id });
            }
        }, 2000);
    };

    const handleMessage = async (e) => {
        e.preventDefault()
        if (!text.trim() && !imagePreview && !audioPreview) return

        if (socket) {
            if (isGroupChat) {
                socket.emit("groupStopTyping", { groupId: selectedUsers._id });
            } else {
                socket.emit("stopTyping", { receiverId: selectedUsers._id });
            }
        }
        clearTimeout(typingTimeoutRef.current);

        try {
            if (isGroupChat) {
                await sendGroupMessage({
                    text,
                    image: imagePreview,
                    audio: audioPreview,
                    groupId: selectedUsers._id
                })
            } else {
                await sendMessage({
                    text,
                    image: imagePreview,
                    audio: audioPreview,
                })
            }

            setText("")
            setImagePreview(null)
            setAudioPreview(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="p-4 w-full">
            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img src={imagePreview} className="w-20 h-20 object-cover rounded-lg border border-zinc-700" alt="Preview" />
                        <button type="button" onClick={removeImage} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center bg-base-300">
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}

            {audioPreview && (
                <div className="mb-3 flex items-center gap-2">
                    <audio src={audioPreview} controls className="h-8" />
                    <button type="button" onClick={removeAudio}>
                        <X className="size-4 text-zinc-400" />
                    </button>
                </div>
            )}

            <form onSubmit={handleMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        placeholder={isRecording ? "Recording..." : "Type a message..."}
                        value={text}
                        onChange={handleInputChange}
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                        disabled={isRecording}
                    />
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />

                    <button type="button" className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`} onClick={() => fileInputRef.current?.click()}>
                        <Image size={20} />
                    </button>
                    <button
                        type="button"
                        className={`hidden sm:flex btn btn-circle ${isRecording ? "text-red-500 animate-pulse" : "text-zinc-400"}`}
                        onClick={isRecording ? stopRecording : startRecording}
                    >
                        {isRecording ? <Square size={20} /> : <Mic size={20} />}
                    </button>
                </div>

                <button type="submit" className="btn btn-sm btn-circle" disabled={!text.trim() && !imagePreview && !audioPreview}>
                    <Send size={22} />
                </button>
            </form>
        </div>
    )
}

export default MessageInput