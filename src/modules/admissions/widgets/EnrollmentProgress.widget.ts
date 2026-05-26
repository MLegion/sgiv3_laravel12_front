import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './EnrollmentProgress.vue'

const definition: WidgetComponentDefinition = {
    id:          'adm.applicants.enrollment-progress',
    component:   Component,
    hasSettings: true,
}

export default definition
