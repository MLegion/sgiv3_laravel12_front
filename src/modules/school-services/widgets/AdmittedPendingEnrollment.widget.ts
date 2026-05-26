import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './AdmittedPendingEnrollment.vue'

const definition: WidgetComponentDefinition = {
    id:          'ses.admitted.pending-enrollment',
    component:   Component,
    hasSettings: true,
}

export default definition
