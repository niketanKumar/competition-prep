// flashcards.js — Seed flashcard data for all major subjects
export const SEED_FLASHCARDS = [
  // MATERIA MEDICA
  { id: 'f1', subject: 'materia-medica', difficulty: 'medium',
    front: 'What is the keynote modality that differentiates Arsenicum Album from other remedies with midnight aggravation?',
    back: 'Arsenicum Album aggravates from 1–3 AM (specifically after midnight). The patient is extremely restless despite being weak ("the weakness is out of proportion to the disease"), chilly, and desires warmth. Thirst for small, frequent sips of water. Fear of death and of being alone.' },
  { id: 'f2', subject: 'materia-medica', difficulty: 'easy',
    front: 'Name the remedy known as "Keynote: Aggravation from consolation"',
    back: 'Natrum Muriaticum — The patient is deeply sensitive but closed, weeps alone, and becomes irritable or angry when someone tries to console them. Desires salt, aversion to bread. Headaches like "little hammers." Aggravation from sun exposure.' },
  { id: 'f3', subject: 'materia-medica', difficulty: 'hard',
    front: 'What are the 3 "B" remedies that follow Calcarea Carbonica well?',
    back: '1. Belladonna (Bell-Calc-Bell relationship — complementary)\n2. Bryonia\n3. Baryta Carbonica\nCalcarea Carb is also complementary to Belladonna. Remember: "After Calc, think Bell."' },
  { id: 'f4', subject: 'materia-medica', difficulty: 'medium',
    front: 'Rhus Toxicodendron — key modalities (better/worse)',
    back: 'BETTER: Motion (initial motion or continued), warmth, hot applications, stretching, rubbing\nWORSE: Rest (first motion), getting wet/cold rain, beginning of motion, night, overexertion\nKeynote: "Rusty gate" — stiff on first motion, loosens with continued movement.' },
  { id: 'f5', subject: 'materia-medica', difficulty: 'medium',
    front: 'Which remedy has the symptom "desire for company but does not want to be talked to"?',
    back: 'Sepia — The patient is indifferent to loved ones, averse to consolation but wants someone present. Also: bearing down sensation in pelvis, worse from cold, better from vigorous exercise. Keynote: "empty, hollow feeling in epigastrium not relieved by eating."' },

  // ORGANON
  { id: 'f6', subject: 'organon', difficulty: 'easy',
    front: 'State Aphorism 1 of Organon of Medicine (Hahnemann)',
    back: '"The physician\'s high and only mission is to restore the sick to health, to cure, as it is termed." — This is the foundational aphorism establishing the goal of Homoeopathic medicine as restoration of health, not management of disease.' },
  { id: 'f7', subject: 'organon', difficulty: 'medium',
    front: 'What are the Three Pillars (Trinity) of Homoeopathy?',
    back: '1. Law of Similars (Similia Similibus Curentur — Like cures Like)\n2. Law of Simplex (Single remedy at a time)\n3. Law of Minimum Dose (smallest possible dose that can stimulate the vital force)\nHahnemann also added the principle of Potentization as a fourth concept.' },
  { id: 'f8', subject: 'organon', difficulty: 'hard',
    front: 'What are the four editions of Organon and their key additions?',
    back: '1st (1810): Term "Homoeopathy" introduced\n2nd (1819): Additions on diet, psora hint\n3rd (1824): More on psora, miasms introduced\n4th (1829): Miasm theory detailed (Psora, Sycosis, Syphilis)\n5th (1833): Olfaction method for dose\n6th (1842/pub.1921): 50 Millesimal (LM) scale introduced' },
  { id: 'f9', subject: 'organon', difficulty: 'medium',
    front: 'Aphorism 153 — What symptoms are MOST IMPORTANT in remedy selection?',
    back: '"The more striking, singular, uncommon and peculiar (characteristic) signs and symptoms of the case of disease are chiefly and most solely to be kept in view."\nThese PQRS (Peculiar, Queer, Rare, Strange) symptoms individualize the patient and point to the specific simillimum.' },

  // REPERTORY
  { id: 'f10', subject: 'repertory', difficulty: 'easy',
    front: 'What are the grades (bold, italics, plain) in Kent\'s Repertory and what do they mean?',
    back: 'Grade 3 (BOLD/CAPS): Remedy is most strongly indicated, highest confidence\nGrade 2 (Italics): Remedy is frequently indicated\nGrade 1 (Plain): Remedy has been observed but less confirmed\nGrade 3 remedies take precedence in analysis.' },
  { id: 'f11', subject: 'repertory', difficulty: 'medium',
    front: 'What is the difference between Kent\'s Repertory and Boenninghausen\'s TPB?',
    back: 'Kent\'s Repertory: Symptom-based, uses complete symptoms (location+sensation+modality), organized by body systems, Mind chapter first.\nBoenninghausen\'s TPB: Based on doctrine of analogy, separates symptoms into components (location, sensation, modalities, concomitants), allows cross-referencing of incomplete symptoms. Better for one-sided diseases.' },

  // PHARMACY
  { id: 'f12', subject: 'pharmacy', difficulty: 'medium',
    front: 'What vehicle is used for LM (50 millesimal) potency preparation?',
    back: 'Vehicle: Poppy-seed-sized globules (smallest available, size #10 globules)\nThe 1st LM is made by dissolving 1 pellet of 3C trituration in 500 drops of 87% alcohol, then one drop + 100 globules. Each subsequent LM: 1 globule dissolved, succussed.\nNamed "Medicaments au globule" by Hahnemann.' },
  { id: 'f13', subject: 'pharmacy', difficulty: 'easy',
    front: 'What is the alcohol percentage used in centesimal potency preparation (stock)?',
    back: 'Centesimal potency preparation: 87% v/v alcohol for dilution.\nFor mother tinctures: varies by substance (fresh plant parts generally use lower alcohol 45-60%; dry parts use higher 60-90%).\nHPI (Homoeopathic Pharmacopoeia of India) specifies each percentage.' },

  // COMMUNITY MEDICINE
  { id: 'f14', subject: 'community', difficulty: 'easy',
    front: 'What is the full form and significance of ICMR?',
    back: 'ICMR = Indian Council of Medical Research\nApex body for biomedical research in India, established 1911 (then ISMR). Funded by Ministry of Health. Conducts and coordinates medical research including epidemiology, disease control, and clinical trials in India.' },
  { id: 'f15', subject: 'community', difficulty: 'medium',
    front: 'Define Maternal Mortality Rate (MMR) and India\'s current MMR target',
    back: 'MMR = (Number of maternal deaths in a year / Number of live births in the same year) × 1,00,000\nMaternal death = death during pregnancy or within 42 days of delivery due to causes related to pregnancy.\nSDG target: < 70 per 1,00,000 live births by 2030\nIndia\'s MMR has improved from 254 (2004) to around 97 (2022).' },

  // SURGERY
  { id: 'f16', subject: 'surgery', difficulty: 'easy',
    front: 'What are the 4 classic features of Acute Appendicitis?',
    back: '1. Pain: starts periumbilical → shifts to RIF (right iliac fossa) — McBurney\'s point\n2. Nausea/Vomiting: after onset of pain\n3. Fever: low-grade (37.5-38.5°C)\n4. Leucocytosis: raised WBC count\nMcBurney\'s sign: tenderness at McBurney\'s point (1/3 from ASIS on line to umbilicus).' },

  // ANATOMY
  { id: 'f17', subject: 'anatomy', difficulty: 'medium',
    front: 'What is the "anatomical snuff box" and what structures are at risk in its fractures?',
    back: 'Anatomical Snuff Box: Depression on dorsum of wrist between extensor pollicis longus and brevis tendons.\nFloor: Scaphoid bone (most commonly fractured carpal bone)\nAt risk: Scaphoid fracture (at waist) → avascular necrosis of proximal fragment because blood supply enters distally.\nContents: Radial artery (crossing floor) and cephalic vein.' },
];

// ─── Auto-Convert MCQs to Flashcards ──────────────────────────────────────────
export function convertQuestionToFlashcard(q) {
  const optionsText = Array.isArray(q.options)
    ? q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')
    : '';

  const correctAns = Array.isArray(q.options) && typeof q.correct === 'number' && q.options[q.correct]
    ? `${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}`
    : 'Correct Option';

  const expText = q.exp ? `\n\n📖 Explanation:\n${q.exp.replace(/<[^>]*>?/gm, '')}` : '';

  return {
    id: `auto-fc-${q.id}`,
    questionId: q.id,
    subject: q.subject || 'materia-medica',
    difficulty: q.difficulty || 'medium',
    autoGenerated: true,
    front: `📝 Question:\n${q.q}\n\nOptions:\n${optionsText}`,
    back: `✅ Answer: ${correctAns}${expText}`,
    image: q.image_url || q.imageUrl || q.image || null,
  };
}

// ─── Adaptive Flashcard Queue Algorithm ────────────────────────────────────────
export function getAdaptiveFlashcards(mode = 'adaptive', allQuestions = [], customFlashcards = []) {
  const history = JSON.parse(localStorage.getItem('hp_test_history') || '[]');

  // Collect set of question IDs attempted and question IDs answered WRONG
  const attemptedQIds = new Set();
  const wrongQIds     = new Set();
  const attemptedSubjects = new Set();

  history.forEach(session => {
    (session.questions || []).forEach(q => {
      attemptedQIds.add(q.id);
      attemptedSubjects.add(q.subject);
      if (q.selected !== undefined && q.selected !== q.correct) {
        wrongQIds.add(q.id);
      }
    });
  });

  // 1. Weak / Incorrect Questions Flashcards
  const weakFlashcards = allQuestions
    .filter(q => wrongQIds.has(q.id))
    .map(q => ({
      ...convertQuestionToFlashcard(q),
      badge: '🔥 Reinforce Weak Topic',
      priority: 1
    }));

  // 2. Unread / Unattempted Subject Flashcards
  const unreadFlashcards = allQuestions
    .filter(q => !attemptedQIds.has(q.id))
    .map(q => ({
      ...convertQuestionToFlashcard(q),
      badge: '🌱 New Topic Discovery',
      priority: 2
    }));

  // 3. Custom & Seed Flashcards
  const standardFlashcards = [...SEED_FLASHCARDS, ...customFlashcards].map(f => ({
    ...f,
    badge: f.badge || '📚 Core Concept',
    priority: 3
  }));

  // Mode Filter Switch
  if (mode === 'weak') {
    return weakFlashcards.length ? weakFlashcards : standardFlashcards;
  }
  if (mode === 'unread') {
    return unreadFlashcards.length ? unreadFlashcards : standardFlashcards;
  }
  if (mode === 'all') {
    return [...standardFlashcards, ...weakFlashcards, ...unreadFlashcards];
  }

  // Default 'adaptive' mode: Priority blend (Weak 50%, Unread 30%, Standard 20%)
  const blend = [];
  if (weakFlashcards.length > 0) blend.push(...weakFlashcards.slice(0, 15));
  if (unreadFlashcards.length > 0) blend.push(...unreadFlashcards.slice(0, 15));
  blend.push(...standardFlashcards);

  // De-duplicate by ID
  const seen = new Set();
  return blend.filter(f => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}

export default SEED_FLASHCARDS;
