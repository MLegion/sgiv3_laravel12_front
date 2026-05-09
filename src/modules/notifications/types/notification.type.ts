export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'delivered' | 'read'
export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app'

export interface NotificationItem {
    id: number
    college_id: number | null
    channel: NotificationChannel
    template_key: string | null
    event_key: string | null
    status: NotificationStatus
    subject: string | null
    body_rendered: string
    recipient_user_id: number | null
    recipient_applicant_id: number | null
    recipient_label: string | null
    recipient_address: string | null
    provider_message_id: string | null
    error: string | null
    metadata: Record<string, unknown> | null
    dispatched_at: string | null
    sent_at: string | null
    delivered_at: string | null
    read_at: string | null
    created_at: string
}

export interface NotificationTemplate {
    key: string
    channel: NotificationChannel
    channelConfigured: boolean
    locale: string
    subject: string | null
    body: string
    isOverride: boolean
    availableVariables: Record<string, string> | null
}

export interface ChannelInfo {
    key: NotificationChannel
    label: string
    configured: boolean
}

export interface RecipientCandidate {
    userId: number
    name: string
    email: string | null
    phone: string | null
    addressByChannel: Record<NotificationChannel, string | null>
}
