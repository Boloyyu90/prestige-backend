export type Right =
    | 'getUsers' | 'manageUsers'
    | 'getExams' | 'manageExams'
    | 'getQuestions' | 'manageQuestions'
    | 'takeExam' | 'viewResults'
    | 'viewProctoringEvents';

export type Role = 'ADMIN' | 'PARTICIPANT';

export const roleRights = new Map<Role, Right[]>([
    ['ADMIN', [
        'getUsers','manageUsers',
        'getExams','manageExams',
        'getQuestions','manageQuestions',
        'viewResults','viewProctoringEvents',
        'takeExam'
    ]],
    ['PARTICIPANT', [
        'getExams','takeExam','viewResults'
    ]]
]);
