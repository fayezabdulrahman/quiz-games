import { QRCodeSVG } from 'qrcode.react'

export default function RoomJoinQrCode({ joinUrl, roomCode }) {
  return (
    <div className="room-qr-card" aria-label={`QR code invite for room ${roomCode}`}>
      <QRCodeSVG
        value={joinUrl}
        size={168}
        bgColor="#fbf5de"
        fgColor="#101713"
        level="M"
        marginSize={2}
        title={`Join room ${roomCode}`}
      />
      <div>
        <strong>Scan to join</strong>
        <span>No typing, no missed letters.</span>
      </div>
    </div>
  )
}
