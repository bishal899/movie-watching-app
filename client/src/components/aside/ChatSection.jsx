import './ChatSection.css'
// import { FaAngleDown } from "react-icons/fa6";
import { FaUserCircle } from "react-icons/fa";
import { BiSend } from "react-icons/bi";
import { useContext, useState, useRef, useEffect } from 'react';
import { UserContext } from '../../UserContext';
import { socket } from '../../socket';

function ChatSection() {
    const userProps = useContext(UserContext)
    const messages = userProps.messages
    const username = userProps.username
    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    function sendMessage() {
        socket.emit('send-message', username, input)
        setInput('')
    }

    return (
        <div className="chat-section">
            <div className="heading">
                <p>chat</p>
                {/* <FaAngleDown /> */}
            </div>
            <div className="chat-container">
                <div className="messages-container">
                    {
                        messages.map((message, i) => (
                            message.type === 'system'
                                ? <p className="system" key={i}>{message.text}</p>
                                : <div className="message" key={i}>
                                    <FaUserCircle className='user' size={18} />
                                    <div className="text-area">
                                        <div className="username-time">
                                            <span>{message.username}</span>
                                            <span>{message.time}</span>
                                        </div>
                                        <div className="text">
                                            {message.message}
                                        </div>
                                    </div>
                                </div>
                        ))
                    }
                    <div ref={messagesEndRef} />

                    {/* <div className="message">
                        <FaUserCircle className='user' size={18} />
                        <div className="text-area">
                            <div className="username-time">
                                <span>user</span>
                                <span>time</span>
                            </div>
                            <div className="text">
                                hello users
                            </div>
                        </div>
                    </div> */}

                </div>
                <div className="send-message-container">
                    <input type="text" placeholder='type message' value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
                    <BiSend className='send-btn' onClick={sendMessage} />
                </div>
            </div>
        </div>
    )
}

export default ChatSection