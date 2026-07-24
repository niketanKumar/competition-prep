// questions.js — Seed question bank with sample AIAPGET-style questions
export const SEED_QUESTIONS = [
  // ── MATERIA MEDICA (16 per exam) ────────────────────────────────────────
  {
    id: 1, subject: 'materia-medica', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'Spinal affections with burning along whole length of spine; backache, much worse from sitting, better by walking about. Nape of neck weary from writing or any exertion. Pain in small of back; cannot bear back touched. Dull aching about the last dorsal or first lumbar vertebrae; worse sitting. Select the right remedy:',
    options: ['Rhus Toxicodendron', 'Agaricus Muscarius', 'Theridion Curassavicum', 'Zincum Metallicum'],
    correct: 3,
    exp: 'Zincum metallicum has a characteristic dull aching about the last dorsal or first lumbar vertebra that is worse from sitting and better by walking about. Rhus Tox has aching and stiffness better by motion but not specifically at these vertebrae. Agaricus has spinal irritation with icy coldness. Theridion has extreme sensitiveness to noise with spinal symptoms.',
    tags: ['Kent', 'Drug keynotes', 'Spine'],
  },
  {
    id: 2, subject: 'materia-medica', year: 2024, difficulty: 'hard',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: '"Keynote of the remedy is aggravation from consolation." Which remedy is this?',
    options: ['Pulsatilla', 'Natrum Muriaticum', 'Sepia', 'Ignatia'],
    correct: 1,
    exp: 'Natrum Muriaticum is the classic remedy with aggravation from consolation. The patient becomes irritable and more upset when someone tries to console them. Pulsatilla is better from consolation (desires sympathy). Sepia is indifferent to loved ones but not specifically aggravated by consolation. Ignatia also may refuse consolation but Natrum Mur is the keynote remedy.',
    tags: ['Keynotes', 'Mentals', 'Kent'],
  },
  {
    id: 3, subject: 'materia-medica', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'A patient presents with extreme restlessness, anxiety, fear of death, worse after midnight (12-3 AM), chilly, better from warmth. Thirst for small sips. The most appropriate remedy is:',
    options: ['Aconite Napellus', 'Arsenicum Album', 'Rhus Toxicodendron', 'Phosphorus'],
    correct: 1,
    exp: 'Arsenicum Album is the classic remedy for midnight aggravation (1-3 AM), extreme restlessness with weakness, fear of death, chilly constitution, better from heat, and thirst for small, frequent sips. Aconite has fear of death but aggravates at 12 midnight (not 1-3 AM) and is usually from shock/fright. Rhus Tox is restless but better from motion, not specifically midnight aggravation.',
    tags: ['Arsenicum', 'Modalities', 'Midnight'],
  },
  {
    id: 4, subject: 'materia-medica', year: 2023, difficulty: 'easy',
    group: 'PYQ-2023', verified: true, ai_generated_exp: false,
    q: '"Extreme sensitiveness to all external impressions — light, noise, odors, touch." This characteristic belongs to which remedy?',
    options: ['Nux Vomica', 'Coffea Cruda', 'Theridion Curassavicum', 'Chamomilla'],
    correct: 2,
    exp: 'Theridion Curassavicum (Orange Spider) has extreme sensitiveness to all external impressions, especially noise which penetrates the teeth and goes through the whole body. Also has vertigo from closing the eyes and on sea. Coffea has oversensitiveness from stimulation but mainly to pain and sounds. Nux Vomica is oversensitive but mainly to noise, light, and mental overwork. Chamomilla has oversensitivity mainly to pain.',
    tags: ['Theridion', 'Sensitiveness', 'Keynotes'],
  },
  {
    id: 5, subject: 'materia-medica', year: 2024, difficulty: 'hard',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'Match the following drug relationships:<br>(A) Antidote of Opium is (B) Complementary of Sulphur is (C) Follows well after Calcarea Carb is (D) Inimical to Apis is',
    options: [
      '(A) Coffea (B) Calc Carb (C) Lycopodium (D) Rhus Tox',
      '(A) Camphor (B) Calc Carb (C) Belladonna (D) Rhus Tox',
      '(A) Coffea (B) Lycopodium (C) Belladonna (D) Causticum',
      '(A) Camphor (B) Lycopodium (C) Belladonna (D) Causticum'
    ],
    correct: 3,
    exp: 'Camphor antidotes Opium. Lycopodium is complementary to Sulphur. Belladonna follows well after Calcarea Carbonica (Calc-Bell-Calc relationship). Causticum is inimical to Apis — they should not be given before or after each other. Rhus Tox is inimical to Apis in some references but Causticum is the classic answer for inimical relationship with Apis.',
    tags: ['Drug relations', 'Antidotes', 'Complementary'],
  },

  // ── ORGANON OF MEDICINE (16 per exam) ────────────────────────────────────
  {
    id: 6, subject: 'organon', year: 2025, difficulty: 'easy',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'The highest and only mission of the physician as stated in Aphorism 1 of Organon is:',
    options: [
      'To prescribe the most similar remedy',
      'To restore the sick to health, to cure as it is termed',
      'To investigate diseases and classify them',
      'To understand the vital force and its disturbances'
    ],
    correct: 1,
    exp: 'Aphorism 1 of the Organon of Medicine states: "The physician\'s high and only mission is to restore the sick to health, to cure, as it is termed." This is the foundational aphorism of Homoeopathy. Hahnemann emphasized that the only goal is restoration of health, not diagnosis or disease classification alone.',
    tags: ['Aphorism 1', 'Mission of physician', 'Organon 6th edition'],
  },
  {
    id: 7, subject: 'organon', year: 2024, difficulty: 'medium',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'The concept of "Miasm" was introduced by Hahnemann in which edition of Organon of Medicine?',
    options: ['3rd Edition', '4th Edition', '5th Edition', '6th Edition'],
    correct: 1,
    exp: 'The concept of Chronic Diseases (Miasms — Psora, Sycosis, Syphilis) was introduced by Hahnemann in the 4th Edition of Organon (1829). He first published the concept in "The Chronic Diseases" in 1828. The 6th edition introduced the 50 millesimal (LM) scale of potentization. The 1st edition (1810) introduced the term "Homoeopathy".',
    tags: ['Miasm', 'Organon editions', 'Chronic diseases'],
  },
  {
    id: 8, subject: 'organon', year: 2025, difficulty: 'hard',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'According to Organon Aphorism 153, which symptoms are to be given special weight in choosing the homoeopathic remedy?',
    options: [
      'Common symptoms shared by most patients of the disease',
      'The more striking, singular, uncommon and peculiar symptoms',
      'The symptoms appearing first in the disease course',
      'The physical generals and thermal modalities'
    ],
    correct: 1,
    exp: 'Aphorism 153 states: "In searching for a homoeopathic specific remedy, that is to say, in this comparison of collective symptoms of the natural disease with the list of symptoms of known medicines, in order to find among these an artificial morbific agent corresponding by similarity to the disease to be cured, the more striking, singular, uncommon and peculiar (characteristic) signs and symptoms of the case of disease are chiefly and most solely to be kept in view."',
    tags: ['Aphorism 153', 'Characteristic symptoms', 'Totality'],
  },
  {
    id: 9, subject: 'organon', year: 2023, difficulty: 'medium',
    group: 'PYQ-2023', verified: true, ai_generated_exp: false,
    q: 'The 50 Millesimal scale of potency was introduced by Hahnemann in which edition of Organon?',
    options: ['4th Edition', '5th Edition', '6th Edition', '3rd Edition'],
    correct: 2,
    exp: 'The 50 Millesimal (LM/Q) scale of potentization was introduced by Hahnemann in the 6th edition of Organon of Medicine. This edition was written between 1842-1843 but was only published posthumously in 1921. The name "50 millesimal scale" was coined by Dr. Pierre Schmidt of Geneva.',
    tags: ['LM potency', '50 millesimal', '6th edition'],
  },
  {
    id: 10, subject: 'organon', year: 2024, difficulty: 'easy',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'Vital force according to Hahnemann is:',
    options: [
      'A material substance that can be isolated',
      'A spirit-like dynamis that animates the material body',
      'The immune system of the human body',
      'The mental-emotional energy of a person'
    ],
    correct: 1,
    exp: 'According to Hahnemann (Organon Aphorism 9-12), the vital force is a spirit-like dynamis (autocratic, instinctive force) that animates the material body. In health it maintains normal sensations and functions. In disease, it is primarily deranged by the morbific agent. It is immaterial and cannot be isolated — it is a dynamic/spiritual force, not a material substance.',
    tags: ['Vital force', 'Dynamis', 'Aphorism 9-12'],
  },

  // ── REPERTORY (16 per exam) ──────────────────────────────────────────────
  {
    id: 11, subject: 'repertory', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'In Kent\'s Repertory, the chapter "Mind" comes:',
    options: ['After the chapter on Head', 'At the very beginning (first chapter)', 'After Generalities', 'In the middle of the repertory'],
    correct: 1,
    exp: 'In Kent\'s Repertory of Homoeopathic Materia Medica, the chapter "Mind" is placed first — it is the very first chapter. This reflects the importance of mental/emotional symptoms in Homoeopathic prescribing, as they represent the highest level of the hierarchy of symptoms according to Kent\'s philosophy based on Swedenborg\'s philosophy of levels.',
    tags: ['Kent\'s Repertory', 'Mind chapter', 'Chapter sequence'],
  },
  {
    id: 12, subject: 'repertory', year: 2024, difficulty: 'hard',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'Which of the following symptoms is written under "Generals" chapter in Kent\'s Repertory?',
    options: [
      'Weakness of specific organs (e.g., heart weakness)',
      'Symptoms affecting the whole person (e.g., food desires, temperature)',
      'Symptoms of the head and face',
      'Mental and emotional symptoms'
    ],
    correct: 1,
    exp: 'The Generals chapter in Kent\'s Repertory contains symptoms that affect the whole person — including food and drink desires/aversions, temperature reactions (chilly/warm), time modalities, physical generals like sleep position, and reactions of the whole organism. Specific organ symptoms go to their respective chapters. Head symptoms go to the Head chapter. Mental symptoms go to the Mind chapter.',
    tags: ['Generals chapter', 'Kent\'s Repertory', 'Physical generals'],
  },
  {
    id: 13, subject: 'repertory', year: 2023, difficulty: 'easy',
    group: 'PYQ-2023', verified: true, ai_generated_exp: false,
    q: 'Boenninghausen\'s Therapeutic Pocket Book is based on which principle of Homoeopathy?',
    options: [
      'Law of Simplex — one remedy at a time',
      'Doctrine of analogy and concomitants',
      'Miasmatic theory of Hahnemann',
      'Constitutional prescribing based on diathesis'
    ],
    correct: 1,
    exp: 'Boenninghausen\'s Therapeutic Pocket Book (TPB) is based on the doctrine of analogy — the principle that symptoms (especially modalities and sensations) can be transferred or analogized from one part of the body to another. It also emphasizes concomitant symptoms and the concept of "generals" over locals. It uses the concept of concordances of remedies.',
    tags: ['Boenninghausen', 'TPB', 'Doctrine of analogy'],
  },

  // ── PRACTICE OF MEDICINE (16 per exam) ──────────────────────────────────
  {
    id: 14, subject: 'practice', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'A patient presents with sudden onset high fever, red flushed face, dilated pupils, throbbing headache worse from light and noise, and delirium. The most indicated Homoeopathic remedy is:',
    options: ['Aconite Napellus', 'Belladonna', 'Stramonium', 'Hyoscyamus Niger'],
    correct: 1,
    exp: 'Belladonna presents with sudden violent onset, hot red flushed face (beet-red), dilated pupils, throbbing pains (especially head), high fever with delirium that is bright and vivid, photophobia, aggravation from light, noise, and touch. Aconite has sudden onset with fear and anxiety but less redness. Stramonium has terror and wants light/company. Hyoscyamus has jealousy and obscene delirium without the flushed face.',
    tags: ['Fever', 'Belladonna', 'Acute prescribing'],
  },
  {
    id: 15, subject: 'practice', year: 2024, difficulty: 'hard',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'Second prescription in Homoeopathy is done when:',
    options: [
      'The patient shows no improvement after 7 days',
      'The first prescription produces a homoeopathic aggravation',
      'The indicated remedy has covered all symptoms and the patient is improving',
      'When the patient reports new symptoms arising after the first remedy'
    ],
    correct: 3,
    exp: 'The second prescription is required when new symptoms arise after the first remedy, or when the improvement from the first remedy has clearly stopped (plateau). It may also be needed when the case has changed — new symptoms have come, or old symptoms have gone and the remaining picture calls for a different remedy. A homoeopathic aggravation (if mild) is actually a good sign and typically no new prescription is needed — wait and watch.',
    tags: ['Second prescription', 'Follow-up', 'Case management'],
  },

  // ── HOMOEOPATHIC PHARMACY (12 per exam) ──────────────────────────────────
  {
    id: 16, subject: 'pharmacy', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'Which of the following statements are correct in reference to Fifty millesimal scale of potency? (A) Cones are used as vehicle (B) Dr. Hahnemann had termed the new preparation as "Medicaments au globule" (C) The name "50 millesimal scale" was coined by Dr. P. Schmidt (D) The scale was introduced in sixth edition of Organon of medicine (E) As per HPI instruction, 1 mg of drug substance is triturated with 1000 g of sugar of milk',
    options: [
      '(A),(B) and (C) only',
      '(B),(C) and (D) only',
      '(B),(C) and (E) only',
      '(C),(D) and (E) only'
    ],
    correct: 1,
    exp: '(B) Dr. Hahnemann termed new preparations as "Medicaments au globule" — Correct. (C) Dr. Pierre Schmidt coined the term "50 millesimal scale" — Correct. (D) The scale was introduced in the 6th edition of Organon — Correct. Cones (A) are not used; globules (poppy seed size) are the vehicle. HPI instruction (E) uses 1 mg of drug with 500 mg (not 1000 g) of sugar of milk for the first trituration.',
    tags: ['LM potency', '50 millesimal', 'Pharmacy'],
  },
  {
    id: 17, subject: 'pharmacy', year: 2024, difficulty: 'easy',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'The mother tincture (Q) is prepared by maceration or percolation. The vehicle used for preparation of most mother tinctures is:',
    options: ['Purified Water', 'Distilled Water', 'Ethyl Alcohol (Rectified Spirit)', 'Glycerine'],
    correct: 2,
    exp: 'Mother tinctures in Homoeopathy are predominantly prepared using Ethyl Alcohol (rectified spirit) as the vehicle/menstruum. The strength of alcohol used varies depending on the plant material (fresh or dry, succulent or dry). The HPI (Homoeopathic Pharmacopoeia of India) specifies alcohol percentages for each drug. Water alone is not suitable as it can cause fermentation and degradation.',
    tags: ['Mother tincture', 'Vehicle', 'Pharmacy preparation'],
  },

  // ── COMMUNITY MEDICINE (9 per exam) ──────────────────────────────────────
  {
    id: 18, subject: 'community', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'Arrange phases of evolution of concept of public health in ascending chronological order (earliest to latest): (A) Health Promotion Phase (B) Social Engineering Phase (C) Disease Control Phase (D) Health for All',
    options: ['(C),(B),(A),(D)', '(A),(C),(B),(D)', '(C),(A),(D),(B)', '(C),(A),(B),(D)'],
    correct: 3,
    exp: 'The correct chronological order is: (C) Disease Control Phase (1880–1920) → (A) Health Promotion Phase (1920–1960) → (B) Social Engineering Phase (1960–1980) → (D) Health for All Phase (1980–present). Disease control began with sanitation era. Health promotion focused on individual behavior. Social engineering addressed chronic diseases. Health for all (Alma Ata 1978) focused on primary health care.',
    tags: ['Public health evolution', 'Community medicine', 'Chronology'],
  },
  {
    id: 19, subject: 'community', year: 2024, difficulty: 'easy',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'The Infant Mortality Rate (IMR) is defined as:',
    options: [
      'Deaths under 5 years per 1000 live births',
      'Deaths under 1 year per 1000 live births',
      'Deaths under 1 year per 1000 total births',
      'Deaths under 28 days per 1000 live births'
    ],
    correct: 1,
    exp: 'Infant Mortality Rate (IMR) = (Number of deaths under 1 year of age in a given year / Number of live births in the same year) × 1000. It is calculated per 1000 LIVE births (not total births). Deaths under 28 days define Neonatal Mortality Rate (NMR). Deaths under 5 years define Under-5 Mortality Rate (U5MR). IMR is a sensitive indicator of socio-economic development.',
    tags: ['IMR', 'Vital statistics', 'Definitions'],
  },

  // ── SURGERY (8 per exam) ─────────────────────────────────────────────────
  {
    id: 20, subject: 'surgery', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'Murphy\'s sign is positive in:',
    options: ['Acute appendicitis', 'Acute cholecystitis', 'Hepatitis', 'Duodenal ulcer'],
    correct: 1,
    exp: 'Murphy\'s sign is positive in Acute Cholecystitis. It is performed by placing the fingers below the right costal margin and asking the patient to take a deep breath. The inflamed gallbladder descends and contacts the examining fingers, causing pain and sudden inspiratory arrest. This is pathognomonic of acute cholecystitis.',
    tags: ['Clinical signs', 'Cholecystitis', 'Surgery'],
  },
  {
    id: 21, subject: 'surgery', year: 2024, difficulty: 'hard',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'Earliest symptom of acute intestinal obstruction is:',
    options: ['Abdominal distension', 'Vomiting', 'Colicky abdominal pain', 'Absolute constipation'],
    correct: 2,
    exp: 'Colicky abdominal pain is the earliest and most prominent symptom of acute intestinal obstruction. It occurs due to hyperperistalsis as the bowel tries to push contents past the obstruction. Vomiting occurs early in high obstruction. Absolute constipation (no flatus or stool) occurs late. Distension is more prominent in low obstruction and also occurs later.',
    tags: ['Intestinal obstruction', 'Symptoms', 'Surgery'],
  },

  // ── OBSTETRICS & GYNAECOLOGY (8 per exam) ────────────────────────────────
  {
    id: 22, subject: 'obs-gynae', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'Placenta previa is defined as:',
    options: [
      'Placenta attached to upper segment of uterus',
      'Placenta implanted in the lower uterine segment',
      'Premature separation of normally situated placenta',
      'Placenta implanted on the posterior wall of uterus'
    ],
    correct: 1,
    exp: 'Placenta Previa is defined as a placenta that is implanted partially or wholly in the lower uterine segment. It presents with painless, causeless, recurrent antepartum hemorrhage (APH). It is diagnosed by USG. Premature separation of a normally situated placenta is Abruptio Placentae (which presents with painful APH).',
    tags: ['Placenta previa', 'APH', 'Obstetrics'],
  },

  // ── ANATOMY (5 per exam) ─────────────────────────────────────────────────
  {
    id: 23, subject: 'anatomy', year: 2024, difficulty: 'medium',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'The femoral triangle is bounded by:',
    options: [
      'Inguinal ligament (above), sartorius (lateral), adductor longus (medial)',
      'Inguinal ligament (above), rectus femoris (lateral), gracilis (medial)',
      'ASIS to pubic symphysis (above), tensor fascia lata (lateral), gracilis (medial)',
      'Inguinal ligament (above), sartorius (medial), adductor longus (lateral)'
    ],
    correct: 0,
    exp: 'The Femoral Triangle (Scarpa\'s triangle) is bounded: superiorly by the Inguinal ligament, laterally by the medial border of Sartorius muscle, and medially by the medial border of Adductor longus muscle. The floor is formed by Iliopsoas (laterally) and Pectineus (medially). Contents: Femoral nerve (lateral), artery, vein (medial) — "NAVY" from medial to lateral: N=nerve, A=artery, V=vein, Y=none (lymphatics).',
    tags: ['Femoral triangle', 'Lower limb anatomy', 'Anatomy'],
  },

  // ── PHYSIOLOGY (5 per exam) ──────────────────────────────────────────────
  {
    id: 24, subject: 'physiology', year: 2025, difficulty: 'easy',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'Normal resting heart rate in adults is:',
    options: ['40–60 beats/min', '60–100 beats/min', '100–120 beats/min', '50–80 beats/min'],
    correct: 1,
    exp: 'Normal resting heart rate in adults is 60–100 beats per minute (bpm). Below 60 bpm is bradycardia (can be normal in trained athletes). Above 100 bpm is tachycardia. The heart rate is regulated by the sinoatrial (SA) node which acts as the natural pacemaker. Normal intrinsic SA node rate is 60–100 bpm.',
    tags: ['Heart rate', 'CVS physiology', 'Normal values'],
  },
  {
    id: 25, subject: 'physiology', year: 2024, difficulty: 'medium',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'Erythropoietin (EPO) is primarily produced by:',
    options: ['Bone marrow', 'Liver', 'Kidney (peritubular cells)', 'Spleen'],
    correct: 2,
    exp: 'Erythropoietin (EPO) is primarily (90%) produced by the peritubular interstitial cells of the kidney (in the renal cortex/outer medulla), in response to hypoxia. The remaining 10% is produced by the liver. EPO stimulates erythropoiesis (RBC production) in bone marrow. In renal failure, EPO production decreases, causing anaemia of chronic disease.',
    tags: ['Erythropoietin', 'Kidney', 'Haematopoiesis'],
  },

  // ── PATHOLOGY (5 per exam) ───────────────────────────────────────────────
  {
    id: 26, subject: 'pathology', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'The hallmark pathological finding in Alzheimer\'s disease is:',
    options: [
      'Lewy bodies in substantia nigra',
      'Neurofibrillary tangles and amyloid plaques (senile plaques)',
      'Demyelination of white matter',
      'Neuronal loss in basal ganglia'
    ],
    correct: 1,
    exp: 'Alzheimer\'s disease is characterized by two hallmark pathological findings: (1) Senile plaques (amyloid plaques) — extracellular deposits of amyloid-β (Aβ) peptide, and (2) Neurofibrillary tangles (NFTs) — intraneuronal accumulations of hyperphosphorylated tau protein. Lewy bodies (α-synuclein) are seen in Parkinson\'s disease. Demyelination is seen in MS. Basal ganglia changes are in Huntington\'s.',
    tags: ['Alzheimer\'s', 'Pathology', 'CNS'],
  },

  // ── FORENSIC MEDICINE (4 per exam) ──────────────────────────────────────
  {
    id: 27, subject: 'forensic', year: 2024, difficulty: 'easy',
    group: 'PYQ-2024', verified: true, ai_generated_exp: false,
    q: 'Rigor mortis (post-mortem rigidity) typically begins:',
    options: [
      'Immediately after death',
      '2–6 hours after death',
      '12–24 hours after death',
      '48 hours after death'
    ],
    correct: 1,
    exp: 'Rigor mortis begins 2–6 hours after death, starting from the muscles of the jaw (masseter) and neck, then descending (Nysten\'s law). It is complete by 12 hours, fully developed by 12–24 hours, and starts to pass off after 24–48 hours. It disappears by 48–72 hours. It is caused by ATP depletion leading to permanent actin-myosin cross-bridging. Temperature, physical exertion before death, and age affect the timeline.',
    tags: ['Rigor mortis', 'Post-mortem changes', 'Forensic'],
  },
  {
    id: 28, subject: 'forensic', year: 2025, difficulty: 'medium',
    group: 'PYQ-2025', verified: true, ai_generated_exp: false,
    q: 'The minimum age for valid consent to medical treatment in India is:',
    options: ['12 years', '16 years', '18 years', '21 years'],
    correct: 2,
    exp: 'In India, the minimum age for giving a legally valid consent to medical treatment is 18 years (as per the Indian Majority Act). Below 18 years, consent must be taken from parent/guardian. However, for emergency life-saving treatment, consent is implied. Emergency exceptions apply when the patient is unconscious or unable to give consent.',
    tags: ['Medical consent', 'Age of consent', 'Medical law'],
  },
];

export default SEED_QUESTIONS;
