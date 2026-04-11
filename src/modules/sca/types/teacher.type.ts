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

export interface TeacherAcademicOffer {
    id:          number
    careerId:    number
    modalityId:  number
}

export interface Teacher {
    id:             number
    employeeId:     number
    customId:       string | null
    status:         boolean
    employee:       TeacherEmployee | null
    academicOffers: TeacherAcademicOffer[] | null
    createdAt:      string | null
    updatedAt:      string | null
}

export function teacherFullName(t: Teacher): string {
    if (!t.employee) return `Empleado #${t.employeeId}`
    const { names, firstSurname, secondSurname } = t.employee
    return [names, firstSurname, secondSurname].filter(Boolean).join(' ')
}
