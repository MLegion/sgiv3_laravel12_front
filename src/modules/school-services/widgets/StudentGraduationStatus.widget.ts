import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './StudentGraduationStatus.vue'

const definition: WidgetComponentDefinition = {
    id:          'ses.student.graduation-status',
    component:   Component,
    hasSettings: false,
}

export default definition
