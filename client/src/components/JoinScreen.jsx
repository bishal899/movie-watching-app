import { useState } from 'react'
import './JoinScreen.css'

export default function JoinScreen({setUsername, onJoin}) {
    const [input, setInput] = useState('')

    function handleClick() {
        if (!input.trim()) return
        setUsername(input)
        onJoin('lobby')
        setInput('')
    }
    return(
        <div className="join-screen">
            <p>enter an username to create or join room</p>
            <div className="join-input">
                <input type="text" required placeholder='type your name' value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleClick()} />
                <button onClick={handleClick}>continue</button>
            </div>
        </div>
    )
}
