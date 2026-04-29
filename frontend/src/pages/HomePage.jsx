
import ChatContainer from "../components/ChatContainer"
import { NoChatSelected } from "../components/NoChatSelected"
import Sidebar from "../components/Sidebar"
import { useChatStore } from "../store/useChatStore"

const HomePage = () =>{

    const {selectedUsers,groupScreenLoaded} = useChatStore()
    return (
        <>
            
            <div className="h-screen bg-base-200 relative">
                <div className="flex itens-center justify-center pt-20 px-4">
                    <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-7xl h-[calc(100vh-7rem)]">
                        <div className="flex h-full rounded-lg overflow-hidden">
                            <Sidebar />
                            {selectedUsers ? <ChatContainer /> : <NoChatSelected />}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HomePage