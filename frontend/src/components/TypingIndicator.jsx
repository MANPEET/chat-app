const TypingIndicator = ({ typingUsers, isGroupChat }) => {
    if (!typingUsers || typingUsers.length === 0) return null;

    const displayUsers = typingUsers.slice(0, 2);
    const names = displayUsers.map(u => u.fullName?.split(" ")[0]).join(" & ");
    const suffix = typingUsers.length === 1 ? " is typing..." : " are typing...";

    return (
        <div className="chat chat-start">
            <div className="chat-image avatar">
                <div className="flex flex-row-reverse">
                    {displayUsers.map((user, i) => (
                        <div
                            key={user._id}
                            className="size-8 rounded-full border border-base-300 overflow-hidden bg-base-200"
                            style={{ marginLeft: i > 0 ? "-10px" : "0", zIndex: displayUsers.length - i }}
                        >
                            <img
                                src={user.profilePic || "/avatar.png"}
                                alt={user.fullName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="chat-header mb-1">
                {isGroupChat && (
                    <span className="text-xs opacity-50 ml-1">{names}</span>
                )}
            </div>
            <div className="chat-bubble flex flex-col">
                {isGroupChat && (
                    <span className="text-xs opacity-60 mb-1">{names + suffix}</span>
                )}
                <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(i => (
                        <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-current opacity-50 animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s`, animationDuration: "1.2s" }}
                        />
                    ))}
                </div>
            </div>
            <div className="chat-footer">
                {!isGroupChat && (
                    <time className="text-xs opacity-50 ml-1">{names + suffix}</time>
                )}
            </div>
        </div>
    );
};

export default TypingIndicator;