import { MessageSquare } from "lucide-react"

export const NoChatSelected = () =>{
    return (
        <div className="w-full flex flex-1 justify-center items-center flex-col bg-base-100/50 p-16">
            <div className="max-w-md text-center space-y-6">
                <div className="flex justify-center gap-4 mb-4">
                    <div className="relative">
                        <div
                        className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
                        justify-center animate-bounce"
                        >
                        <MessageSquare className="w-8 h-8 text-primary"/>
                        </div>
                    </div>
                </div>

                <h2 className="font-semibold text-2xl">Welcome to Chatty!</h2>
                <p className="text-base-content/60">
                Select a conversation from the sidebar to start chatting
                </p>
            </div>
        </div>
    )
}