import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'NOTIFICATIONS_API',
    api: {
        inbox: {
            list:        apiUrl('/notifications/inbox'),
            unreadCount: apiUrl('/notifications/inbox/unread-count'),
            markRead:    (id: string | number) => apiUrl(`/notifications/inbox/${id}/read`),
            markAllRead: apiUrl('/notifications/inbox/read-all'),
            delete:      (id: string | number) => apiUrl(`/notifications/inbox/${id}`),
            bulkRead:    apiUrl('/notifications/inbox/bulk-read'),
            bulkDelete:  apiUrl('/notifications/inbox/bulk-delete'),
        },
        templates:        apiUrl('/notifications/templates'),
        templateShow:     (key: string, channel: string) => apiUrl(`/notifications/templates/${encodeURIComponent(key)}/${channel}`),
        templateUpsert:   apiUrl('/notifications/templates'),
        templateDelete:   (key: string, channel: string) => apiUrl(`/notifications/templates/${encodeURIComponent(key)}/${channel}`),
        templatePreview:  apiUrl('/notifications/templates/preview'),
        channels:         apiUrl('/notifications/channels'),
        recipientSearch:  apiUrl('/notifications/recipients/search'),
        send:             apiUrl('/notifications/send'),
        logs:             apiUrl('/notifications/logs'),
        eventBindings: {
            matrix: apiUrl('/notifications/event-bindings/matrix'),
            upsert: apiUrl('/notifications/event-bindings'),
            delete: (eventKey: string, channel: string) =>
                apiUrl(`/notifications/event-bindings/${encodeURIComponent(eventKey)}/${channel}`),
        },
        webPush: {
            config:      apiUrl('/notifications/web-push/config'),
            status:      apiUrl('/notifications/web-push/status'),
            subscribe:   apiUrl('/notifications/web-push/subscribe'),
            unsubscribe: apiUrl('/notifications/web-push/unsubscribe'),
        },
    },
} satisfies ApiModule
