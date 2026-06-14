import type { DashboardDefinition } from '@/shared/types/dashboard'

/**
 * Inicio del Aspirante: en vez del tablero de widgets (que no le aporta nada
 * al aspirante), muestra su avance en el proceso, el siguiente paso y la
 * respuesta a sus documentos. Se enruta desde DashboardContainer cuando el
 * usuario tiene el menú del portal (code 'adm.portal').
 */
const definition: DashboardDefinition = {
    type:      'applicant',
    priority:  10,
    component: () => import('@/modules/admissions/pages/ApplicantHomePage.vue'),
}

export default definition
