// subjects.js — AIAPGET 2026 Official NCH Subject Configuration with Weightage, Priority, and Key Topics
export const SUBJECTS = [
  {
    id: 'materia-medica',
    name: 'Materia Medica',
    questions: 16,
    marks: 64,
    priority: 'Very High',
    priorityBadge: '🔥 Very High (16Q / 64 Marks)',
    color: '#C4714F',
    bg: '#FAF0EB',
    icon: '🌿',
    keyTopics: [
      'Keynotes & characteristic symptoms of major remedies',
      'Drug relationships (complementary, inimical, antidotal)',
      'Remedy differentials between closely related drugs',
      'Modalities, sensations & mental symptoms of polychrests',
      'Allen’s Keynotes, Boericke & Nash’s Leaders references',
      'Nosodes & Sarcodes indications'
    ]
  },
  {
    id: 'organon',
    name: 'Organon of Medicine',
    questions: 16,
    marks: 64,
    priority: 'Very High',
    priorityBadge: '🔥 Very High (16Q / 64 Marks)',
    color: '#6B8F71',
    bg: '#EDF3EE',
    icon: '📖',
    keyTopics: [
      'Aphorisms 1–291 of Organon with footnotes',
      'Kent’s Lectures on Homoeopathic Philosophy',
      'Vital force, susceptibility, miasms (Psora, Sycosis, Syphilis)',
      'Totality of symptoms & individualisation',
      'Hahnemann’s Theory of Chronic Diseases',
      'Posology, potency selection & repetition rules',
      'Hering’s Law & directions of cure',
      'History of homoeopathy & contributions of key stalwarts'
    ]
  },
  {
    id: 'repertory',
    name: 'Repertory',
    questions: 16,
    marks: 64,
    priority: 'Very High',
    priorityBadge: '🔥 Very High (16Q / 64 Marks)',
    color: '#8B6F47',
    bg: '#F5EFE7',
    icon: '📚',
    keyTopics: [
      'Structure & plan of Kent’s Repertory (37 chapters)',
      'Boericke’s Repertory & Synthesis Repertory',
      'Rubric grading system (1st, 2nd, 3rd grade)',
      'Repertorisation methods (totality, eliminative, concomitant)',
      'Clinical repertory & its applications',
      'History of repertory (Kent, Boenninghausen, Boger)'
    ]
  },
  {
    id: 'practice',
    name: 'Practice of Medicine',
    questions: 16,
    marks: 64,
    priority: 'Very High',
    priorityBadge: '🔥 Very High (16Q / 64 Marks)',
    color: '#5B7FA6',
    bg: '#EBF2F9',
    icon: '🏥',
    keyTopics: [
      'Clinical diagnosis & features of common conditions',
      'Homoeopathic management of acute & chronic diseases',
      'Fevers, respiratory, GI & cardiovascular diseases',
      'Paediatric conditions & homoeopathic remedies',
      'Skin diseases, urinary tract & neurological disorders',
      'Linking clinical presentations to Materia Medica'
    ]
  },
  {
    id: 'pharmacy',
    name: 'Homoeopathic Pharmacy',
    questions: 12,
    marks: 48,
    priority: 'High',
    priorityBadge: '⭐ High (12Q / 48 Marks)',
    color: '#9B6BB5',
    bg: '#F5EEF8',
    icon: '⚗️',
    keyTopics: [
      'Sources of homoeopathic drugs (plant, animal, mineral, nosode)',
      'Preparation methods (potentisation, trituration, succussion)',
      'Decimal, Centesimal & LM (50 Millesimal) scales',
      'Preservation, storage & vehicle preparation',
      'Pharmacopoeia & legal rules of medicines',
      'Drug proving rules & methodology'
    ]
  },
  {
    id: 'community',
    name: 'Community Medicine',
    questions: 9,
    marks: 36,
    priority: 'High',
    priorityBadge: '⭐ High (9Q / 36 Marks)',
    color: '#D4A035',
    bg: '#FDF3DC',
    icon: '🏘️',
    keyTopics: [
      'Epidemiology & biostatistics concepts',
      'Communicable & non-communicable disease control',
      'National Health Programmes (immunisation, TB, malaria)',
      'Nutrition & nutritional deficiency diseases',
      'Environmental health & water-borne diseases',
      'Health administration & planning in India'
    ]
  },
  {
    id: 'surgery',
    name: 'Surgery',
    questions: 8,
    marks: 32,
    priority: 'Medium',
    priorityBadge: '📌 Medium (8Q / 32 Marks)',
    color: '#C44F6A',
    bg: '#FDF0F3',
    icon: '🔬',
    keyTopics: [
      'Wound healing & types of wounds',
      'Burns classification & emergency management',
      'Fractures, dislocation types & healing',
      'Common surgical conditions of acute abdomen',
      'Hernias, appendicitis & intestinal obstruction',
      'Thyroid & breast surgery basics',
      'Surgical infections & aseptic techniques'
    ]
  },
  {
    id: 'obs-gynae',
    name: 'Obstetrics & Gynaecology',
    questions: 8,
    marks: 32,
    priority: 'Medium',
    priorityBadge: '📌 Medium (8Q / 32 Marks)',
    color: '#B06080',
    bg: '#F9EEEE',
    icon: '👶',
    keyTopics: [
      'Normal pregnancy, antenatal care & fetal development',
      'Labour stages, mechanisms & abnormal labor',
      'APH (placenta praevia, abruptio) & PPH management',
      'Hypertensive disorders (pre-eclampsia & eclampsia)',
      'Ectopic pregnancy, abortions & puerperium',
      'Menstrual disorders (dysmenorrhoea, amenorrhoea)',
      'Gynaecological infections (PID, vaginitis, cervicitis)',
      'Fibroids, ovarian cysts, endometriosis & infertility',
      'Contraception & family planning',
      'Cross-linking Obs-Gynae with Materia Medica remedies'
    ]
  },
  {
    id: 'anatomy',
    name: 'Anatomy',
    questions: 5,
    marks: 20,
    priority: 'Moderate',
    priorityBadge: '🔹 Moderate (5Q / 20 Marks)',
    color: '#5A8C7A',
    bg: '#EEF5F2',
    icon: '🦴',
    keyTopics: [
      'Clinically relevant gross anatomy of all systems',
      'High-yield structures & anatomical relations',
      'Embryology of major organs & germ layers',
      'Histology of key tissues & organs',
      'Neuroanatomy (cranial nerves, spinal cord tracts)'
    ]
  },
  {
    id: 'physiology',
    name: 'Physiology',
    questions: 5,
    marks: 20,
    priority: 'Moderate',
    priorityBadge: '🔹 Moderate (5Q / 20 Marks)',
    color: '#4A7C59',
    bg: '#EDF5EF',
    icon: '🫀',
    keyTopics: [
      'Nerve & muscle action potential physiology',
      'CVS, cardiac cycle & BP regulation',
      'Respiratory mechanics & gas exchange',
      'Endocrinology, hormone actions & feedback',
      'Reproductive physiology & menstrual hormonal axis',
      'Renal physiology & acid-base balance'
    ]
  },
  {
    id: 'pathology',
    name: 'Pathology',
    questions: 5,
    marks: 20,
    priority: 'Moderate',
    priorityBadge: '🔹 Moderate (5Q / 20 Marks)',
    color: '#7A5A8C',
    bg: '#F2EEF5',
    icon: '🔭',
    keyTopics: [
      'Cell injury, necrosis, inflammation & tissue repair',
      'Neoplasia, staging, grading & tumour spread',
      'Haematology (anaemias, leukemias, coagulation)',
      'Organ pathology (liver, kidney, lung, heart)',
      'Immunopathology & hypersensitivity reactions'
    ]
  },
  {
    id: 'forensic',
    name: 'Forensic Medicine & Toxicology',
    questions: 4,
    marks: 16,
    priority: 'Lower',
    priorityBadge: '🔹 Lower (4Q / 16 Marks)',
    color: '#8C5A5A',
    bg: '#F5EEEE',
    icon: '⚖️',
    keyTopics: [
      'Medico-legal aspects of medical practice & duties',
      'Death types, post-mortem changes & rigor mortis',
      'Injuries, mechanical wounds & ballistics',
      'Common poisons, antidote management & toxicology',
      'Alcohol & medico-legal aspects'
    ]
  },
  {
    id: 'general-homoeopathy',
    name: 'General Homoeopathy',
    questions: 0,
    marks: 0,
    priority: 'General',
    priorityBadge: '🌐 General Homoeopathy',
    color: '#3B82F6',
    bg: '#EFF6FF',
    icon: '🩺',
    keyTopics: [
      'General questions & unclassified Homoeopathy topics',
      'Imported paper collections & mixed previous year questions',
      'Interdisciplinary homoeopathic principles & clinical concepts'
    ]
  }
];

export const TOTAL_QUESTIONS = 120;
export const TOTAL_MARKS     = 480;
export const MARKS_CORRECT   = 4;
export const MARKS_WRONG     = -1;
export const TEST_DURATION   = 120; // minutes

export const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map(s => [s.id, s]));

export function getSubjectByName(name) {
  return SUBJECTS.find(s => s.name.toLowerCase() === name.toLowerCase()) || null;
}

export function subjectColor(subjectId) {
  return SUBJECT_MAP[subjectId]?.color || '#8B6F47';
}

export function subjectBg(subjectId) {
  return SUBJECT_MAP[subjectId]?.bg || '#F5EFE7';
}

export function normalizeSubjectId(rawSubjectStr, fallbackId = 'general-homoeopathy') {
  if (!rawSubjectStr) return fallbackId;
  const str = String(rawSubjectStr).trim().toLowerCase();

  // Direct ID match
  const directMatch = SUBJECTS.find(s => s.id === str);
  if (directMatch) return directMatch.id;

  // Direct Name match
  const nameMatch = SUBJECTS.find(s => s.name.toLowerCase() === str);
  if (nameMatch) return nameMatch.id;

  // Alias / Fuzzy Map
  if (str.includes('general') || str.includes('homoeopathy') || str.includes('homeopathy')) return 'general-homoeopathy';
  if (str.includes('gynaecol') || str.includes('gynec') || str.includes('obstetric') || str.includes('gynae') || str.includes('obs')) return 'obs-gynae';
  if (str.includes('community') || str.includes('psm')) return 'community';
  if (str.includes('practice') || str.includes('medicine')) return 'practice';
  if (str.includes('pharmacy')) return 'pharmacy';
  if (str.includes('forensic') || str.includes('toxicology') || str.includes('fmt')) return 'forensic';
  if (str.includes('materia') || str.includes('medica')) return 'materia-medica';
  if (str.includes('organon')) return 'organon';
  if (str.includes('repertor')) return 'repertory';
  if (str.includes('surger')) return 'surgery';
  if (str.includes('anatom')) return 'anatomy';
  if (str.includes('physiol')) return 'physiology';
  if (str.includes('pathol')) return 'pathology';

  return fallbackId;
}
