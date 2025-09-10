// South African Colleges and Universities
export const COLLEGES = [
  'University of Cape Town',
  'University of the Witwatersrand',
  'Stellenbosch University',
  'University of KwaZulu-Natal',
  'University of Pretoria',
  'Rhodes University',
  'University of the Western Cape',
  'North-West University',
  'University of the Free State',
  'Nelson Mandela University',
  'Cape Peninsula University of Technology',
  'Durban University of Technology',
  'Tshwane University of Technology',
  'Vaal University of Technology',
  'Walter Sisulu University',
  'University of Limpopo',
  'University of Zululand',
  'University of Fort Hare',
  'Central University of Technology',
  'Mangosuthu University of Technology'
];

// Academic Courses/Programs
export const COURSES = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Data Science',
  'Cybersecurity',
  'Business Administration',
  'Business Management',
  'Marketing',
  'Finance',
  'Accounting',
  'Economics',
  'Human Resources',
  'Engineering (Civil)',
  'Engineering (Mechanical)',
  'Engineering (Electrical)',
  'Engineering (Chemical)',
  'Engineering (Industrial)',
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Physiotherapy',
  'Psychology',
  'Social Work',
  'Education',
  'Law',
  'Architecture',
  'Graphic Design',
  'Fine Arts',
  'Music',
  'Drama',
  'English Literature',
  'History',
  'Geography',
  'Political Science',
  'Sociology',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Environmental Science',
  'Agriculture',
  'Veterinary Science',
  'Sports Science',
  'Hospitality Management',
  'Tourism Management',
  'Media Studies',
  'Journalism',
  'Communications'
];

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