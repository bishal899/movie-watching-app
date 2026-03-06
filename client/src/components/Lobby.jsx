import './Lobby.css'
import { socket } from '../socket'
import { useContext, useState } from 'react'
import { UserContext } from '../UserContext'

export default function Lobby({ setRoomId, onCreateOrJoin, setMemberStatus }) {
    const userProps = useContext(UserContext)
    const [input, setInput] = useState('')
    const [error, setError] = useState(null)
    const username = userProps.username
    
    function createRoom() {
        socket.emit('create-room', username, (response) => {
            setRoomId(response.roomId)
            setMemberStatus(response.memberStatus)
            onCreateOrJoin('room')
        })
    }

    function joinRoom() {
        if(!input.trim()) return
        socket.emit('join-room', { username, roomId: input.toUpperCase() }, (response) => {
            if (response.error) {
                setError(response.error)
                return
            }
            setRoomId(input.toUpperCase())
            setMemberStatus(response.memberStatus)
            onCreateOrJoin('room')
        })
    }

    return (
        <div className="lobby-screen">
            <div className="create-or-join">
                <div className="create">
                    <p>create a room</p>
                    <button className='btn create' onClick={createRoom}>create</button>
                </div>

                <div className="join">
                    <p>join a room</p>
                    <input
                        type="text"
                        placeholder='type invitation code'
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                        required
                    />
                    <span>{error && `* ${error}`}</span>
                    <button className='btn join' onClick={joinRoom}>join</button>
                </div>
            </div>
        </div>
    )
}
