import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './TeacherPendingActas.vue'

const definition: WidgetComponentDefinition = {
    id:          'sca.teacher.pending-actas',
    component:   Component,
    hasSettings: false,
}

export default definition
