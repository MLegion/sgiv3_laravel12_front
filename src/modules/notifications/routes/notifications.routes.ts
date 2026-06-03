export default [
    {
        path: 'notifications/inbox',
        name: 'notifications.inbox',
        component: () => import('@/modules/notifications/pages/NotificationInboxPage.vue'),
        meta: { title: 'Mis notificaciones' },
    },
    {
        path: 'notifications/send',
        name: 'notifications.send',
        component: () => import('@/modules/notifications/pages/NotificationSendPage.vue'),
        meta: { title: 'Enviar notificación', permissions: ['notif.send.manual'] },
    },
    {
        path: 'notifications/templates',
        name: 'notifications.templates',
        component: () => import('@/modules/notifications/pages/NotificationTemplatesPage.vue'),
        meta: { title: 'Plantillas de notificación', permissions: ['notif.template.view'] },
    },
    {
        path: 'notifications/templates/:key/:channel/edit',
        name: 'notifications.templates.edit',
        component: () => import('@/modules/notifications/pages/NotificationTemplateEditPage.vue'),
        meta: { title: 'Editar plantilla', permissions: ['notif.template.view'] },
    },
    {
        path: 'notifications/logs',
        name: 'notifications.logs',
        component: () => import('@/modules/notifications/pages/NotificationLogsPage.vue'),
        meta: { title: 'Historial de notificaciones', permissions: ['notif.log.view'] },
    },
    {
        path: 'notifications/event-bindings',
        name: 'notifications.event-bindings',
        component: () => import('@/modules/notifications/pages/NotificationEventBindingsPage.vue'),
        meta: { title: 'Disparadores de notificación', permissions: ['notif.event-binding.view'] },
    },
    {
        path: 'notifications/interceptor',
        name: 'notifications.interceptor',
        component: () => import('@/modules/notifications/pages/NotificationInterceptorPage.vue'),
        meta: { title: 'Interceptor de notificaciones', permissions: ['notif.interceptor.manage'] },
    },
]
