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
                    {
                        urls: [
                            'stun:stun.l.google.com:19302',
                            'stun:stun1.l.google.com:19302',
                            'stun:stun2.l.google.com:19302'
                        ]
                    },
                    // Free TURN server for relay when P2P fails
                    {
                        urls: ['turn:openrelay.metered.ca:80'],
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    },
                    {
                        urls: [
                            "stun:stun.cloudflare.com:3478",
                            "turn:turn.cloudflare.com:3478?transport=udp",
                            "turn:turn.cloudflare.com:3478?transport=tcp",
                            "turns:turn.cloudflare.com:5349?transport=tcp"
                        ],
                        username: "g048add38be332105c89e4ed048b326c3debec056ca0705d32dbb5d63104e983",
                        credential: "670d9ae88ae73d16c61ffad9686ebf17dd6d82472c4a74090d6c83771332c5b9"
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

                call.on('stream', (remoteStream) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = remoteStream
                        setActive('active') // Show the video container when stream is received
                    } else {
                        console.error('Guest: remoteVideoRef is not available')
                    }
                })

                call.on('error', (err) => {
                    console.error('Guest: Call error:', err)
                })

                call.on('close', () => {
                    console.log('Guest: Call closed')
                })
            } catch (err) {
                console.error('Guest: Error answering call:', err)
            }
        })

        peer.on('error', (err) => {
            console.error('Peer connection error:', err)
        })

        peer.on('disconnected', () => {
            console.warn('Peer disconnected')
        })

        // clean up function to destroy the peer when the component unmounts
        return () => peer.destroy()
    }, [])

    useEffect(() => {
        socket.on('peer-joined', ({ peerId }) => {
            console.log('Host: Peer joined event received:', peerId, 'memberStatus:', memberStatus)

            // Store the peer ID when any peer joins
            setPeerIds(prev => [...prev, peerId])

            // Only host calls the new member
            if (memberStatus !== 'host') {
                console.log('Not host, skipping call')
                return
            }

            if (!streamRef.current) {
                console.log('Host: No stream yet, returning. Guest peerId stored:', peerId)
                return // host hasn't loaded a video yet
            }

            console.log('Host: Calling peer with stream:', peerId)
            try {
                const call = peerRef.current.call(peerId, streamRef.current)
                // console.log('Host: Call object created:', !!call)

                call.on('stream', () => {
                    console.log('Host: member connected to stream')
                })
                call.on('error', (err) => {
                    console.error('Host: Call error:', err)
                })
                call.on('close', () => {
                    console.log('Host: Call to peer', peerId, 'closed')
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
        console.log('Host: Loading video from:', inputUrl)
        // setUrl(inputUrl)

        hostVideoRef.current.src = inputUrl
        hostVideoRef.current.muted = false
        hostVideoRef.current.crossOrigin = 'anonymous'

        hostVideoRef.current.onloadedmetadata = async () => {
            // console.log('Host: Video metadata loaded')
            try {
                const playPromise = await hostVideoRef.current.play()
                console.log('Host: Video playing', playPromise)

                const stream = hostVideoRef.current.captureStream(30) // 30 FPS
                // console.log('Host: captureStream returned:', !!stream)

                if (!stream) {
                    console.error('Host: captureStream returned null')
                    return
                }

                const tracks = stream.getTracks()
                // console.log('Host: Stream tracks count:', tracks.length)

                if (tracks.length === 0) {
                    console.error('Host: Stream has no tracks')
                    return
                }

                tracks.forEach((track, index) => {
                    console.log(`Host: Track ${index}:`, track.kind, 'enabled:', track.enabled)
                })

                streamRef.current = stream // store it so late joiners can be called
                console.log('Host: Stream stored in ref')

                // Call all existing peers (handles late joiners)
                if (peerIds.length > 0) {
                    // console.log('Host: Calling', peerIds.length, 'existing peers')
                    peerIds.forEach(peerId => {
                        try {
                            // console.log('Host: Calling peer:', peerId)
                            const call = peerRef.current.call(peerId, stream)

                            call.on('stream', () => {
                                console.log('Host: peer connected and sent stream:', peerId)
                            })
                            call.on('error', (err) => {
                                console.error('Host: Call error for peer', peerId, ':', err)
                            })
                            call.on('close', () => {
                                console.log('Host: Call to peer', peerId, 'closed')
                            })
                        } catch (err) {
                            console.error('Host: Error calling peer', peerId, ':', err)
                        }
                    })
                } else {
                    console.log('Host: No peers in room yet, waiting for guests to join')
                }
            } catch (err) {
                console.error('Host: Error loading video or capturing stream:', err)
            }
        }

        hostVideoRef.current.onerror = (error) => {
            console.error('Host: Video error:', error)
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