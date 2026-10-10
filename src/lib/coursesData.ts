import { Course, AcademicProgram, CourseType } from '../types';

export const UCC_BED_COURSES: Course[] = [
  // =========================================================================
  // LEVEL 100 - FIRST SEMESTER
  // =========================================================================

  // --- Early Childhood Education (L100 Sem 1) ---
  {
    code: 'EBS 101',
    title: 'Elementary Algebra',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Number systems, linear equations, inequalities, indices, logarithms and algebraic expressions.'
  },
  {
    code: 'EBS 103',
    title: 'General Biology',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Cell biology, classification of living organisms, plant and animal physiology and ecological principles.'
  },
  {
    code: 'EBS 106',
    title: 'Child Development and Learning',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Physical, cognitive, social, and emotional development of children from birth through early childhood.'
  },
  {
    code: 'EBS 107',
    title: 'Computer Literacy',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Hardware, software, file management, word processing, spreadsheets, internet and classroom educational tools.'
  },
  {
    code: 'EBS 108',
    title: 'Language and Linguistics',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Nature of language, phonology, morphology, syntax, semantics and sociolinguistic aspects of teaching.'
  },
  {
    code: 'EBS 118',
    title: 'Information Literacy Skills',
    level: 100,
    semester: 1,
    credits: 1,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Library resources retrieval, academic databases, digital indexing, citation standards and referencing ethics.'
  },
  {
    code: 'EBS 122',
    title: 'Performing Arts and Society',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Role of music, dance, and drama in Ghanaian indigenous society and early years pedagogical integration.'
  },
  {
    code: 'EBS 125',
    title: 'Principles and Practice of Education',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Philosophical, historical, and sociological foundations of Ghanaian education and classroom practice.'
  },
  {
    code: 'EBS 191',
    title: 'Field Experience I',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Practicum',
    programme: 'Early Childhood',
    description: 'Initial school visitation, structural observation of school environments, teacher routines and child behavior.'
  },

  // --- Primary Education (L100 Sem 1) ---
  {
    code: 'EBS 101',
    title: 'Elementary Algebra',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Number systems, polynomials, algebraic operations, relations, functions and problem-solving techniques.'
  },
  {
    code: 'EBS 103',
    title: 'General Biology',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Fundamental biological principles, diversity of living organisms, ecology, genetics and evolution.'
  },
  {
    code: 'EBS 105PR',
    title: 'Child and Adolescent Development and Learning',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Theories of development and learning in middle childhood and adolescence; behavioral and cognitive changes.'
  },
  {
    code: 'EBS 107PR',
    title: 'Computer Literacy',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Information and communication technology tools, digital productivity suites and e-learning resources for basic schools.'
  },
  {
    code: 'EBS 108',
    title: 'Language and Linguistics',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'General linguistic concepts, speech production, grammatical categories and language acquisition processes.'
  },
  {
    code: 'EBS 118',
    title: 'Information Literacy Skills',
    level: 100,
    semester: 1,
    credits: 1,
    type: 'Core',
    programme: 'Primary',
    description: 'Techniques for locating, evaluating, and ethically using information across print and electronic platforms.'
  },
  {
    code: 'EBS 125',
    title: 'Principles and Practice of Education',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Aims of basic education, role of the primary teacher, educational legislation and ethical codes.'
  },
  {
    code: 'EBS 191',
    title: 'Field Experience I',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Practicum',
    programme: 'Primary',
    description: 'Structured observational placement in partner basic schools focusing on school organization and learner dynamics.'
  },
  // Primary Electives (L100 Sem 1)
  {
    code: 'EBS 102',
    title: 'College Algebra',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Mathematics',
    description: 'Advanced polynomial functions, matrices, determinants, sequences, series and binomial theorem.'
  },
  {
    code: 'EBS 109',
    title: 'Fundamentals of IT Education',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'ICT',
    description: 'Computer architectures, operating systems, instructional technology applications and digital media tools.'
  },
  {
    code: 'EBS 110',
    title: 'Foundations of Physical Education',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Physical Education',
    description: 'History, philosophy, biomechanics and motor development foundations of school physical education.'
  },
  {
    code: 'EBS 113',
    title: 'General Agriculture I',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Agricultural Science',
    description: 'Introduction to crop and animal farming systems, agro-climatic zones of Ghana and soil management.'
  },
  {
    code: 'EBS 114',
    title: 'General Biology Theory I',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Science',
    description: 'Theoretical fundamentals of biochemistry, cytology, biological molecules and cellular metabolism.'
  },
  {
    code: 'EBS 114P',
    title: 'General Biology Practical I',
    level: 100,
    semester: 1,
    credits: 1,
    type: 'Elective',
    programme: 'Primary',
    option: 'Science',
    description: 'Hands-on laboratory investigations: microscopy, tissue staining, food tests and enzymatic experiments.'
  },
  {
    code: 'EBS 116',
    title: 'Ghanaian Language and Culture – Writing Techniques',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Ghanaian Language',
    description: 'Orthography, creative composition, prose analysis and cultural idioms in indigenous Ghanaian languages.'
  },
  {
    code: 'EBS 121',
    title: 'Studies in African Poetry',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'English Literacy',
    description: 'Thematic and stylistic exploration of oral traditions, pan-African verse and modern African poetic masters.'
  },
  {
    code: 'EBS 122',
    title: 'Performing Arts and Society',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Performing Arts',
    description: 'Music, folklore, dance aesthetics and theatrical performance as vehicles of social consciousness.'
  },
  {
    code: 'EBS 123',
    title: 'Philosophical and Psychological Foundations of RME',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Religious and Moral Education',
    description: 'Moral philosophy, spiritual development in young learners and comparative ethics in Ghanaian society.'
  },
  {
    code: 'EBS 126',
    title: 'Introduction to Social Studies',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Social Studies',
    description: 'Social institutions, socio-economic challenges in developing nations and national governance structures.'
  },
  {
    code: 'EBS 130',
    title: 'Basic Design',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Visual Arts',
    description: 'Elements and principles of design, color theory, 2D composition, drawing and visual communication.'
  },
  {
    code: 'EBS 145',
    title: 'Elementary Geometry',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Mathematics',
    description: 'Euclidean plane geometry, angle properties, triangles, quadrilaterals, polygons and perimeter/area formulas.'
  },

  // --- Junior High School Education (L100 Sem 1) ---
  {
    code: 'EBS 105',
    title: 'Child and Adolescent Development and Learning',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Psychological dynamics of adolescent growth, identity formation, socio-emotional development and learning styles.'
  },
  {
    code: 'EBS 107',
    title: 'Computer Literacy',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Basic computational principles, productivity suites, internet connectivity, computer safety and educational apps.'
  },
  {
    code: 'EBS 108',
    title: 'Language and Linguistics',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Structure of English and Ghanaian languages: phonetic transcription, morphosyntax, semantics and pragmatics.'
  },
  {
    code: 'EBS 118',
    title: 'Information Literacy Skills',
    level: 100,
    semester: 1,
    credits: 1,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Navigating academic literature, evaluating source credibility, digital libraries, and ethical research norms.'
  },
  {
    code: 'EBS 125',
    title: 'Principles and Practice of Education',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Pedagogical principles, classroom authority, teacher professional standards, curriculum alignment and school law.'
  },
  {
    code: 'EBS 191',
    title: 'Field Experience I',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Practicum',
    programme: 'Junior High School',
    description: 'Structured clinical attachment in junior high schools, recording mentor lessons and physical classroom environment.'
  },
  // JHS Subject Options Core Courses (L100 Sem 1)
  {
    code: 'EBS 102J',
    title: 'College Algebra',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Mathematics',
    description: 'Functions, quadratic theory, systems of linear equations, complex numbers and mathematical induction.'
  },
  {
    code: 'EBS 145',
    title: 'Elementary Geometry',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Mathematics',
    description: 'Geometric proofs, congruence, circle theorems, locus, and basic coordinate geometry.'
  },
  {
    code: 'EBS 101',
    title: 'Elementary Algebra',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Foundational algebra, factoring, solving linear and quadratic models, formulas and word problems.'
  },
  {
    code: 'EBS 114',
    title: 'General Biology Theory I',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Cellular ultrastructure, biomolecules, membrane transport, genetics and biological kingdom diversity.'
  },
  {
    code: 'EBS 114P',
    title: 'General Biology Practical I',
    level: 100,
    semester: 1,
    credits: 1,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Laboratory practicals in microscope handling, specimen sectioning, physiological assays and field sampling.'
  },
  {
    code: 'EBS 117',
    title: 'Graphic Communication I (Geometry)',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Technical Skills',
    description: 'Technical drawing instruments, plane geometric constructions, tangency, scales and orthographic projections.'
  },
  {
    code: 'EBS 109J',
    title: 'Fundamentals of IT Education',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'ICT',
    description: 'Hardware architectures, logic gates, operating systems, networking fundamentals and multimedia authoring.'
  },
  {
    code: 'EBS 113J',
    title: 'General Agriculture I',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Agricultural Science',
    description: 'Farming systems in Ghana, crop propagation, agricultural ecology, soil fertility and livestock principles.'
  },
  {
    code: 'EBS 130J',
    title: 'Basic Design',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Visual Arts',
    description: 'Creative studio drawing, shading techniques, two-dimensional composition, perspective and design principles.'
  },
  {
    code: 'EBS 112',
    title: 'Fundamentals in Home Economics',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Vocational Skills',
    description: 'Basic food nutrients, kitchen hygiene, textile science, garment construction tools and family resource planning.'
  },
  {
    code: 'EBS 161',
    title: 'Sociology of the Family',
    level: 100,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Vocational Skills',
    description: 'Structure of Ghanaian families, kinship systems, marital dynamics, socialization and family challenges.'
  },
  {
    code: 'EBS 111',
    title: 'French Language Structure and Usage I (Oral / Written)',
    level: 100,
    semester: 1,
    credits: '2 + 1',
    type: 'Major',
    programme: 'Junior High School',
    option: 'French',
    description: 'Morphosyntax of French, phonetics, oral articulation, written comprehension, and communicative dialogue.'
  },
  {
    code: 'EBS 119',
    title: 'Introduction to Literature in French',
    level: 100,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'French',
    description: 'Survey of francophone African literature, narrative techniques, themes of colonial encounter and modern identity.'
  },

  // =========================================================================
  // LEVEL 100 - SECOND SEMESTER
  // =========================================================================
  {
    code: 'EBS 151',
    title: 'Transforming Teaching and Learning Pedagogies',
    level: 100,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Learner-centred instructional approaches, constructivism, activity-based methods and lesson design.'
  },
  {
    code: 'EBS 152',
    title: 'Critical Thinking and Problem Solving in Education',
    level: 100,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'All',
    description: 'Cognitive problem solving, reflective questioning, argument deconstruction and inquiry-driven classrooms.'
  },
  {
    code: 'EBS 153',
    title: 'Inclusive Education and Special Needs',
    level: 100,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'All',
    description: 'Strategies for accommodating neurodiverse pupils and children with sensory or physical challenges in basic schools.'
  },
  {
    code: 'EBS 154',
    title: 'Environmental and Social Studies Foundations',
    level: 100,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'All',
    description: 'Ecology, sustainable community practices, climate literacy, citizenship and community heritage.'
  },
  {
    code: 'EBS 155',
    title: 'Physical and Health Education in Basic Schools',
    level: 100,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'All',
    description: 'Psychomotor health, school sanitation, basic first aid, physical recreation and lifetime wellness.'
  },
  {
    code: 'EBS 192',
    title: 'Supported Teaching in School (STS 1: Observation)',
    level: 100,
    semester: 2,
    credits: 3,
    type: 'Practicum',
    programme: 'All',
    description: 'Clinical observation in partner schools, taking reflective field notes on mentor lessons and pupil participation.'
  },

  // =========================================================================
  // LEVEL 200 - FIRST SEMESTER
  // =========================================================================

  // --- Early Childhood Education (L200 Sem 1) ---
  {
    code: 'EBS 206',
    title: 'Arts and Creativity in Early Grade Education',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Integrating drawing, paper craft, modeling, and creative expression in early grade literacy and numeracy.'
  },
  {
    code: 'EBS 207',
    title: 'English Language Studies II',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Advanced clause structure, functional grammar, text cohesion, discourse analysis and academic writing.'
  },
  {
    code: 'EBS 208',
    title: 'Environmental and Nature Study Activities in ECE',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Designing outdoor exploration, nature walks, sensory learning and environmental awareness for young children.'
  },
  {
    code: 'EBS 209',
    title: 'Ghanaian Language for Early Childhood Education Teachers',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Mother tongue medium of instruction, phonemic awareness, storytelling and early emergent literacy skills.'
  },
  {
    code: 'EBS 215',
    title: 'General Curriculum Studies',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Curriculum development theories, NTECF frameworks, scheme of work design, weekly lesson planning and alignment.'
  },
  {
    code: 'EBS 218',
    title: 'Health and Physical Fitness',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Physiology of exercise, cardiovascular fitness, motor skill development and nutrition for basic school teachers.'
  },
  {
    code: 'EBS 227',
    title: 'General Physics',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Mechanics, heat, light, sound, electricity and simple machines with everyday basic classroom applications.'
  },
  {
    code: 'EBS 280',
    title: 'Introduction to Semantics',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Linguistic meaning, lexical relations (synonymy, antonymy, hyponymy), sense relations and truth-conditional semantics.'
  },
  {
    code: 'EBS 291',
    title: 'Field Experience III',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Practicum',
    programme: 'Early Childhood',
    description: 'Collaborative co-planning with mentor teachers and small-group instructional delivery in partner kindergartens.'
  },

  // --- Primary Education (L200 Sem 1) ---
  {
    code: 'EBS 204',
    title: 'Citizenship Education in Ghana',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Democratic values, civic responsibilities, constitutional governance and human rights education in basic schools.'
  },
  {
    code: 'EBS 207',
    title: 'English Language Studies II',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Complex sentence structures, syntactic analysis, lexical choice, paragraph organization and expository writing.'
  },
  {
    code: 'EBS 215',
    title: 'General Curriculum Studies',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Curriculum implementation, syllabus interpretation, lesson forecasting and integrating instructional resources.'
  },
  {
    code: 'EBS 218',
    title: 'Health and Physical Fitness',
    level: 200,
    semester: 1,
    credits: 1,
    type: 'Core',
    programme: 'Primary',
    description: 'Components of physical fitness, wellness assessments and organizing school fitness activities.'
  },
  {
    code: 'EBS 219',
    title: 'Health, Safety and Social Issues in Schools',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Child safeguarding protocols, infectious disease prevention, mental health, bullying and school safety plans.'
  },
  {
    code: 'EBS 227',
    title: 'General Physics',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Fundamental physics concepts: force, pressure, thermal properties, simple optical lenses and electric circuits.'
  },
  {
    code: 'EBS 280',
    title: 'Introduction to Semantics',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Semantic theory, figurative language, idioms, connotation, denotation and meaning representation in pedagogy.'
  },
  {
    code: 'EBS 291',
    title: 'Field Experience III',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Practicum',
    programme: 'Primary',
    description: 'Co-teaching small groups, assisting mentor teachers with remedial tutoring and administering formative quizzes.'
  },
  // Primary Electives (L200 Sem 1)
  {
    code: 'EBS 201',
    title: 'Assemblage and Construction',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Visual Arts',
    description: '3D sculpture using discarded and indigenous materials, joining techniques, papier-mâché and wire art.'
  },
  {
    code: 'EBS 202',
    title: 'Biblical Studies',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'RME',
    description: 'Old and New Testament historical backgrounds, literary genres in scriptures and ethical moral teachings.'
  },
  {
    code: 'EBS 205',
    title: 'Crop Production',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Agricultural Science',
    description: 'Agronomy of major Ghanaian cereal, legume and root crops; weed control, harvesting and storage technologies.'
  },
  {
    code: 'EBS 213',
    title: 'Game Activities for Basic Schools',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Physical Education',
    description: 'Tag games, minor sports, perceptual-motor activities and inclusive playground management.'
  },
  {
    code: 'EBS 216',
    title: 'General Physics Theory II',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Science',
    description: 'Electromagnetism, wave motion, geometric optics, sound resonance and modern atomic models.'
  },
  {
    code: 'EBS 216P',
    title: 'General Physics Practical II',
    level: 200,
    semester: 1,
    credits: 1,
    type: 'Elective',
    programme: 'Primary',
    option: 'Science',
    description: 'Laboratory investigations: focal length of lenses, electrical resistance measurements and pendulum mechanics.'
  },
  {
    code: 'EBS 228',
    title: 'Social Studies as an Integrated Subject',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Social Studies',
    description: 'Thematic synthesis of history, geography, sociology, and economics to solve societal problems.'
  },
  {
    code: 'EBS 229',
    title: 'Sound and Movement Notation',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Performing Arts',
    description: 'Solfège pitch notation, rhythm transcription, Labanotation fundamentals and traditional dance notation.'
  },
  {
    code: 'EBS 233',
    title: 'Ghanaian Language & Culture: Essay Writing',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Ghanaian Language',
    description: 'Advanced essay composition in indigenous languages: descriptive, narrative, argumentative and expository essays.'
  },
  {
    code: 'EBS 254',
    title: 'General Chemistry Theory II',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Science',
    description: 'Thermodynamics, chemical equilibrium, acids and bases, reaction kinetics and basic electrochemistry.'
  },
  {
    code: 'EBS 254P',
    title: 'General Chemistry Practical II',
    level: 200,
    semester: 1,
    credits: 1,
    type: 'Elective',
    programme: 'Primary',
    option: 'Science',
    description: 'Volumetric titration, qualitative inorganic analysis, enthalpy changes and reaction rate determination.'
  },
  {
    code: 'EBS 285',
    title: 'Databases',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'ICT',
    description: 'Relational data models, SQL queries, entity-relationship diagrams and school database management systems.'
  },
  {
    code: 'EBS 289',
    title: 'Nature of Mathematics',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'Mathematics',
    description: 'Mathematical logic, truth tables, valid arguments, proof methods and philosophical perspectives of mathematics.'
  },
  {
    code: 'EBS 290',
    title: 'The Sentence and its Parts',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Elective',
    programme: 'Primary',
    option: 'English Literacy',
    description: 'Constituent analysis, phrase structure rules, grammatical concord and transformational syntactic operations.'
  },

  // --- Junior High School Education (L200 Sem 1) ---
  {
    code: 'EBS 207',
    title: 'English Language Studies II',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Syntactic structures, discourse coherence, academic report writing and communicative competence for JHS.'
  },
  {
    code: 'EBS 215J',
    title: 'General Curriculum Studies',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Curriculum designs in basic education, syllabus sequencing, unit planning and instructional task analysis.'
  },
  {
    code: 'EBS 219',
    title: 'Health, Safety and Social Issues in Schools',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'School wellness, drug abuse prevention, adolescent reproductive health, disaster preparedness and safety.'
  },
  {
    code: 'EBS 291',
    title: 'Field Experience III',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Practicum',
    programme: 'Junior High School',
    description: 'Co-planning with subject mentors in partner JHS schools, micro-teaching sessions and diagnostic pupil assessment.'
  },
  // JHS Subject Options (L200 Sem 1)
  {
    code: 'EBS 210',
    title: 'Algebraic Thinking',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Mathematics',
    description: 'Patterns, algebraic structures, modular arithmetic, groups, rings and algebraic modeling of real-world phenomena.'
  },
  {
    code: 'EBS 289',
    title: 'Nature of Mathematics',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Mathematics',
    description: 'Axiomatic systems, formal proofs, epistemology of mathematics and mathematical problem-solving heuristics.'
  },
  {
    code: 'EBS 216',
    title: 'General Physics Theory II',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Thermodynamics, kinetic theory of gases, electrostatics, magnetic fields and electromagnetic induction.'
  },
  {
    code: 'EBS 216P',
    title: 'General Physics Practical II',
    level: 200,
    semester: 1,
    credits: 1,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Experiments on heat capacity, Ohm’s law verification, potentiometer circuits and resonance tube acoustics.'
  },
  {
    code: 'EBS 247',
    title: 'Curriculum Studies in Science',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'JHS Integrated Science syllabus, laboratory management, scientific inquiry methods and improvising equipment.'
  },
  {
    code: 'EBS 254',
    title: 'General Chemistry Theory II',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Chemical bonding, molecular geometry, periodic trends, rate laws, equilibrium constants and redox reactions.'
  },
  {
    code: 'EBS 254P',
    title: 'General Chemistry Practical II',
    level: 200,
    semester: 1,
    credits: 1,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Acid-base titrations, solubility product determinations, thermochemical measurements and salt analysis.'
  },
  {
    code: 'EBS 221',
    title: 'Foundations of TVET',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Technical Skills',
    description: 'Philosophy, history and socio-economic role of technical and vocational education and training in Ghana.'
  },
  {
    code: 'EBS 232',
    title: 'Wood Technology I (Materials, Tools & Processes)',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Technical Skills',
    description: 'Timber classification, seasoning, hand woodworking tools, wood joints, adhesives and workshop safety.'
  },
  {
    code: 'EBS 256',
    title: 'Construction Technology I (Substructure Construction)',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Technical Skills',
    description: 'Site reconnaissance, setting out of buildings, foundation types, trench excavation and damp-proofing.'
  },
  {
    code: 'EBS 242',
    title: 'Curriculum Studies in ICT',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'ICT',
    description: 'JHS Computing curriculum, lesson design for coding, digital citizenship, safety and computer lab pedagogy.'
  },
  {
    code: 'EBS 281',
    title: 'ICT Support Teaching and Learning Strategies',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'ICT',
    description: 'Educational multimedia authoring, interactive whiteboards, learning management platforms and mobile learning.'
  },
  {
    code: 'EBS 285',
    title: 'Databases',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'ICT',
    description: 'Database normalization, SQL queries, relational schema design and database integration in school administration.'
  },
  {
    code: 'EBS 205J',
    title: 'Crop Production',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Agricultural Science',
    description: 'Production practices for major field crops, irrigation, pest and disease epidemiology and harvest logistics.'
  },
  {
    code: 'EBS 220J',
    title: 'Value Chain Agriculture',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Agricultural Science',
    description: 'Agribusiness linkages, agro-processing, cold-chain storage, packaging, market segmentation and farmer cooperatives.'
  },
  {
    code: 'EBS 230',
    title: 'Agricultural Entrepreneurship',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Agricultural Science',
    description: 'Business plan development, farm accounting, risk analysis and youth enterprise incubation in agriculture.'
  },
  {
    code: 'EBS 201',
    title: 'Assemblage and Construction',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Visual Arts',
    description: 'Three-dimensional sculptural constructions, assemblage art, mixed media compositions and spatial balance.'
  },
  {
    code: 'EBS 231',
    title: 'Leather Work',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Visual Arts',
    description: 'Hides and skins preparation, tanning processes, leather cutting, skiving, thonging, stitching and tooling.'
  },
  {
    code: 'EBS 274',
    title: 'Computer Graphics II (Adobe Photoshop)',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Visual Arts',
    description: 'Bitmap graphics, layer manipulation, photo restoration, digital painting and graphic design for educational media.'
  },
  {
    code: 'EBS 214',
    title: 'Textile Fibres and Fabrics',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Vocational Skills',
    description: 'Natural and synthetic fibers, yarn production, fabric construction methods, dyeing, printing and fabric testing.'
  },
  {
    code: 'EBS 225',
    title: 'Meal Management',
    level: 200,
    semester: 1,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Vocational Skills',
    description: 'Menu planning for special dietary needs, food budgeting, culinary techniques, table service and food hygiene.'
  },
  {
    code: 'EBS 211',
    title: 'French Language Structure and Usage III (Oral / Written)',
    level: 200,
    semester: 1,
    credits: '2 + 1',
    type: 'Major',
    programme: 'Junior High School',
    option: 'French',
    description: 'Subjunctive and conditional moods, complex relative clauses, literary tenses and creative essay writing in French.'
  },
  {
    code: 'EBS 240',
    title: 'Curriculum Studies in French',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'French',
    description: 'JHS French syllabus interpretation, communicative language teaching methodology and designing French teaching aids.'
  },
  {
    code: 'EBS 259',
    title: 'Introduction to French Linguistics',
    level: 200,
    semester: 1,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'French',
    description: 'French phonetics, phonological rules, morphology of verbs and nouns, and syntax of modern French.'
  },

  // =========================================================================
  // LEVEL 200 - SECOND SEMESTER
  // =========================================================================

  // --- Early Childhood Education (L200 Sem 2) ---
  {
    code: 'EBS 235',
    title: 'Assessment in Early Childhood Education',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Observational checklists, portfolio assessments, developmental screenings and child progress recording.'
  },
  {
    code: 'EBS 238',
    title: 'Curriculum Studies in ECE',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Emergent early childhood curricula, thematic integration, learning centers and play-based lesson planning.'
  },
  {
    code: 'EBS 257',
    title: 'Introduction to Diverse Learning Needs in Early Childhood Education',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Early identification of developmental delays, individualized education plans (IEPs) and inclusive preschool setups.'
  },
  {
    code: 'EBS 260',
    title: 'Mathematics Activities for Early Childhood Education',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Early numeracy concepts: sorting, classifying, seriation, counting games, spatial awareness and concrete manipulatives.'
  },
  {
    code: 'EBS 264',
    title: 'Science Activities for Early Childhood Education',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Guided discovery, sensory experiments, observing weather, plants, animals and nurturing natural curiosity.'
  },
  {
    code: 'EBS 266',
    title: 'Instructional Methods in Early Childhood Education',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Play-based pedagogy, circle time management, scaffolding, storybook reading and learning center rotation.'
  },
  {
    code: 'EBS 267',
    title: 'Teaching of Music, Movement and Drama',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Nursery rhymes, singing games, creative drama, puppetry, rhythmic dance and expressive arts in early years.'
  },
  {
    code: 'EBS 268',
    title: 'Theory and Principles of Early Childhood Education',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Classical and contemporary early education models: Froebel, Montessori, Reggio Emilia, HighScope and Steiner.'
  },
  {
    code: 'EBS 292',
    title: 'Field Experience IV',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Practicum',
    programme: 'Early Childhood',
    description: 'Direct whole-session teaching practice in preschool classrooms under mentor teacher observation and feedback.'
  },

  // --- Primary Education (L200 Sem 2) ---
  {
    code: 'EBS 234',
    title: 'Assessment in Basic Schools',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Formative assessment strategies, continuous assessment records, constructing diagnostic tests and rubric design.'
  },
  {
    code: 'EBS 239',
    title: 'Curriculum Studies in English',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Teaching phonics, reading fluency, vocabulary, comprehension strategies, handwriting and creative writing.'
  },
  {
    code: 'EBS 243',
    title: 'Curriculum Studies in Mathematics',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Pedagogical content knowledge for primary mathematics: place value, operations, geometry, fractions and word problems.'
  },
  {
    code: 'EBS 247',
    title: 'Curriculum Studies in Science',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Primary science curriculum: activity-based science, scientific inquiry cycles, environmental projects and local aids.'
  },
  {
    code: 'EBS 248',
    title: 'Curriculum Studies in Social Studies',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Primary social studies: inquiry methods, civic education, mapping skills, historical empathy and community surveys.'
  },
  {
    code: 'EBS 252',
    title: 'Educating Individuals with Diverse Learning Needs',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Differentiating instruction, remedial tutoring techniques, behavior intervention plans and inclusive classroom cultures.'
  },
  {
    code: 'EBS 262',
    title: 'General Principles and Methods of Teaching in Basic Schools',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Teaching strategies, classroom organization, questioning techniques, cooperative learning and reflective practice.'
  },
  {
    code: 'EBS 292',
    title: 'Field Experience IV',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Practicum',
    programme: 'Primary',
    description: 'Leading instructional lessons across primary grades, managing group work and executing continuous assessment.'
  },

  // --- Junior High School Education (L200 Sem 2) ---
  {
    code: 'EBS 234',
    title: 'Assessment in Basic Schools',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Test construction, table of specifications, grading systems, standardized scoring and formative feedback.'
  },
  {
    code: 'EBS 252',
    title: 'Educating Individuals with Diverse Learning Needs',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Supporting struggling adolescents, gifted students, behavioral challenges and universal design for learning.'
  },
  {
    code: 'EBS 262',
    title: 'General Principles and Methods of Teaching in Basic Schools',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Direct instruction, problem-based learning, inquiry methods, classroom management and motivation strategies for JHS.'
  },
  {
    code: 'EBS 282',
    title: 'Forms and Functions of the English Clause',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Finite and non-finite clauses, nominal, adjectival and adverbial clauses; syntactic functions and stylistic variations.'
  },
  {
    code: 'EBS 292',
    title: 'Field Experience IV',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Practicum',
    programme: 'Junior High School',
    description: 'Whole-class lesson delivery in major JHS subject area under mentor evaluation and peer observation.'
  },
  // JHS Subject Options (L200 Sem 2)
  {
    code: 'EBS 243',
    title: 'Curriculum Studies in Mathematics',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Mathematics',
    description: 'JHS mathematics syllabus breakdown, lesson sequencing, diagnostic remediation and math lab manipulatives.'
  },
  {
    code: 'EBS 277',
    title: 'Psychological Basis of Teaching and Learning Mathematics',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Mathematics',
    description: 'Cognitive developmental theories in mathematics (Bruner, Dienes, Skemp), math anxiety and conceptual mastery.'
  },
  {
    code: 'EBS 203',
    title: 'Methods of Teaching Science',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Inquiry science teaching, laboratory demonstrations, 5E instructional model and safety protocols.'
  },
  {
    code: 'EBS 212',
    title: 'General Biology Theory II',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Human anatomy and physiology, nervous and endocrine systems, reproduction, genetics and biotechnology.'
  },
  {
    code: 'EBS 212P',
    title: 'General Biology Practical II',
    level: 200,
    semester: 2,
    credits: 1,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Laboratory investigations on organ dissection, physiological simulations, blood grouping and genetics crosses.'
  },
  {
    code: 'EBS 249',
    title: 'Metal Technology II (Manufacturing Processes)',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Technical Skills',
    description: 'Bench work, sheet metal fabrication, forging, oxy-acetylene welding, lathe operations and machine shop safety.'
  },
  {
    code: 'EBS 269',
    title: 'Construction Technology II (Superstructure Construction)',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Technical Skills',
    description: 'Brick and block laying, wall bonding, lintels, scaffolding, reinforced concrete columns, beams and roof trusses.'
  },
  {
    code: 'EBS 287',
    title: 'Curriculum Studies in Technical Skills',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Technical Skills',
    description: 'Pedagogical delivery of BDT/Career Technology, workshop organization, project evaluation and student safety.'
  },
  {
    code: 'EBS 217',
    title: 'Designing Instructional Materials using ICT Tools',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'ICT',
    description: 'Authoring digital courseware, interactive quizzes, video tutorials, audio podcasts and graphic presentations.'
  },
  {
    code: 'EBS 226',
    title: 'Systems Development',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'ICT',
    description: 'System development life cycle (SDLC), requirement gathering, system analysis, flowcharts, pseudo-code and testing.'
  },
  {
    code: 'EBS 286',
    title: 'Network Computing',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'ICT',
    description: 'Computer networking topologies, IP addressing, OSI layers, LAN setup, Wi-Fi configuration and cyber hygiene.'
  },
  {
    code: 'EBS 236J',
    title: 'Curriculum Studies in Agriculture',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Agricultural Science',
    description: 'Teaching agricultural science in JHS: school demonstration farms, practical projects and farm records.'
  },
  {
    code: 'EBS 278',
    title: 'Integrated Soil Fertility Management',
    level: 200,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Agricultural Science',
    description: 'Soil chemistry, mineral nutrition, organic amendments, composting, biofertilizers and soil conservation.'
  },
  {
    code: 'EBS 237',
    title: 'Curriculum Studies in Visual Arts',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Visual Arts',
    description: 'Curriculum planning for Visual Arts, studio demonstration techniques, student exhibitions and art critique.'
  },
  {
    code: 'EBS 273',
    title: 'Applied Visual Communication',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Visual Arts',
    description: 'Typography, poster design, signage, corporate identity, book cover illustration and advertising layout.'
  },
  {
    code: 'EBS 275',
    title: 'Introduction to Picture Making',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Visual Arts',
    description: 'Painting techniques (acrylic, watercolor), printmaking, collage, mosaic and thematic composition.'
  },
  {
    code: 'EBS 250',
    title: 'Curriculum Studies in Home Economics',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Vocational Skills',
    description: 'Pedagogy of food and nutrition, clothing and textiles, practical lab organization and student assessment.'
  },
  {
    code: 'EBS 222',
    title: 'Methods of Teaching French I',
    level: 200,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'French',
    description: 'Oral communicative approach, teaching vocabulary and pronunciation, language games and authentic cultural materials.'
  },
  {
    code: 'EBS 253',
    title: 'Language Structure and Usage IV: Basic French Composition',
    level: 200,
    semester: 2,
    credits: '1 + 2',
    type: 'Major',
    programme: 'Junior High School',
    option: 'French',
    description: 'Advanced essay writing in French, narrative techniques, commercial correspondence and expository discourse.'
  },

  // =========================================================================
  // LEVEL 300 - FIRST SEMESTER
  // =========================================================================
  {
    code: 'EBS 301',
    title: 'Advanced Subject-Specific Pedagogy',
    level: 300,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Higher-order cognitive tasks, conceptual mapping, diagnostic remediation and differentiated subject pedagogies.'
  },
  {
    code: 'EBS 302',
    title: 'Action Research in Educational Practice',
    level: 300,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Identifying classroom challenges, designing pedagogical interventions, data collection and research ethics.'
  },
  {
    code: 'EBS 303',
    title: 'Instructional Leadership and Classroom Management',
    level: 300,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'All',
    description: 'Behavioral intervention, restorative justice in schools, time-on-task optimization and student leadership.'
  },
  {
    code: 'EBS 304',
    title: 'Philosophy and Contemporary Educational Issues',
    level: 300,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'All',
    description: 'Critical analysis of global educational reform, teacher identity, educational equity and technology integration.'
  },
  {
    code: 'EBS 305',
    title: 'School-Community Partnerships and Professional Ethics',
    level: 300,
    semester: 1,
    credits: 2,
    type: 'Core',
    programme: 'All',
    description: 'National Teachers Standards (NTS), teacher code of ethics, SMC/PTA relationships and community resource mobilization.'
  },
  {
    code: 'EBS 391',
    title: 'Supported Teaching in School (STS 3: Practicum)',
    level: 300,
    semester: 1,
    credits: 3,
    type: 'Practicum',
    programme: 'All',
    description: 'Whole-class instructional immersion, delivering complete units and managing formal term evaluations.'
  },

  // =========================================================================
  // LEVEL 300 - SECOND SEMESTER
  // =========================================================================

  // --- Early Childhood Education (L300 Sem 2) ---
  {
    code: 'EBS 336',
    title: 'History and Development of Education in Ghana',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Pre-colonial education, castle schools, missionary education, Accelerated Development Plan, and post-independence reforms.'
  },
  {
    code: 'EBS 338',
    title: 'Introduction to Guidance and Counselling',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Principles of guidance and counseling, appraisal services, referral systems and handling pupil emotional stress.'
  },
  {
    code: 'EBS 339',
    title: 'Introduction to Research Methods in Education',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Quantitative and qualitative research methodologies, sampling designs, questionnaires, interviews and data analysis.'
  },
  {
    code: 'EBS 346',
    title: 'Developmental Physical Activities in Early Childhood Education',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Gross and fine motor skills development, balance, coordination, sensory integration and playground safety.'
  },
  {
    code: 'EBS 348',
    title: 'Educational Statistics',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Measures of central tendency, variability, normal distribution, z-scores, correlation coefficients and test item analysis.'
  },
  {
    code: 'EBS 349',
    title: 'School Management and Administration',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'School leadership styles, staff appraisal, institutional financial management, capitation grant and record keeping.'
  },
  {
    code: 'EBS 363',
    title: 'Studies in Literature – Gender and Writing',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Early Childhood',
    description: 'Feminist literary criticism, representation of women in African prose and poetry, gender stereotypes and female agency.'
  },
  {
    code: 'EBS 392',
    title: 'Micro Teaching',
    level: 300,
    semester: 2,
    credits: 6,
    type: 'Practicum',
    programme: 'Early Childhood',
    description: 'Intensive clinical micro-teaching practicum: peer teaching, video recording analysis and mentor faculty evaluation.'
  },

  // --- Primary Education (L300 Sem 2) ---
  {
    code: 'EBS 336',
    title: 'History and Development of Education in Ghana',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Evolution of education in Ghana, key reform committees (Anamuah-Mensah, Dzobo), Free SHS and teacher professionalization.'
  },
  {
    code: 'EBS 338',
    title: 'Introduction to Guidance and Counselling',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Counseling theories, behavioral therapy, client-centered approach, pastoral care and supporting children in crisis.'
  },
  {
    code: 'EBS 339',
    title: 'Introduction to Research Methods in Education',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Formulating research proposals, literature review synthesis, validity, reliability and preparing thesis drafts.'
  },
  {
    code: 'EBS 348',
    title: 'Educational Statistics',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Descriptive and inferential statistics, t-tests, chi-square tests, item difficulty, discrimination index and SPSS intro.'
  },
  {
    code: 'EBS 349',
    title: 'School Management and Administration',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Headteacher duties, supervisory visits, continuous professional development (CPD) organizing and school inventory.'
  },
  {
    code: 'EBS 350',
    title: 'Statistics and Probability I',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Primary',
    description: 'Probability axioms, permutations, combinations, random variables, binomial and normal probability distributions.'
  },
  {
    code: 'EBS 363',
    title: 'Studies in Literature – Gender and Writing',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Primary',
    description: 'Gender representation in world literature, female African novelists (Ba, Aidoo, Emecheta) and gender empowerment.'
  },
  {
    code: 'EBS 392',
    title: 'Micro Teaching',
    level: 300,
    semester: 2,
    credits: 6,
    type: 'Practicum',
    programme: 'Primary',
    description: 'Intensive peer micro-teaching laboratory, pedagogical simulations and structured mentor supervisory reviews.'
  },
  // Primary Minors (L300 Sem 2)
  {
    code: 'EBS 310',
    title: 'Gender and Development in Africa',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'Social Studies',
    description: 'Gender analysis in socio-economic development, maternal health, girl-child education and affirmative policy frameworks.'
  },
  {
    code: 'EBS 311',
    title: 'General Biology Theory III',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'Science',
    description: 'Ecology, biodiversity conservation, human impacts on Ghanaian ecosystems and pollution mitigation.'
  },
  {
    code: 'EBS 311P',
    title: 'General Biology Practical III',
    level: 300,
    semester: 2,
    credits: 1,
    type: 'Minor',
    programme: 'Primary',
    option: 'Science',
    description: 'Field ecology sampling, water quality bacteriological testing, soil fauna extraction and ecological quadrats.'
  },
  {
    code: 'EBS 331',
    title: 'English in Multilingual Context',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Minor',
    programme: 'Primary',
    option: 'English Literacy',
    description: 'World Englishes, Ghanaian English phonological and lexical features, code-switching and bilingual education.'
  },
  {
    code: 'EBS 333',
    title: 'Creativity in the Performing Arts',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'Performing Arts',
    description: 'Improvisational theater, script writing, choral composition, stage directing and school arts festival organization.'
  },
  {
    code: 'EBS 337',
    title: 'ICT Integration in Education',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'ICT',
    description: 'TPACK framework, blended learning models, educational podcasting and digital assessments.'
  },
  {
    code: 'EBS 340',
    title: 'Islamic Studies',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'RME',
    description: 'Quranic revelation, Hadith traditions, five pillars of Islam, Shariah principles and Islamic ethics.'
  },
  {
    code: 'EBS 344',
    title: 'Organisation and Administration of Physical Education and Sports Programme',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'Physical Education',
    description: 'Planning inter-school sports festivals, athletic tournament brackets, equipment inventory and safety.'
  },
  {
    code: 'EBS 351',
    title: 'Statistics and Probability II',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Minor',
    programme: 'Primary',
    option: 'Mathematics',
    description: 'Continuous random variables, hypothesis testing, confidence intervals, regression analysis and analysis of variance (ANOVA).'
  },
  {
    code: 'EBS 354',
    title: 'Introduction to Textiles Design',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'Visual Arts',
    description: 'Batik dyeing, tie-and-dye techniques, screen printing, loom weaving traditions (Kente) and motif creation.'
  },
  {
    code: 'EBS 364',
    title: 'Rural Sociology and Agricultural Extension',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'Agricultural Science',
    description: 'Rural social structures, innovation diffusion models, farmer communication channels and community empowerment.'
  },
  {
    code: 'EBS 376',
    title: 'Ghanaian Language & Culture: Syntax',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Minor',
    programme: 'Primary',
    option: 'Ghanaian Language',
    description: 'Sentence structures in indigenous Ghanaian languages, serial verb constructions, tone patterns and focus constructions.'
  },

  // --- Junior High School Education (L300 Sem 2) ---
  {
    code: 'EBS 338',
    title: 'Introduction to Guidance and Counselling',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Guidance services in secondary schools: career guidance, adolescent counseling, ethics and record management.'
  },
  {
    code: 'EBS 348',
    title: 'Educational Statistics',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Statistical estimation, probability distributions, testing hypotheses, correlation and test score interpretation.'
  },
  {
    code: 'EBS 349',
    title: 'School Management and Administration',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Administrative communication, school climate, teacher evaluation, parent-teacher relations and school governance.'
  },
  {
    code: 'EBS 355',
    title: 'In-Service Education and Training',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Professional learning communities (PLCs), mentoring apprentice teachers, designing staff development workshops.'
  },
  {
    code: 'EBS 363',
    title: 'Studies in Literature – Gender and Writing',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Core',
    programme: 'Junior High School',
    description: 'Gender dynamics in contemporary African literature, literary theory, textual analysis and essay criticism.'
  },
  {
    code: 'EBS 392',
    title: 'Micro Teaching',
    level: 300,
    semester: 2,
    credits: 6,
    type: 'Practicum',
    programme: 'Junior High School',
    description: 'Intensive JHS micro-teaching practicum, peer critique sessions, video analysis and lesson plan defensibility.'
  },
  // JHS Subject Option Majors (L300 Sem 2)
  {
    code: 'EBS 351',
    title: 'Statistics and Probability II',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Mathematics',
    description: 'Hypothesis testing, regression analysis, correlation, probability distributions and statistical inference.'
  },
  {
    code: 'EBS 311',
    title: 'General Biology Theory III',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Environmental biology, biome ecology, pollution biology, conservation policies and environmental impact assessment.'
  },
  {
    code: 'EBS 311P',
    title: 'General Biology Practical III',
    level: 300,
    semester: 2,
    credits: 1,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Science',
    description: 'Laboratory assays in water analysis, environmental bio-indicators, specimen mounting and ecological field studies.'
  },
  {
    code: 'EBS 342',
    title: 'Graphic Communication II (Building and Engineering Drawing)',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Technical Skills',
    description: 'Architectural floor plans, elevations, sectional views, electrical/plumbing symbols and engineering component drafting.'
  },
  {
    code: 'EBS 372',
    title: 'PC Maintenance Troubleshooting Computers',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'ICT',
    description: 'Hardware diagnostics, motherboard components, BIOS configuration, disk partitioning, OS recovery and virus mitigation.'
  },
  {
    code: 'EBS 364J',
    title: 'Rural Sociology and Agricultural Extension',
    level: 300,
    semester: 2,
    credits: 3,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Agricultural Science',
    description: 'Agricultural extension methodologies, rural community dynamics, farmer field schools and technology adoption.'
  },
  {
    code: 'EBS 354',
    title: 'Introduction to Textiles Design',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Major',
    programme: 'Junior High School',
    option: 'Visual Arts',
    description: 'Pattern repeats, textile printing, resist dyeing techniques, Kente weaving analysis and contemporary textile arts.'
  },
  {
    code: 'EBS 334',
    title: 'Food and Culture',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Elective',
    programme: 'Junior High School',
    option: 'Vocational Skills',
    description: 'Culinary traditions of Ghana, cultural food taboos, festive dishes, indigenous food preservation and food tourism.'
  },
  {
    code: 'EBS 352',
    title: 'Clothing Management',
    level: 300,
    semester: 2,
    credits: 2,
    type: 'Elective',
    programme: 'Junior High School',
    option: 'Vocational Skills',
    description: 'Wardrobe planning, garment care and laundering, stain removal, clothing psychology and consumer economics.'
  },
  {
    code: 'EBS 335',
    title: 'Language Structure and Usage VI: Advanced French Composition (Oral / Written)',
    level: 300,
    semester: 2,
    credits: '1 + 2',
    type: 'Major',
    programme: 'Junior High School',
    option: 'French',
    description: 'Advanced translation techniques (French to English and vice-versa), stylistic analysis and dissertation writing in French.'
  },

  // =========================================================================
  // LEVEL 400 - FIRST SEMESTER (Supported Teaching in School / Internship)
  // =========================================================================
  {
    code: 'EBS 411',
    title: 'Supported School Placement / Full-Year Internship Practicum (Part I)',
    level: 400,
    semester: 1,
    credits: 6,
    type: 'Practicum',
    programme: 'All',
    description: 'Full-time apprentice immersion in partner basic schools as an intern teacher under dedicated school mentor supervision.'
  },
  {
    code: 'EBS 412',
    title: 'Classroom Action Research Project Implementation',
    level: 400,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Executing classroom interventions, collecting qualitative and quantitative baseline and post-intervention student metrics.'
  },
  {
    code: 'EBS 413',
    title: 'Professional Teaching Portfolio Development (Part I)',
    level: 400,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Documenting teaching artefacts, lesson plans, student work samples, and reflective narratives aligned with NTS standards.'
  },
  {
    code: 'EBS 414',
    title: 'Educational Policies, Administration and School Law',
    level: 400,
    semester: 1,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Ghana Education Service (GES) administrative structures, school budgeting, headteacher responsibilities, and child protection law.'
  },

  // =========================================================================
  // LEVEL 400 - SECOND SEMESTER (Capstone, Research Defense & Licensure)
  // =========================================================================
  {
    code: 'EBS 421',
    title: 'Post-Internship Capstone Seminar and Teacher Reflection',
    level: 400,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Synthesis of year-long internship experiences, pedagogical triumphs, classroom challenges, and collegial seminar presentations.'
  },
  {
    code: 'EBS 422',
    title: 'Action Research Project Report and Oral Defense',
    level: 400,
    semester: 2,
    credits: 6,
    type: 'Core',
    programme: 'All',
    description: 'Final submission and oral defense of the action research dissertation demonstrating improved pupil outcomes.'
  },
  {
    code: 'EBS 423',
    title: 'Comprehensive Teaching Portfolio Assessment',
    level: 400,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Final external assessment of the trainee professional teaching portfolio for certification and licensure recommendation.'
  },
  {
    code: 'EBS 424',
    title: 'Ghana Teacher Licensure Examination (GTLE) Preparation and Induction',
    level: 400,
    semester: 2,
    credits: 3,
    type: 'Core',
    programme: 'All',
    description: 'Preparation for the National Teaching Council (NTC) licensure examinations, resume building, and professional induction into GES.'
  }
];

export function getCoursesByLevelAndSemester(
  level: number,
  semester: 1 | 2,
  userProgramme?: string,
  userOption?: string
): Course[] {
  // Normalize user program
  let progCategory: AcademicProgram = 'All';
  if (userProgramme) {
    const p = userProgramme.toLowerCase();
    if (p.includes('early childhood')) {
      progCategory = 'Early Childhood';
    } else if (p.includes('primary')) {
      progCategory = 'Primary';
    } else if (p.includes('junior high') || p.includes('jhs')) {
      progCategory = 'Junior High School';
    }
  }

  return UCC_BED_COURSES.filter((c) => {
    // Level & Semester match
    if (c.level !== level || c.semester !== semester) return false;

    // Program filter: Course must belong to 'All' or user's program
    if (progCategory !== 'All' && c.programme !== 'All' && c.programme !== progCategory) {
      return false;
    }

    // Option filter for JHS or Primary if specified
    if (userOption && userOption !== 'all' && c.option) {
      if (c.option.toLowerCase() !== userOption.toLowerCase()) {
        return false;
      }
    }

    return true;
  });
}
