/**
 * Catálogo estable de reportes referenciados por otros módulos.
 * Cada valor corresponde al campo `code` en la tabla `reports`.
 * El admin crea el reporte con esta clave y sube la plantilla Word
 * (la tabla `reports` es per-college: cada institución debe tener
 *  su propia plantilla cargada para cada code).
 *
 * Convención: RPT.<DOMINIO>.<VARIANTE>
 */
export enum ReportCode {
    // Horarios (módulo SCA)
    TEACHER_SCHEDULE                = 'RPT.HORARIO.DOCENTE',
    TEACHER_SCHEDULE_SEMI           = 'RPT.HORARIO.DOCENTE_SEMI',
    GROUP_SCHEDULE                  = 'RPT.HORARIO.GRUPO',
    PLACE_SCHEDULE                  = 'RPT.HORARIO.AULA',

    // Proyección académica
    ACADEMIC_PROJECTION_ALL_CAREERS = 'RPT.PROYECCION.TODAS',
    ACADEMIC_PROJECTION_BY_CAREER   = 'RPT.PROYECCION.CARRERA',

    // Concentrado de carga
    ACADEMIC_LOAD_BY_TEACHER        = 'RPT.CARGA.DOCENTE',
    ACADEMIC_LOAD_BY_GROUP          = 'RPT.CARGA.GRUPO',

    // Oficio / solicitudes
    ASSIGNMENT_OFFICIAL_LETTER      = 'RPT.OFICIO_ASIGNACION',
    TEACHER_SUBJECT_REQUEST         = 'RPT.SOLICITUD_MATERIA',
}
