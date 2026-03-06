import './App.css'
import { lazy, Suspense, useEffect, useState } from 'react'
// import JoinScreen from './components/JoinScreen'
// import Lobby from './components/Lobby'
// import Room from './components/Room'
import { UserContext } from './UserContext'
import Aside from './components/aside/Aside'
import { socket } from './socket'
import Loading from './components/Loading'

const JoinScreen = lazy(() => import('./components/JoinScreen'))
const Lobby = lazy(() => import('./components/Lobby'))
const Room = lazy(() => import('./components/Room'))

function App() {
  // 3 screens = 'join', 'lobby, 'room'
  const [screen, setScreen] = useState('join')
  const [username, setUsername] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [memberStatus, setMemberStatus] = useState(null)

  useEffect(() => {
    socket.on('system-message', (text) => {
      setMessages(prev => [...prev, { text, type: 'system' }])
    })

    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, { ...msg, type: 'user' }])
    })

    socket.on('update-members', (members) => {
      setUsers(members)
    })

    socket.on('peer-joined', ({ peerId }) => {
      console.log(peerId)
    })

    return () => {
      socket.off('system-message')
      socket.off('receive-message')
      socket.off('update-members')
      socket.off('peer-joined')
    }
  }, [])

  return (
    <UserContext.Provider value={{ username, users, messages, memberStatus }}>
      <div className="home-page">
        {roomId && <Aside />}
        <div className="main-container">
          <h1>watch with friends</h1>
          {
            screen === 'join'
              ? <Suspense fallback={<Loading />}>
                  <JoinScreen 
                    setUsername={setUsername} 
                    onJoin={setScreen} />
                </Suspense>
              : screen === 'lobby'
                ? <Suspense fallback={<Loading />}>
                    <Lobby 
                      setRoomId={setRoomId} 
                      onCreateOrJoin={setScreen} 
                      setMemberStatus={setMemberStatus} />
                  </Suspense>
                : <Suspense fallback={<Loading />}>
                    <Room roomId={roomId} />
                  </Suspense>
          }
        </div>
      </div>
    </UserContext.Provider>
  )
}

export default App
