import crypto from 'node:crypto'

type InviteTokenPayload = {
  inviteId: number
  email: string
  exp: number
}

const deriveKey = (secret: string) => crypto.createHash('sha256').update(secret).digest()

const encode = (buf: Buffer) => buf.toString('base64url')
const decode = (str: string) => Buffer.from(str, 'base64url')

export const createInviteToken = (payload: InviteTokenPayload, secret: string) => {
  const key = deriveKey(secret)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return encode(Buffer.concat([iv, tag, ciphertext]))
}

export const decryptInviteToken = (token: string, secret: string): InviteTokenPayload => {
  const raw = decode(token)
  if (raw.length < 12 + 16 + 1) {
    throw new Error('Invalid token')
  }
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const ciphertext = raw.subarray(28)
  const key = deriveKey(secret)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  const payload = JSON.parse(plaintext) as InviteTokenPayload
  if (!payload || typeof payload !== 'object') throw new Error('Invalid token')
  return payload
}
