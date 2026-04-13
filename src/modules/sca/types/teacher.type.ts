export interface TeacherEmployee {
    id:            number
    names:         string
    firstSurname:  string
    secondSurname: string | null
    email:         string | null
    phone:         string | null
    collegeId:     number
    status:        boolean
}

export interface TeacherCareer {
    id:           number
    name:         string
    shortName:    string | null
    officialCode: string | null
}

export interface TeacherAcademicOffer {
    id:          number
    careerId:    number
    modalityId:  number
}

export interface Teacher {
    id:             number
    employeeId:     number | null
    name:           string | null
    careerId:       number | null
    customId:       string | null
    status:         boolean
    isVacancy:      boolean
    displayName:    string
    employee:       TeacherEmployee | null
    career:         TeacherCareer | null
    academicOffers: TeacherAcademicOffer[] | null
    createdAt:      string | null
    updatedAt:      string | null
}

export function teacherFullName(t: Teacher): string {
    if (t.isVacancy || !t.employee) {
        return t.name ?? t.displayName ?? 'VACANTE'
    }
    const { names, firstSurname, secondSurname } = t.employee
    return [names, firstSurname, secondSurname].filter(Boolean).join(' ')
}
