import { io } from "socket.io-client"
import { buildApiUrl } from "../config/api"
import { getAuthToken } from "./authToken"

let socketInstance = null

const getRealtimeServerUrl = () => String(buildApiUrl("")).replace(/\/+$/, "")

export const getRealtimeClient = () => {
  if (socketInstance) return socketInstance

  const token = getAuthToken()
  socketInstance = io(getRealtimeServerUrl(), {
    transports: ["websocket", "polling"],
    auth: token ? { token } : {},
  })

  return socketInstance
}

export const refreshRealtimeAuth = () => {
  if (!socketInstance) return
  const token = getAuthToken()
  socketInstance.auth = token ? { token } : {}
  if (!socketInstance.connected) {
    socketInstance.connect()
  }
}
