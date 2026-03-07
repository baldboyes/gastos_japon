type SupportedLocale = 'es' | 'en' | 'ja'

type BuildInviteInput = {
  locale?: string
  inviterName: string
  inviterEmail?: string
  tripName: string
  actionUrl?: string
  registerUrl?: string
  isExistingUser: boolean
}

const normalizeLocale = (locale?: string): SupportedLocale => {
  const raw = String(locale || '').trim().toLowerCase()
  const base = raw.includes('-') ? raw.split('-')[0] : raw
  if (base === 'es' || base === 'en' || base === 'ja') return base
  return 'en'
}

const escapeHtml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const templates: Record<SupportedLocale, {
  subjectExisting: string
  subjectNew: string
  textExisting: (i: BuildInviteInput) => string
  textNew: (i: BuildInviteInput) => string
  htmlExisting: (i: BuildInviteInput) => string
  htmlNew: (i: BuildInviteInput) => string
}> = {
  es: {
    subjectExisting: 'Invitación a un viaje',
    subjectNew: 'Te han invitado a un viaje',
    textExisting: (i) => {
      const action = i.actionUrl ? `\n\nUnirme al viaje: ${i.actionUrl}\n` : '\n'
      const inviterEmail = i.inviterEmail ? `\nEmail del invitador: ${i.inviterEmail}\n` : '\n'
      return `${i.inviterName} te ha invitado a colaborar en el viaje "${i.tripName}".${inviterEmail}${action}`
    },
    textNew: (i) => {
      const register = i.registerUrl ? `\nRegístrate o inicia sesión aquí: ${i.registerUrl}\n` : '\n'
      const action = i.actionUrl ? `\nUnirme al viaje: ${i.actionUrl}\n` : '\n'
      const inviterEmail = i.inviterEmail ? `\nEmail del invitador: ${i.inviterEmail}\n` : '\n'
      return `${i.inviterName} te ha invitado a colaborar en el viaje "${i.tripName}".${inviterEmail}${register}${action}`
    },
    htmlExisting: (i) => {
      const inviterName = escapeHtml(i.inviterName)
      const inviterEmail = i.inviterEmail ? escapeHtml(i.inviterEmail) : ''
      const tripName = escapeHtml(i.tripName)
      const actionUrl = i.actionUrl ? escapeHtml(i.actionUrl) : ''

      return `<p>${inviterName} te ha invitado a colaborar en el viaje <strong>${tripName}</strong>.</p>${inviterEmail ? `<p>Email del invitador: <strong>${inviterEmail}</strong></p>` : ''}${actionUrl ? `<p><a href="${actionUrl}">Unirme al viaje</a></p>` : ''}`
    },
    htmlNew: (i) => {
      const inviterName = escapeHtml(i.inviterName)
      const inviterEmail = i.inviterEmail ? escapeHtml(i.inviterEmail) : ''
      const tripName = escapeHtml(i.tripName)
      const actionUrl = i.actionUrl ? escapeHtml(i.actionUrl) : ''
      const registerUrl = i.registerUrl ? escapeHtml(i.registerUrl) : ''

      return `<p>${inviterName} te ha invitado a colaborar en el viaje <strong>${tripName}</strong>.</p>${inviterEmail ? `<p>Email del invitador: <strong>${inviterEmail}</strong></p>` : ''}${actionUrl ? `<p><a href="${actionUrl}">Unirme al viaje</a></p>` : ''}${registerUrl ? `<p>Si todavía no tienes cuenta, regístrate aquí: <a href="${registerUrl}">${registerUrl}</a></p>` : ''}`
    }
  },
  en: {
    subjectExisting: 'Trip invitation',
    subjectNew: 'You have been invited to a trip',
    textExisting: (i) => {
      const action = i.actionUrl ? `\n\nJoin the trip: ${i.actionUrl}\n` : '\n'
      const inviterEmail = i.inviterEmail ? `\nInviter email: ${i.inviterEmail}\n` : '\n'
      return `${i.inviterName} invited you to collaborate on the trip "${i.tripName}".${inviterEmail}${action}`
    },
    textNew: (i) => {
      const register = i.registerUrl ? `\nSign up or log in here: ${i.registerUrl}\n` : '\n'
      const action = i.actionUrl ? `\nJoin the trip: ${i.actionUrl}\n` : '\n'
      const inviterEmail = i.inviterEmail ? `\nInviter email: ${i.inviterEmail}\n` : '\n'
      return `${i.inviterName} invited you to collaborate on the trip "${i.tripName}".${inviterEmail}${register}${action}`
    },
    htmlExisting: (i) => {
      const inviterName = escapeHtml(i.inviterName)
      const inviterEmail = i.inviterEmail ? escapeHtml(i.inviterEmail) : ''
      const tripName = escapeHtml(i.tripName)
      const actionUrl = i.actionUrl ? escapeHtml(i.actionUrl) : ''

      return `<p>${inviterName} invited you to collaborate on the trip <strong>${tripName}</strong>.</p>${inviterEmail ? `<p>Inviter email: <strong>${inviterEmail}</strong></p>` : ''}${actionUrl ? `<p><a href="${actionUrl}">Join the trip</a></p>` : ''}`
    },
    htmlNew: (i) => {
      const inviterName = escapeHtml(i.inviterName)
      const inviterEmail = i.inviterEmail ? escapeHtml(i.inviterEmail) : ''
      const tripName = escapeHtml(i.tripName)
      const actionUrl = i.actionUrl ? escapeHtml(i.actionUrl) : ''
      const registerUrl = i.registerUrl ? escapeHtml(i.registerUrl) : ''

      return `<p>${inviterName} invited you to collaborate on the trip <strong>${tripName}</strong>.</p>${inviterEmail ? `<p>Inviter email: <strong>${inviterEmail}</strong></p>` : ''}${actionUrl ? `<p><a href="${actionUrl}">Join the trip</a></p>` : ''}${registerUrl ? `<p>If you don’t have an account yet, sign up here: <a href="${registerUrl}">${registerUrl}</a></p>` : ''}`
    }
  },
  ja: {
    subjectExisting: '旅行への招待',
    subjectNew: '旅行に招待されました',
    textExisting: (i) => {
      const action = i.actionUrl ? `\n\n旅行に参加する: ${i.actionUrl}\n` : '\n'
      const inviterEmail = i.inviterEmail ? `\n招待者メール: ${i.inviterEmail}\n` : '\n'
      return `${i.inviterName}さんが、旅行「${i.tripName}」への参加を招待しました。${inviterEmail}${action}`
    },
    textNew: (i) => {
      const register = i.registerUrl ? `\n登録/ログイン: ${i.registerUrl}\n` : '\n'
      const action = i.actionUrl ? `\n旅行に参加する: ${i.actionUrl}\n` : '\n'
      const inviterEmail = i.inviterEmail ? `\n招待者メール: ${i.inviterEmail}\n` : '\n'
      return `${i.inviterName}さんが、旅行「${i.tripName}」への参加を招待しました。${inviterEmail}${register}${action}`
    },
    htmlExisting: (i) => {
      const inviterName = escapeHtml(i.inviterName)
      const inviterEmail = i.inviterEmail ? escapeHtml(i.inviterEmail) : ''
      const tripName = escapeHtml(i.tripName)
      const actionUrl = i.actionUrl ? escapeHtml(i.actionUrl) : ''

      return `<p>${inviterName}さんが、旅行「<strong>${tripName}</strong>」への参加を招待しました。</p>${inviterEmail ? `<p>招待者メール: <strong>${inviterEmail}</strong></p>` : ''}${actionUrl ? `<p><a href="${actionUrl}">旅行に参加する</a></p>` : ''}`
    },
    htmlNew: (i) => {
      const inviterName = escapeHtml(i.inviterName)
      const inviterEmail = i.inviterEmail ? escapeHtml(i.inviterEmail) : ''
      const tripName = escapeHtml(i.tripName)
      const actionUrl = i.actionUrl ? escapeHtml(i.actionUrl) : ''
      const registerUrl = i.registerUrl ? escapeHtml(i.registerUrl) : ''

      return `<p>${inviterName}さんが、旅行「<strong>${tripName}</strong>」への参加を招待しました。</p>${inviterEmail ? `<p>招待者メール: <strong>${inviterEmail}</strong></p>` : ''}${actionUrl ? `<p><a href="${actionUrl}">旅行に参加する</a></p>` : ''}${registerUrl ? `<p>アカウントがない場合はこちらで登録: <a href="${registerUrl}">${registerUrl}</a></p>` : ''}`
    }
  }
}

export const buildInviteEmailContent = (input: BuildInviteInput) => {
  const locale = normalizeLocale(input.locale)
  const t = templates[locale]

  const subject = input.isExistingUser
    ? `${t.subjectExisting}: ${input.tripName}`
    : `${t.subjectNew}: ${input.tripName}`

  const text = input.isExistingUser ? t.textExisting(input) : t.textNew(input)
  const html = input.isExistingUser ? t.htmlExisting(input) : t.htmlNew(input)

  return { locale, subject, text, html }
}
