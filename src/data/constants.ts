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

// Subjects for specific courses
export const COURSE_SUBJECTS = {
  'Computer Science': [
    { code: 'CS101', name: 'Introduction to Programming', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'CS102', name: 'Data Structures and Algorithms', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'CS201', name: 'Object-Oriented Programming', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'CS202', name: 'Database Systems', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'CS301', name: 'Software Engineering', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'CS302', name: 'Computer Networks', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'CS401', name: 'Machine Learning', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'CS402', name: 'Capstone Project', amount: 1000,credits: 12, semester: 'Semester 2' },
    { code: 'MATH101', name: 'Calculus I', amount: 1000,credits: 4, semester: 'Semester 1' },
    { code: 'MATH102', name: 'Linear Algebra', amount: 1000,credits: 4, semester: 'Semester 2' },
    { code: 'STAT201', name: 'Statistics for Computer Science', amount: 1000,credits: 4, semester: 'Semester 1' },
    { code: 'PHYS101', name: 'Physics for Computer Science', amount: 1000,credits: 4, semester: 'Semester 1' }
  ],
  'Information Technology': [
    { code: 'IT101', name: 'IT Fundamentals', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'IT102', name: 'Web Development', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'IT201', name: 'System Analysis and Design', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'IT202', name: 'Network Administration', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'IT301', name: 'IT Project Management', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'IT302', name: 'Cybersecurity Fundamentals', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'IT401', name: 'Cloud Computing', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'IT402', name: 'IT Capstone Project', amount: 1000,credits: 12, semester: 'Semester 2' },
    { code: 'BUS101', name: 'Business Communication', amount: 1000,credits: 4, semester: 'Semester 1' },
    { code: 'MATH101', name: 'Business Mathematics', amount: 1000,credits: 4, semester: 'Semester 2' }
  ],
  'Software Engineering': [
    { code: 'SE101', name: 'Programming Fundamentals', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'SE102', name: 'Software Design Patterns', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'SE201', name: 'Software Architecture', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'SE202', name: 'Testing and Quality Assurance', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'SE301', name: 'Agile Development', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'SE302', name: 'DevOps and CI/CD', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'SE401', name: 'Software Project Management', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'SE402', name: 'Senior Design Project', amount: 1000,credits: 12, semester: 'Semester 2' },
    { code: 'CS201', name: 'Data Structures', amount: 1000,credits: 4, semester: 'Semester 1' },
    { code: 'CS202', name: 'Database Design', amount: 1000,credits: 4, semester: 'Semester 2' }
  ],
  'Data Science': [
    { code: 'DS101', name: 'Introduction to Data Science', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'DS102', name: 'Statistical Methods', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'DS201', name: 'Machine Learning I', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'DS202', name: 'Data Visualization', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'DS301', name: 'Big Data Analytics', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'DS302', name: 'Deep Learning', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'DS401', name: 'Data Science Capstone', amount: 1000,credits: 12, semester: 'Semester 1' },
    { code: 'MATH201', name: 'Probability and Statistics', amount: 1000,credits: 4, semester: 'Semester 1' },
    { code: 'MATH202', name: 'Linear Algebra for Data Science', amount: 1000,credits: 4, semester: 'Semester 2' },
    { code: 'CS201', name: 'Python Programming', amount: 1000,credits: 4, semester: 'Semester 1' }
  ],
  'Business Administration': [
    { code: 'BA101', name: 'Principles of Management', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'BA102', name: 'Business Communication', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'BA201', name: 'Financial Accounting', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'BA202', name: 'Marketing Principles', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'BA301', name: 'Strategic Management', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'BA302', name: 'Operations Management', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'BA401', name: 'Business Ethics', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'BA402', name: 'Capstone Project', amount: 1000,credits: 12, semester: 'Semester 2' },
    { code: 'ECON101', name: 'Microeconomics', amount: 1000,credits: 4, semester: 'Semester 1' },
    { code: 'ECON102', name: 'Macroeconomics', amount: 1000,credits: 4, semester: 'Semester 2' }
  ],
  'Engineering (Civil)': [
    { code: 'CE101', name: 'Engineering Mathematics I', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'CE102', name: 'Engineering Physics', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'CE201', name: 'Structural Analysis', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'CE202', name: 'Concrete Technology', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'CE301', name: 'Geotechnical Engineering', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'CE302', name: 'Transportation Engineering', amount: 1000,credits: 6, semester: 'Semester 2' },
    { code: 'CE401', name: 'Project Management', amount: 1000,credits: 6, semester: 'Semester 1' },
    { code: 'CE402', name: 'Final Year Project', amount: 1000,credits: 12, semester: 'Semester 2' },
    { code: 'MATH201', name: 'Calculus II', amount: 1000,credits: 4, semester: 'Semester 1' },
    { code: 'PHYS201', name: 'Engineering Mechanics', amount: 1000,credits: 4, semester: 'Semester 2' }
  ],
  'Medicine': [
    { code: 'MED101', name: 'Human Anatomy', amount: 1000,credits: 8, semester: 'Semester 1' },
    { code: 'MED102', name: 'Human Physiology', amount: 1000,credits: 8, semester: 'Semester 2' },
    { code: 'MED201', name: 'Pathology', amount: 1000,credits: 8, semester: 'Semester 1' },
    { code: 'MED202', name: 'Pharmacology', amount: 1000,credits: 8, semester: 'Semester 2' },
    { code: 'MED301', name: 'Internal Medicine', amount: 1000,credits: 8, semester: 'Semester 1' },
    { code: 'MED302', name: 'Surgery', amount: 1000,credits: 8, semester: 'Semester 2' },
    { code: 'MED401', name: 'Clinical Rotations', amount: 1000,credits: 12, semester: 'Semester 1' },
    { code: 'MED402', name: 'Medical Research Project', amount: 1000,credits: 12, semester: 'Semester 2' },
    { code: 'BIO101', name: 'Cell Biology', amount: 1000,credits: 4, semester: 'Semester 1' },
    { code: 'CHEM101', name: 'Organic Chemistry', amount: 1000,credits: 4, semester: 'Semester 2' }
  ]
};

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