import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './EvdCareerProgress.vue'

const definition: WidgetComponentDefinition = {
    id:          'evd.career.progress',
    component:   Component,
    hasSettings: false,
}

export default definition
