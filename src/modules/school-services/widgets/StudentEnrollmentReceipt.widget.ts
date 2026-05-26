import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './StudentEnrollmentReceipt.vue'

const definition: WidgetComponentDefinition = {
    id:        'ses.student.enrollment-receipt',
    component: Component,
}

export default definition
