import { io } from 'socket.io-client'
const URL =  'http://localhost:4001'
export const socket = io(URL)

// 'https://movie-watching-app.onrende.com'