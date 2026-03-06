import { useContext, useState, useEffect } from 'react'
import './Room.css'
import InputForm from './InputForm'
import { IoCopy } from "react-icons/io5";
import { LuCopyCheck } from "react-icons/lu";
import { UserContext } from '../UserContext';
import Peer from 'peerjs'
import { useRef } from 'react';
import { socket } from '../socket';

function Room({ roomId }) {
    const userContext = useContext(UserContext)
    const memberStatus = userContext.memberStatus // 'host' or 'guest'
    const [active, setActive] = useState('') // to trigger display of video element
    const [inputUrl, setInputUrl] = useState('') // to store the url input before activating the box
    // const [url, setUrl] = useState(null) // to store the url that will be passed to the video element
    const [copied, setCopied] = useState(false)
    const [dot, setDot] = useState('')
    const [peerIds, setPeerIds] = useState([]) // to track all active peer IDs in the room
    const peerRef = useRef(null) // to store the peer instance so it can be accessed in different useEffects
    const remoteVideoRef = useRef(null) // to set the srcObject when a stream is received from the host
    const hostVideoRef = useRef(null) // to set the src and capture stream when the host loads a video
    const streamRef = useRef(null)

    useEffect(() => {
        const interval = setInterval(() => {
            if (dot.length < 3) {
                setDot(d => d + '.')
            } else {
                setDot('')
            }
        }, (1000));
        return () => clearInterval(interval)
    }, [dot])

    useEffect(() => {
        const peer = new Peer({
            config: {
                iceServers: [
                    // STUN servers for NAT detection
                    { urls: ['stun:stun.l.google.com:19302'] },
                    // Free TURN server for relay when P2P fails
                    {
                        urls: ['turn:openrelay.metered.ca:80'],
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    }
                ]
            }
        }) // create a new peer with a random id

        // when the peer connection is established, send the peerId to the server so it can be shared with other members in the room
        peer.on('open', (peerId) => {
            peerRef.current = peer
            socket.emit('peer-id', { peerId })
        })

        // when a call is received, answer it and set the remote stream to the video element
        peer.on('call', (call) => {
            try {
                call.answer(null) // members don't send stream back
                peer.on('call', (call) => {
                    call.answer()
                    call.on('stream', (remoteStream) => {
                        remoteVideoRef.current.srcObject = remoteStream
                        remoteVideoRef.current.muted = true
                        remoteVideoRef.current.play().catch(err => {
                            console.log('Autoplay blocked:', err)
                            // Show a "tap to play" button as fallback
                            // setShowPlayButton(true)
                        })
                    })
                })
                call.on('error', (err) => {
                    console.error('Guest: Call error:', err)
                })
            } catch (err) {
                console.error('Guest: Error answering call:', err)
            }
        })

        peer.on('error', (err) => {
            console.error('Peer error:', err)
        })

        // clean up function to destroy the peer when the component unmounts
        return () => peer.destroy()
    }, [])

    useEffect(() => {
        socket.on('peer-joined', ({ peerId }) => {
            // Store the peer ID when any peer joins
            setPeerIds(prev => [...prev, peerId])

            // Only host calls the new member
            if (memberStatus !== 'host') return

            if (!streamRef.current) {
                return // host hasn't loaded a video yet
            }

            // console.log('Host: Calling peer with stream:', peerId)
            try {
                const call = peerRef.current.call(peerId, streamRef.current)
                call.on('stream', () => {
                    console.log('Host: member connected to stream')
                })
                call.on('error', (err) => {
                    console.error('Host: Call error:', err)
                })
            } catch (err) {
                console.error('Host: Error calling peer:', err)
            }
        })

        return () => socket.off('peer-joined')
    }, [memberStatus])

    function handleFileSelect(e) {
        const file = e.target.files[0]
        const videoUrl = URL.createObjectURL(file)
        setInputUrl(videoUrl)
    }

    function handleActiveBox() {
        if (!inputUrl.trim()) return
        setActive('active')
        // console.log('activating box with url:', inputUrl)
        // setUrl(inputUrl)

        hostVideoRef.current.src = inputUrl
        hostVideoRef.current.muted = false

        hostVideoRef.current.onloadedmetadata = async () => {
            try {
                await hostVideoRef.current.play()
                const stream = hostVideoRef.current.captureStream()

                if (!stream || !stream.active) {
                    console.error('Host: Failed to capture stream or stream is inactive')
                    return
                }

                streamRef.current = stream // store it so late joiners can be called
                // console.log('Host: Stream captured successfully. Active tracks:', stream.getTracks().length)

                // Call all existing peers (handles late joiners)
                if (peerIds.length > 0) {
                    peerIds.forEach(peerId => {
                        try {
                            const call = peerRef.current.call(peerId, stream)
                            call.on('stream', () => {
                                console.log('Host: peer connected to stream:', peerId)
                            })
                            call.on('error', (err) => {
                                console.error('Host: Call error for peer', peerId, ':', err)
                            })
                        } catch (err) {
                            console.error('Host: Error calling peer', peerId, ':', err)
                        }
                    })
                } else {
                    console.log('Host: No peers in room yet')
                }
            } catch (err) {
                console.error('Host: Error loading video or capturing stream:', err)
            }
        }
    }

    async function copyRoomId() {
        await navigator.clipboard.writeText(roomId)
        setCopied(true)
        setTimeout(() => {
            setCopied(false)
        }, 2000);
    }

    return (
        <div className='room'>
            <p className='room-id' onClick={copyRoomId}>Room Id: {roomId} {
                copied
                    ? <LuCopyCheck className='copy' />
                    : <IoCopy className='copy' />
            }</p>
            <div className="video-container">
                <div className={`box ${active}`}>
                    <video
                        ref={memberStatus === 'host' ? hostVideoRef : remoteVideoRef}
                        autoPlay
                        muted
                        controls
                    />
                </div>
                {
                    memberStatus === 'host'
                        ? <InputForm activeBox={handleActiveBox} handleChange={handleFileSelect} />
                        : active === '' && <p className='waiting'>waiting{dot}</p>
                }
            </div>
        </div>
    )
}

export default Room