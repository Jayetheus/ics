// These constants are now loaded from the database
// Use the database service functions to get courses, colleges, and departments

// Academic Departments
export const DEPARTMENTS = [
  'Faculty of Science',
  'Faculty of Engineering',
  'Faculty of Business',
  'Faculty of Health Sciences',
  'Faculty of Humanities',
  'Faculty of Law',
  'Faculty of Education',
  'Faculty of Arts',
  'Faculty of Agriculture',
  'Faculty of Technology'
];

// Payment Types
export const PAYMENT_TYPES = [
  'registration',
  'tuition',
  'accommodation',
  'library',
  'laboratory',
  'examination',
  'graduation',
  'other'
] as const;

// Ticket Categories
export const TICKET_CATEGORIES = [
  'technical',
  'academic',
  'finance',
  'accommodation',
  'library',
  'general'
] as const;

// Class Types
export const CLASS_TYPES = [
  'lecture',
  'practical',
  'tutorial',
  'seminar',
  'workshop'
] as const;

// Academic Years
export const ACADEMIC_YEARS = [1, 2, 3, 4, 5];

// Semesters
export const SEMESTERS = [
  'Semester 1',
  'Semester 2',
  'Summer School'
];

// Subjects are now loaded from the database
// Use getSubjectsByCourse() function to get subjects for a specific course

// Grade Scale
export const GRADE_SCALE = [
  { min: 90, max: 100, grade: 'A+', description: 'Outstanding' },
  { min: 80, max: 89, grade: 'A', description: 'Excellent' },
  { min: 75, max: 79, grade: 'B+', description: 'Very Good' },
  { min: 70, max: 74, grade: 'B', description: 'Good' },
  { min: 65, max: 69, grade: 'C+', description: 'Above Average' },
  { min: 60, max: 64, grade: 'C', description: 'Average' },
  { min: 55, max: 59, grade: 'D+', description: 'Below Average' },
  { min: 50, max: 54, grade: 'D', description: 'Poor' },
  { min: 0, max: 49, grade: 'F', description: 'Fail' }
];

// South African Provinces
export const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

// Common South African Cities
export const CITIES = [
  'Cape Town',
  'Johannesburg',
  'Durban',
  'Pretoria',
  'Port Elizabeth',
  'Bloemfontein',
  'East London',
  'Pietermaritzburg',
  'Kimberley',
  'Polokwane',
  'Nelspruit',
  'Rustenburg',
  'George',
  'Stellenbosch',
  'Potchefstroom'
];