import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  TextArea,
  useCanvasAction,
  useCanvasState,
  useHostTheme,
  useMemo,
} from "cursor/canvas";

type Mode = "recap" | "quiz" | "recall";
type RecallGrade = "unset" | "solid" | "miss";
type ExamId = "1" | "2";
type Topic =
  | "life"
  | "terms"
  | "docs"
  | "assess"
  | "reassess"
  | "resp"
  | "airway"
  | "circ"
  | "body"
  | "move"
  | "meds";
type Filter = "all" | Topic | "missed";

type FollowUp = {
  prompt: string;
  choices: [string, string, string];
  answer: 0 | 1 | 2;
  why: string;
};

type KeyPoint = {
  /** Coaching line — what a solid own-words explanation mentions. */
  text: string;
  /** Lowercase fragments; any hit marks the point covered. */
  terms: string[];
};

type Question = {
  id: string;
  topic: Topic;
  prompt: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  rationale: string;
  /** Per-choice explanation. Index matches `choices`. */
  why: [string, string, string, string];
  /** Quick transfer check shown after answering — same concept, new angle. */
  followUp: FollowUp;
  /** Concepts an own-words explanation should hit. */
  keyPoints: KeyPoint[];
};

type ConceptState = {
  followUpPick: number | null;
  explanation: string;
  graded: boolean;
};

const EMPTY_CONCEPT: ConceptState = {
  followUpPick: null,
  explanation: "",
  graded: false,
};

type RecallEntry = {
  text: string;
  submitted: boolean;
  grade: RecallGrade;
};

const EMPTY_RECALL: RecallEntry = {
  text: "",
  submitted: false,
  grade: "unset",
};

const RECALL_MIN_CHARS = 12;

function autoRecallGrade(text: string, question: Question): RecallGrade {
  if (question.keyPoints.length === 0) return "solid";
  const covered = question.keyPoints.filter((point) =>
    coversPoint(text, point),
  ).length;
  return covered === question.keyPoints.length ? "solid" : "miss";
}

function coversPoint(explanation: string, point: KeyPoint): boolean {
  const lower = explanation.toLowerCase();
  return point.terms.some((term) => lower.includes(term));
}

const EXAM_LABEL: Record<ExamId, string> = {
  "1": "Exam 1",
  "2": "Exam 2",
};

const TOPIC_LABEL: Record<Topic, string> = {
  life: "Lifespan",
  terms: "Terms",
  docs: "Docs / comms",
  assess: "Assessment",
  reassess: "Reassess",
  resp: "Respiratory",
  airway: "Airway / O2",
  circ: "Circulation",
  body: "Body systems",
  move: "Move / position",
  meds: "Meds",
};

const QUESTIONS: Question[] = [
  {
    id: "life-reflexes",
    topic: "life",
    prompt:
      "You touch a newborn's cheek and he turns his head toward your finger. Which reflex is this?",
    choices: ["Moro", "Palmar grasp", "Rooting", "Sucking"],
    answer: 2,
    rationale:
      "Rooting is the head turning toward a touch on the cheek to find food. The four normal newborn reflexes are Moro, palmar grasp, rooting, and sucking.",
    why: [
      "Moro is the startle response — arms fly out wide with the fingers spread.",
      "Palmar grasp is the newborn squeezing an object placed in the palm.",
      "Correct. Rooting is a feeding reflex — the head turns toward a cheek touch.",
      "Sucking is triggered by touching the lips or roof of the mouth, not the cheek.",
    ],
    followUp: {
      prompt:
        "A newborn grips your finger tightly when you place it in his palm. Which reflex is that?",
      choices: ["Moro", "Sucking", "Palmar grasp"],
      answer: 2,
      why: "Palmar grasp is the hand squeeze. Moro is the startle with arms wide; sucking triggers at the lips.",
    },
    keyPoints: [
      {
        text: "Rooting = head turns toward a touch on the cheek — a feeding reflex",
        terms: ["root", "cheek", "turn", "feed"],
      },
      {
        text: "The four normal newborn reflexes: Moro, palmar grasp, rooting, sucking",
        terms: ["moro", "palmar", "grasp", "suck", "four"],
      },
    ],
  },
  {
    id: "life-fontanelle",
    topic: "life",
    prompt:
      "A 6-month-old has had vomiting and diarrhea for two days. Which fontanelle finding would you expect?",
    choices: [
      "A bulging anterior fontanelle",
      "A completely closed anterior fontanelle",
      "A pulsating posterior fontanelle",
      "A sunken anterior fontanelle",
    ],
    answer: 3,
    rationale:
      "A sunken fontanelle means volume loss — dehydration. Bulging means pressure (meningitis or trauma). The posterior closes by about 3 months; the anterior stays open 9–18 months.",
    why: [
      "Bulging points to increased intracranial pressure, not fluid loss.",
      "The anterior fontanelle stays open until 9–18 months — closure at 6 months is not the dehydration sign.",
      "Gentle pulsation can be normal, and the posterior fontanelle is usually closed by 3 months anyway.",
      "Correct. Two days of fluid loss shows up as a sunken anterior fontanelle.",
    ],
    followUp: {
      prompt:
        "A febrile infant has a bulging, tense fontanelle. What does that point to?",
      choices: [
        "Dehydration",
        "Increased pressure inside the skull, like meningitis",
        "Normal crying",
      ],
      answer: 1,
      why: "Bulging = pressure (meningitis, trauma); sunken = dehydration. A persistently bulging fontanelle is never dismissed as crying.",
    },
    keyPoints: [
      {
        text: "Sunken fontanelle = volume loss / dehydration; bulging = intracranial pressure",
        terms: ["sunken", "dehydrat", "volume", "bulg", "pressure"],
      },
      {
        text: "Posterior closes by about 3 months; anterior stays open 9–18 months",
        terms: ["9", "18", "3 month", "three month", "anterior", "posterior"],
      },
    ],
  },
  {
    id: "life-immunity",
    topic: "life",
    prompt:
      "Passive immunity from maternal antibodies typically protects a child until approximately what age?",
    choices: ["6 months", "2 years", "4 to 6 years", "10 to 12 years"],
    answer: 2,
    rationale:
      "Maternal antibodies fade around ages 4–6, which is why kids catch more infections in their early school years while building their own immune system.",
    why: [
      "Too short — maternal protection outlasts infancy.",
      "Still too short — the protection runs into the preschool years.",
      "Correct. Coverage fades around ages 4–6, then infection rates climb.",
      "Too long — by then the child has been running on their own immune system for years.",
    ],
    followUp: {
      prompt: "Why do kids catch more infections in their early school years?",
      choices: [
        "Maternal antibodies have faded and their own immunity is still building",
        "Vaccines stop working at that age",
        "Their airways are smaller than an infant's",
      ],
      answer: 0,
      why: "Passive immunity fades around 4–6, so they build their own defenses through exposure — and get sick doing it.",
    },
    keyPoints: [
      {
        text: "Maternal (passive) antibodies fade around ages 4–6",
        terms: ["4", "6", "four", "six", "fade", "maternal", "passive"],
      },
      {
        text: "After the fade, kids get sick more while building their own immune system",
        terms: ["own immun", "build", "school", "sick", "infection"],
      },
    ],
  },
  {
    id: "life-preschool-breathe",
    topic: "life",
    prompt:
      "A 5-year-old with abdominal pain is breathing shallowly. Children this age rely primarily on which muscle to breathe?",
    choices: [
      "The diaphragm",
      "The intercostal muscles",
      "The abdominal wall muscles",
      "The accessory neck muscles",
    ],
    answer: 0,
    rationale:
      "Young children are diaphragm breathers because the intercostals and chest wall are underdeveloped. Anything that limits diaphragm motion — a full belly, lying flat, an abdominal injury — hits their ventilation harder than an adult's.",
    why: [
      "Correct. The diaphragm does most of the work, so belly problems compromise breathing fast.",
      "The intercostals and chest wall are still underdeveloped at this age.",
      "Abdominal muscles assist exhalation — they are not the primary breathing muscle.",
      "Accessory neck muscle use means respiratory distress, not normal breathing.",
    ],
    followUp: {
      prompt: "Which situation hits a young child's breathing hardest?",
      choices: [
        "A stuffy nose at age 10",
        "A scraped knee",
        "Anything limiting diaphragm movement, like a distended belly",
      ],
      answer: 2,
      why: "They are diaphragm breathers — a full belly, lying flat, or a belly injury cuts their ventilation directly.",
    },
    keyPoints: [
      {
        text: "Young kids are diaphragm breathers — chest wall and intercostals are underdeveloped",
        terms: ["diaphragm", "intercostal", "chest wall"],
      },
      {
        text: "Belly problems (distension, injury, lying flat) compromise their breathing",
        terms: ["belly", "abdom", "flat", "stomach"],
      },
    ],
  },
  {
    id: "life-vs-trend",
    topic: "life",
    prompt:
      "Compared with an adult, a healthy toddler will normally have:",
    choices: [
      "A slower pulse and a higher blood pressure",
      "A slower pulse and a lower blood pressure",
      "A faster pulse and a higher blood pressure",
      "A faster pulse and a lower blood pressure",
    ],
    answer: 3,
    rationale:
      "The younger the patient, the faster the heart rate and respirations and the lower the blood pressure. Adolescents match adult numbers: HR 60–100, RR 12–20, systolic at least 90.",
    why: [
      "Both halves are backwards — kids run faster and lower.",
      "The pulse part is wrong — young children have faster heart rates than adults.",
      "The pulse is right, but pediatric blood pressure runs lower, not higher.",
      "Correct. Younger means faster heart and breathing with a lower blood pressure.",
    ],
    followUp: {
      prompt: "At what stage do vital signs reach adult ranges?",
      choices: ["Toddlerhood", "Around age 40", "Adolescence"],
      answer: 2,
      why: "Adolescents match adult numbers: HR 60–100, RR 12–20, systolic at least 90.",
    },
    keyPoints: [
      {
        text: "Younger = faster heart rate and breathing, lower blood pressure",
        terms: ["faster", "lower", "blood pressure", "bp"],
      },
      {
        text: "Adolescents share adult vital ranges (HR 60–100, RR 12–20, SBP at least 90)",
        terms: ["adolescen", "teen", "adult", "60", "12", "90"],
      },
    ],
  },
  {
    id: "life-infant-airway",
    topic: "life",
    prompt:
      "An infant's airway obstructs more easily than an adult's because the infant has:",
    choices: [
      "A proportionally smaller tongue",
      "A proportionally larger tongue and a narrow, cone-shaped airway",
      "A wider opening at the cricoid ring",
      "The ability to breathe only through the mouth",
    ],
    answer: 1,
    rationale:
      "The infant airway is shaped like an upside-down cone and the tongue is large relative to the mouth, so a little swelling or the tongue itself can block it fast.",
    why: [
      "The infant tongue is proportionally larger, not smaller — that is part of the risk.",
      "Correct. A big tongue plus a narrow cone-shaped airway means small swelling closes it.",
      "The infant airway narrows toward the cricoid — it is not wider there.",
      "Infants actually prefer breathing through the nose, which is why nasal secretions matter so much.",
    ],
    followUp: {
      prompt:
        "Why does a little airway swelling hurt an infant far more than an adult?",
      choices: [
        "Infants have weaker coughs",
        "A narrow cone-shaped airway loses a big fraction of its opening to small swelling",
        "Their lungs have fewer lobes",
      ],
      answer: 1,
      why: "The airway is already narrow and cone-shaped — a millimeter of swelling steals a large share of it, and the big tongue adds to the risk.",
    },
    keyPoints: [
      {
        text: "Infant tongue is proportionally large — a common obstruction",
        terms: ["tongue", "large", "big"],
      },
      {
        text: "Airway is narrow and cone-shaped, so small swelling closes it fast",
        terms: ["cone", "narrow", "swell", "funnel"],
      },
    ],
  },
  {
    id: "life-aging",
    topic: "life",
    prompt:
      "Which respiratory change is expected with normal aging in a patient over 61?",
    choices: [
      "Increased lung elasticity",
      "Smaller alveoli with more surface area",
      "Decreased vital capacity",
      "A stronger cough and gag reflex",
    ],
    answer: 2,
    rationale:
      "Aging lungs lose elasticity and vital capacity, the alveoli enlarge with less surface area, and the cough and gag weaken — raising aspiration and pneumonia risk. Add atherosclerosis, slower metabolism, Type 2 diabetes, hypothyroidism, and gallstones to the older-adult picture.",
    why: [
      "Elasticity decreases with age — the lungs get stiffer, not springier.",
      "Backwards — the alveoli get bigger with less surface area for gas exchange.",
      "Correct. Vital capacity falls as elasticity and muscle strength decline.",
      "The cough and gag weaken with age, which is why aspiration pneumonia climbs.",
    ],
    followUp: {
      prompt: "Why do older adults aspirate and get pneumonia more often?",
      choices: [
        "Weaker cough and gag reflexes",
        "Larger vital capacity",
        "Faster metabolism",
      ],
      answer: 0,
      why: "The protective cough and gag weaken with age; vital capacity shrinks and metabolism slows, not the reverse.",
    },
    keyPoints: [
      {
        text: "Aging lungs: less elasticity and vital capacity, larger alveoli with less surface area",
        terms: ["elastic", "vital capacity", "alveoli", "surface"],
      },
      {
        text: "Weaker cough and gag → aspiration and pneumonia risk",
        terms: ["cough", "gag", "aspirat", "pneumonia"],
      },
    ],
  },
  {
    id: "life-reasoning",
    topic: "life",
    prompt:
      "A 15-year-old hesitates to accept care mainly because his friends are watching. Which stage of moral reasoning is he most likely using?",
    choices: [
      "Pre-conventional",
      "Conventional",
      "Post-conventional",
      "Concrete operational",
    ],
    answer: 1,
    rationale:
      "Reasoning develops from pre-conventional (avoiding punishment) to conventional (peer and social approval) to, ideally, post-conventional (internalized ethics). Teens often sit in the peer-driven middle stage.",
    why: [
      "Pre-conventional reasoning is about avoiding punishment — typical of young children.",
      "Correct. Conventional reasoning is driven by peer approval, which fits an adolescent playing to the crowd.",
      "Post-conventional reasoning runs on internalized ethics, not what friends think.",
      "Concrete operational is a cognitive development stage, not a moral reasoning stage.",
    ],
    followUp: {
      prompt: "A 6-year-old behaves only to avoid a time-out. Which stage is that?",
      choices: ["Pre-conventional", "Conventional", "Post-conventional"],
      answer: 0,
      why: "Punishment-avoidance is pre-conventional. Peer approval is conventional; internalized ethics is post-conventional.",
    },
    keyPoints: [
      {
        text: "Pre-conventional = avoid punishment; conventional = peer approval; post-conventional = internal ethics",
        terms: ["punish", "peer", "approval", "ethic", "conventional"],
      },
      {
        text: "Teens usually reason at the conventional, peer-driven stage",
        terms: ["teen", "adolescen", "peer", "friend"],
      },
    ],
  },
  {
    id: "terms-prefix",
    topic: "terms",
    prompt: "The prefix brady-, as in bradycardia, means:",
    choices: ["Slow", "Fast", "Difficult", "Without"],
    answer: 0,
    rationale:
      "Brady- = slow, tachy- = fast, dys- = difficult, hyper- = high, hypo- = low, a-/an- = without. Bradycardia is a slow heart rate; bradypnea is slow breathing.",
    why: [
      "Correct. Bradycardia is a heart rate below normal — brady- means slow.",
      "Fast is tachy-, as in tachycardia and tachypnea.",
      "Difficult is dys-, as in dyspnea (difficulty breathing).",
      "Without is a- or an-, as in analgesic (without pain).",
    ],
    followUp: {
      prompt: "Tachypnea means:",
      choices: ["Fast breathing", "Difficulty breathing", "Slow breathing"],
      answer: 0,
      why: "Tachy- = fast + pnea = breathing. Brady- is slow; dys- is difficulty.",
    },
    keyPoints: [
      {
        text: "brady- = slow, tachy- = fast",
        terms: ["slow", "fast", "tachy", "brady"],
      },
      {
        text: "dys- = difficult, hyper- = high, hypo- = low, a-/an- = without",
        terms: ["dys", "difficult", "hyper", "hypo", "without"],
      },
    ],
  },
  {
    id: "terms-phasia-phagia",
    topic: "terms",
    prompt:
      "A stroke patient is having difficulty swallowing. The correct term for your report is:",
    choices: ["Aphasia", "Dysphasia", "Dysphagia", "Dysplasia"],
    answer: 2,
    rationale:
      "Phagia (g) is eating or swallowing; phasia (s) is speech. Dysphagia = difficulty swallowing. Chart the wrong one and the hospital works the wrong problem.",
    why: [
      "Aphasia is the inability to speak — a language problem, not a swallowing problem.",
      "Dysphasia is difficulty speaking. The s means speech.",
      "Correct. Dysphagia is difficulty swallowing — the g points to eating.",
      "Dysplasia is abnormal tissue or cell growth, unrelated to swallowing.",
    ],
    followUp: {
      prompt: "A patient who cannot produce speech after a stroke has:",
      choices: ["Aphasia", "Dysphagia", "Dysplasia"],
      answer: 0,
      why: "Phasia (s) = speech, so aphasia = no speech. Phagia (g) = swallowing.",
    },
    keyPoints: [
      {
        text: "phagia (g) = eating/swallowing; phasia (s) = speech",
        terms: ["swallow", "speech", "phagia", "phasia", "eat", "g", "s"],
      },
      {
        text: "Charting the wrong one sends the hospital after the wrong problem",
        terms: ["chart", "wrong", "hospital", "mix", "confus"],
      },
    ],
  },
  {
    id: "terms-roots",
    topic: "terms",
    prompt: "The word root hepat-, as in hepatitis, refers to the:",
    choices: ["Heart", "Kidney", "Lung", "Liver"],
    answer: 3,
    rationale:
      "Hepat- is the liver, so hepatitis is liver inflammation (-itis). Cardi- is heart, nephr- is kidney, pulmon- is lung, neuro- is nerves, thorac- is chest.",
    why: [
      "The heart root is cardi-, as in cardiology.",
      "The kidney root is nephr-, as in nephron.",
      "The lung root is pulmon-, as in pulmonary.",
      "Correct. Hepat- means liver — hepatitis is inflammation of the liver.",
    ],
    followUp: {
      prompt: "Nephritis is inflammation of the:",
      choices: ["Kidney", "Liver", "Nerves"],
      answer: 0,
      why: "Nephr- = kidney, -itis = inflammation. Hepat- is liver; neuro- is nerves.",
    },
    keyPoints: [
      {
        text: "hepat- = liver, nephr- = kidney, cardi- = heart, pulmon- = lung",
        terms: ["liver", "kidney", "hepat", "nephr"],
      },
      {
        text: "-itis = inflammation (hepatitis = liver inflammation)",
        terms: ["itis", "inflam"],
      },
    ],
  },
  {
    id: "terms-direction",
    topic: "terms",
    prompt:
      "When you document an injury to the \"left arm,\" the term left refers to:",
    choices: [
      "Your perspective as you face the patient",
      "The patient's own perspective in the anatomic position",
      "The position the patient was found in",
      "The perspective of whoever reads the chart",
    ],
    answer: 1,
    rationale:
      "Directional terms always come from the patient's perspective in the anatomic position — standing, palms forward. Their left, not yours. Proximal is toward the core; distal is away.",
    why: [
      "Facing the patient flips left and right — documenting from your view labels the wrong arm.",
      "Correct. Anatomy is always described from the patient's own left and right.",
      "The position found in changes call to call — anatomic position is the fixed reference.",
      "The reader adapts to the standard, not the other way around.",
    ],
    followUp: {
      prompt: "A wound near the wrist is ___ to the elbow.",
      choices: ["Proximal", "Distal", "Medial"],
      answer: 1,
      why: "Distal = farther from the core; the wrist is farther out than the elbow. Proximal is toward the core.",
    },
    keyPoints: [
      {
        text: "Left and right always from the patient's perspective in anatomic position",
        terms: ["patient", "anatomic", "their left", "perspective"],
      },
      {
        text: "Proximal = toward the core; distal = away from it",
        terms: ["proximal", "distal", "core", "toward", "away"],
      },
    ],
  },
  {
    id: "terms-positions",
    topic: "terms",
    prompt:
      "A CHF patient with severe difficulty breathing should be transported in which position?",
    choices: [
      "Supine",
      "Trendelenburg",
      "High Fowler",
      "Left lateral recumbent",
    ],
    answer: 2,
    rationale:
      "Sit respiratory distress upright if the patient tolerates it — High Fowler. Supine is for shock. Prone is never a transport position for a compromised patient.",
    why: [
      "Lying flat lets fluid spread through the lungs and makes the work of breathing worse.",
      "Head-down positioning is outdated for shock and would drown a wet-lung patient.",
      "Correct. Sitting fully upright eases the work of breathing in CHF.",
      "Left lateral is for late pregnancy or draining an airway, not a working CHF patient.",
    ],
    followUp: {
      prompt:
        "A patient with signs of shock (not pregnant) rides in which position?",
      choices: ["High Fowler", "Prone", "Flat supine"],
      answer: 2,
      why: "Shock = flat supine. Breathing trouble sits up. Prone is never a transport position.",
    },
    keyPoints: [
      {
        text: "Respiratory distress sits upright (High Fowler) if tolerated",
        terms: ["fowler", "sit", "upright"],
      },
      {
        text: "Shock = supine; never transport a compromised patient prone",
        terms: ["supine", "shock", "prone", "flat"],
      },
    ],
  },
  {
    id: "terms-palmar",
    topic: "terms",
    prompt:
      "Using the Palmar method, a burn the size of the patient's palm equals approximately what percent of total body surface area?",
    choices: ["1%", "5%", "9%", "18%"],
    answer: 0,
    rationale:
      "The patient's own palm represents about 1% of their total body surface area. Burn depth — superficial, partial, or full thickness — is documented separately.",
    why: [
      "Correct. One patient palm is roughly 1% of body surface area.",
      "Too large — five palms would be needed to cover 5%.",
      "9% is a Rule of Nines region, like one full arm — far more than a palm.",
      "18% is an entire leg or the front of the torso on the Rule of Nines.",
    ],
    followUp: {
      prompt: "Whose palm do you use to estimate the burn area?",
      choices: ["Yours", "Either — palms are the same", "The patient's"],
      answer: 2,
      why: "The patient's own palm is about 1% of their body surface. Your hand may be a different size entirely.",
    },
    keyPoints: [
      {
        text: "The patient's palm ≈ 1% of their total body surface area",
        terms: ["1", "one percent", "patient"],
      },
      {
        text: "Burn depth (superficial / partial / full) is charted separately from area",
        terms: ["depth", "superficial", "partial", "full", "separate"],
      },
    ],
  },
  {
    id: "docs-refusal",
    topic: "docs",
    prompt:
      "A competent adult refuses transport and also refuses to sign your refusal form. You should:",
    choices: [
      "Transport him anyway under implied consent",
      "Remain on scene until he agrees to sign",
      "Document the refusal thoroughly and have a third-party witness sign",
      "Leave without documentation since he declined care",
    ],
    answer: 2,
    rationale:
      "There is no legal requirement that the patient sign. Document that he was informed of the risks and refused, and get a witness — law enforcement, family, or a bystander — to sign that they saw it. Refusals are lawsuit magnets.",
    why: [
      "Implied consent applies when a patient cannot consent — a competent adult refusing is the opposite.",
      "You cannot hold a scene hostage to a signature — his refusal stands with or without it.",
      "Correct. Thorough documentation plus a witness signature protects the patient and you.",
      "An undocumented refusal is the most dangerous chart you never wrote.",
    ],
    followUp: {
      prompt:
        "Who can sign the refusal for a 16-year-old who declines transport?",
      choices: [
        "The teen himself",
        "A parent or legal guardian",
        "Any adult bystander",
      ],
      answer: 1,
      why: "Minors need the legally responsible person. Witnesses can co-sign, but the refusal decision belongs to the guardian.",
    },
    keyPoints: [
      {
        text: "No legal requirement the patient signs — document the informed refusal thoroughly",
        terms: ["document", "no legal", "not required", "chart", "informed"],
      },
      {
        text: "Get a third-party witness (law, family, bystander) to sign",
        terms: ["witness", "third", "law", "family", "bystander"],
      },
    ],
  },
  {
    id: "docs-paper-fix",
    topic: "docs",
    prompt:
      "You wrote the wrong medication dose on a paper PCR. The correct way to fix it is to:",
    choices: [
      "Draw a single line through the error and initial it",
      "Cover the error with correction fluid and rewrite it",
      "Rewrite the entire page and discard the original",
      "Black out the error so it cannot be read",
    ],
    answer: 0,
    rationale:
      "One line through the error plus your initials keeps the original legible, so the correction never looks like a cover-up. The PCR is a permanent legal record. After submission, corrections go in as an addendum.",
    why: [
      "Correct. The original stays readable and the correction is owned with your initials.",
      "Correction fluid hides the original entry — the opposite of a legal correction.",
      "Destroying the original page destroys a permanent medical record.",
      "Obliterating the entry looks like a cover-up in court, even if the fix was innocent.",
    ],
    followUp: {
      prompt: "You notice the error only AFTER submitting the PCR. You:",
      choices: [
        "Quietly rewrite the record",
        "Leave it — submitted records are final",
        "File an addendum",
      ],
      answer: 2,
      why: "Post-submission corrections go in as an addendum — the original stays, the correction is added and owned.",
    },
    keyPoints: [
      {
        text: "Single line through the error plus initials — the original stays legible",
        terms: ["single line", "one line", "initial", "legible", "readable"],
      },
      {
        text: "After submission, corrections become an addendum",
        terms: ["addendum", "submit", "after"],
      },
    ],
  },
  {
    id: "docs-handoff-name",
    topic: "docs",
    prompt:
      "To protect yourself against an abandonment claim, your PCR must document:",
    choices: [
      "The hospital's street address",
      "The time you left the emergency department",
      "The patient's room assignment",
      "The name of the nurse or physician who assumed care",
    ],
    answer: 3,
    rationale:
      "Transfer of care goes to a person, not a place. Naming who assumed care — for example, RN Smith — is what proves the patient was never abandoned.",
    why: [
      "An address proves where you went, not that anyone accepted the patient.",
      "A departure time without a named receiver still leaves the handoff unproven.",
      "A room number is a location — abandonment is about who took responsibility.",
      "Correct. A named clinician accepting care is the proof of a complete handoff.",
    ],
    followUp: {
      prompt: "Abandonment means:",
      choices: [
        "Ending care without transferring to equal or higher training",
        "Leaving the hospital before the PCR is done",
        "Refusing a dispatch",
      ],
      answer: 0,
      why: "Abandonment is terminating care without a proper handoff to someone with equal or greater training.",
    },
    keyPoints: [
      {
        text: "Transfer of care goes to a person — name who assumed care (RN Smith)",
        terms: ["name", "rn", "nurse", "person", "who"],
      },
      {
        text: "That named handoff is the defense against an abandonment claim",
        terms: ["abandon", "handoff", "transfer", "proof", "defense"],
      },
    ],
  },
  {
    id: "docs-narrative",
    topic: "docs",
    prompt:
      "In a SOAP narrative, the patient's statement \"my chest hurts\" belongs under:",
    choices: ["Subjective", "Objective", "Assessment", "Plan"],
    answer: 0,
    rationale:
      "Subjective is what the patient tells you; objective is what you can see or measure, like vitals. CHART is the other format: Chief complaint, History, Assessment, Rx, Transport.",
    why: [
      "Correct. Anything the patient reports in their own words is subjective.",
      "Objective is what you can verify — vitals, exam findings, what you saw.",
      "Assessment is your field impression after gathering the clues.",
      "Plan is your treatment and transport decision, not the complaint itself.",
    ],
    followUp: {
      prompt: "In SOAP, your blood pressure reading goes under:",
      choices: ["Subjective", "Objective", "Plan"],
      answer: 1,
      why: "Vitals are measurable and verifiable — objective. The patient's words are subjective.",
    },
    keyPoints: [
      {
        text: "Subjective = what the patient says; Objective = what you can measure or verify",
        terms: ["subjective", "objective", "says", "measur", "verif"],
      },
      {
        text: "CHART = Chief complaint, History, Assessment, Rx, Transport",
        terms: ["chart", "chief", "rx", "transport", "history"],
      },
    ],
  },
  {
    id: "docs-radios",
    topic: "docs",
    prompt:
      "Which radio mode allows you to talk and listen at the same time, like a phone call?",
    choices: ["Simplex", "Duplex", "Multiplex", "A repeater"],
    answer: 1,
    rationale:
      "Duplex works both directions at once. Simplex is push-to-talk, one direction at a time. Multiplex carries multiple signals on one channel. Base = fixed, mobile = in the truck, portable = handheld. The FCC regulates the frequencies.",
    why: [
      "Simplex is one direction at a time — you push to talk and release to listen.",
      "Correct. Duplex transmits and receives simultaneously, like a telephone.",
      "Multiplex sends multiple signals — like voice plus data — over one channel.",
      "A repeater extends range by rebroadcasting; it is hardware, not a talk mode.",
    ],
    followUp: {
      prompt: "The handheld radio you carry to the patient's side is the:",
      choices: ["Base station", "Mobile radio", "Portable radio"],
      answer: 2,
      why: "Portable = handheld, mobile = mounted in the truck, base = fixed at the station or hospital.",
    },
    keyPoints: [
      {
        text: "Simplex = one at a time (push-to-talk); duplex = both directions at once; multiplex = multiple signals",
        terms: ["simplex", "duplex", "multiplex", "push", "both", "same time"],
      },
      {
        text: "Base = fixed, mobile = vehicle-mounted, portable = handheld; the FCC owns the frequencies",
        terms: ["base", "mobile", "portable", "handheld", "fcc"],
      },
    ],
  },
  {
    id: "docs-facility",
    topic: "docs",
    prompt:
      "You are doing CPR on a patient who is 5 minutes from a community ER and 25 minutes from a trauma center. Where should you transport?",
    choices: [
      "The regional trauma center",
      "The hospital where his cardiologist practices",
      "The hospital the family prefers",
      "The closest emergency department",
    ],
    answer: 3,
    rationale:
      "Destination is the closest most appropriate facility. An active arrest needs the absolute closest ER; stroke, trauma, and pediatric patients may justify bypassing a closer hospital. Notify the receiving ER on every transport.",
    why: [
      "Trauma-center bypass is for trauma — an arrest cannot afford 20 extra minutes.",
      "Continuity with his cardiologist means nothing if he does not survive the ride.",
      "Family preference never overrides an active resuscitation.",
      "Correct. For cardiac arrest, closest is the most appropriate facility.",
    ],
    followUp: {
      prompt:
        "A stable stroke-alert patient: the closest small ER, or a stroke center 10 minutes farther?",
      choices: [
        "The stroke center — capability beats proximity when the patient can make it",
        "The closest ER, always",
        "Whichever the family picks",
      ],
      answer: 0,
      why: "Stroke, trauma, and peds can bypass a closer ER for the right capability. Arrests get the absolute closest.",
    },
    keyPoints: [
      {
        text: "Destination = the closest MOST APPROPRIATE facility",
        terms: ["appropriate", "closest most", "facility"],
      },
      {
        text: "Arrest → absolute closest; stroke/trauma/peds may bypass a closer ER",
        terms: ["arrest", "bypass", "stroke", "trauma", "closest"],
      },
    ],
  },
  {
    id: "docs-sbar",
    topic: "docs",
    prompt: "In an SBAR handoff report, the B stands for:",
    choices: ["Baseline", "Background", "Breathing", "Blood pressure"],
    answer: 1,
    rationale:
      "SBAR is Situation, Background, Assessment, Treatment — the structure of your verbal handoff before the written ePCR follows.",
    why: [
      "Baseline vitals come up inside the report, but B is not baseline.",
      "Correct. B is Background — history and events leading up to the call.",
      "Breathing belongs in your assessment findings, not the B slot.",
      "Blood pressure is one vital sign inside the assessment, not the B.",
    ],
    followUp: {
      prompt: "The S in SBAR stands for:",
      choices: ["Signs", "SAMPLE", "Situation"],
      answer: 2,
      why: "SBAR: Situation, Background, Assessment, Treatment — the order of your verbal handoff.",
    },
    keyPoints: [
      {
        text: "SBAR = Situation, Background, Assessment, Treatment",
        terms: ["situation", "background", "assessment", "treatment"],
      },
      {
        text: "Verbal handoff first, then the written ePCR follows",
        terms: ["verbal", "handoff", "epcr", "written"],
      },
    ],
  },
  {
    id: "docs-noise",
    topic: "docs",
    prompt:
      "In the Shannon-Weaver communication model, \"noise\" is best defined as:",
    choices: [
      "Loud sounds on scene, such as sirens",
      "Static or interference on the radio channel",
      "Anything that blocks or distorts the message, including hearing loss and cultural barriers",
      "Errors written into the PCR",
    ],
    answer: 2,
    rationale:
      "Noise is anything that interferes with the message — physical sound, hearing or vision impairment, age gaps, ethnocentrism (my culture first), or cultural imposition (forcing your values on the patient).",
    why: [
      "Sirens are only one physical example — the concept is much broader.",
      "Radio static is also just one physical example of interference.",
      "Correct. Noise covers every barrier between sender and receiver, cultural ones included.",
      "Chart errors are documentation problems, not interference in a live exchange.",
    ],
    followUp: {
      prompt:
        "Judging a patient's choices by your own culture's standards is called:",
      choices: ["Ethnocentrism", "Cultural imposition", "Defamation"],
      answer: 0,
      why: "Ethnocentrism = my culture first. Imposition goes further — forcing your values onto the patient.",
    },
    keyPoints: [
      {
        text: "Noise = anything blocking the message: sound, hearing or vision loss, age, culture",
        terms: ["noise", "block", "interfer", "barrier", "hearing", "culture"],
      },
      {
        text: "Ethnocentrism (my culture first) and cultural imposition (forcing values) count as noise",
        terms: ["ethno", "imposition", "culture", "values"],
      },
    ],
  },
  {
    id: "assess-dcap",
    topic: "assess",
    prompt: "In the trauma exam mnemonic DCAP-BTLS, the P stands for:",
    choices: ["Pain", "Paralysis", "Pulses", "Punctures and penetrations"],
    answer: 3,
    rationale:
      "DCAP-BTLS: Deformities, Contusions, Abrasions, Punctures/penetrations, Burns, Tenderness, Lacerations, Swelling — what you look and feel for on each body region.",
    why: [
      "Pain the patient reports is captured under T for tenderness when you palpate.",
      "Paralysis is a neuro finding assessed separately — it is not in this mnemonic.",
      "Pulses are part of the circulation check, not the DCAP-BTLS letters.",
      "Correct. P is punctures and penetrations — holes in the skin from penetrating trauma.",
    ],
    followUp: {
      prompt: "The T in DCAP-BTLS stands for:",
      choices: ["Trauma", "Tenderness", "Temperature"],
      answer: 1,
      why: "B-T-L-S: burns, tenderness, lacerations, swelling. Tenderness is pain when you palpate.",
    },
    keyPoints: [
      {
        text: "DCAP = deformities, contusions, abrasions, punctures/penetrations",
        terms: ["deform", "contus", "abras", "punctur"],
      },
      {
        text: "BTLS = burns, tenderness, lacerations, swelling — look and feel each region",
        terms: ["burn", "tender", "lacerat", "swell"],
      },
    ],
  },
  {
    id: "assess-perrl",
    topic: "assess",
    prompt:
      "An unresponsive patient has pinpoint pupils and respirations of 6 per minute. This presentation is most consistent with:",
    choices: [
      "Stimulant overdose",
      "Opioid overdose",
      "Brain herniation",
      "Hypoglycemia",
    ],
    answer: 1,
    rationale:
      "Pinpoint pupils plus depressed breathing is the classic opioid picture. PERRL is the normal finding — pupils equal, round, reactive to light. Stimulants dilate; brain injury tends to blow or unequalize a pupil.",
    why: [
      "Stimulants dilate the pupils and usually speed everything up, not slow it down.",
      "Correct. Opioids constrict the pupils and depress the respiratory drive.",
      "Herniation classically produces an unequal or blown pupil, not bilateral pinpoints.",
      "Low sugar alters mental status but does not classically pinpoint the pupils.",
    ],
    followUp: {
      prompt: "Dilated pupils in an agitated, sweaty patient suggest:",
      choices: ["Opioids", "Normal findings only", "Stimulants"],
      answer: 2,
      why: "Stimulants dilate; opioids pinpoint. Unequal or blown pupils point at brain injury.",
    },
    keyPoints: [
      {
        text: "Pinpoint pupils + slow breathing = the opioid picture",
        terms: ["pinpoint", "opioid", "constrict", "slow"],
      },
      {
        text: "PERRL = equal, round, reactive to light; stimulants dilate, herniation blows one pupil",
        terms: ["perrl", "equal", "react", "dilat", "blown"],
      },
    ],
  },
  {
    id: "assess-preg",
    topic: "assess",
    prompt:
      "Which question is MOST important to ask a 24-year-old female with lower abdominal pain?",
    choices: [
      "\"Is there any chance you could be pregnant?\"",
      "\"What have you eaten today?\"",
      "\"Is there any family history of heart disease?\"",
      "\"Have you had surgery in the past?\"",
    ],
    answer: 0,
    rationale:
      "Any female of childbearing age with lower abdominal pain gets the pregnancy question and last menstrual period — ectopic pregnancy is the hidden life threat. Document the answer either way.",
    why: [
      "Correct. Pregnancy status rules an ectopic in or out — the killer diagnosis in this presentation.",
      "Diet matters for some GI complaints but does not screen for the life threat.",
      "Cardiac family history is not the priority in young-female abdominal pain.",
      "Surgical history is useful background, not the critical screen here.",
    ],
    followUp: {
      prompt: "She says she might be pregnant. What do you ask next?",
      choices: [
        "The date of her last menstrual period",
        "Her diet this week",
        "Her blood type",
      ],
      answer: 0,
      why: "LMP plus the pregnancy chance — chart both. Ectopic pregnancy is the hidden killer you are screening for.",
    },
    keyPoints: [
      {
        text: "Childbearing age + lower abdominal pain → ask pregnancy chance and LMP",
        terms: ["pregnan", "lmp", "period", "menstrual"],
      },
      {
        text: "Ectopic pregnancy is the life threat behind the question",
        terms: ["ectopic", "life threat", "rupture"],
      },
    ],
  },
  {
    id: "assess-consent",
    topic: "assess",
    prompt: "Which of the following patients can legally refuse transport?",
    choices: [
      "A confused diabetic with a glucose of 40",
      "An intoxicated driver after a rollover",
      "A 15-year-old with no parent on scene",
      "An alert adult, oriented ×4, who understands the risks",
    ],
    answer: 3,
    rationale:
      "Refusal requires decision-making capacity: alert, oriented to person, place, time, and event, behaving reasonably, and able to understand the risks. Confusion, intoxication, or being a minor defeats capacity — care proceeds under implied consent or a guardian.",
    why: [
      "A glucose of 40 with confusion is an altered patient — treat under implied consent.",
      "Intoxication after a significant mechanism removes the capacity to refuse.",
      "A minor needs a parent or legal guardian to refuse on their behalf.",
      "Correct. Full orientation plus understanding of the risks equals capacity to refuse.",
    ],
    followUp: {
      prompt: "The unresponsive diabetic gets treated under which consent?",
      choices: ["Expressed", "Implied", "Informed refusal"],
      answer: 1,
      why: "No capacity plus an emergency = implied consent. Expressed consent needs an alert patient who agrees.",
    },
    keyPoints: [
      {
        text: "Capacity = alert and oriented ×4 + reasonable behavior + understands the risks",
        terms: ["oriented", "a&o", "x4", "capacity", "understand"],
      },
      {
        text: "Confused, intoxicated, or a minor → implied consent or a guardian decides",
        terms: ["implied", "guardian", "minor", "intoxicat", "confus"],
      },
    ],
  },
  {
    id: "assess-bleed-algo",
    topic: "assess",
    prompt:
      "Direct pressure has failed to control bright, spurting bleeding from a mid-thigh wound. You should next:",
    choices: [
      "Apply a tourniquet proximal to the wound",
      "Apply a tourniquet distal to the wound",
      "Add more gauze and elevate the leg",
      "Maintain pressure and wait for ALS",
    ],
    answer: 0,
    rationale:
      "When direct pressure fails on an extremity, place a tourniquet proximal — between the wound and the heart. Tourniquets do not work on the neck, shoulder, hip, or torso. Bright and spurting means arterial.",
    why: [
      "Correct. Proximal placement cuts off the arterial inflow feeding the wound.",
      "Distal to the wound leaves the inflow wide open — the bleeding continues.",
      "Piling gauze on a failed arterial bleed wastes the minutes that matter most.",
      "Massive hemorrhage is your job the moment you see it — never wait.",
    ],
    followUp: {
      prompt: "Where is a tourniquet useless?",
      choices: ["The neck or torso", "Mid-thigh", "The upper arm"],
      answer: 0,
      why: "No tourniquet on the neck, torso, or shoulder/hip junctions — those get packing and direct pressure.",
    },
    keyPoints: [
      {
        text: "Direct pressure first; if it fails on a limb → tourniquet proximal to the wound",
        terms: ["pressure first", "direct pressure", "proximal", "tourniquet"],
      },
      {
        text: "Bright spurting = arterial; no tourniquet on neck, torso, or junctions",
        terms: ["arterial", "spurt", "neck", "torso", "bright"],
      },
    ],
  },
  {
    id: "assess-breathe-cutoffs",
    topic: "assess",
    prompt:
      "Which adult respiratory rate requires you to begin assisting ventilations?",
    choices: [
      "6 per minute",
      "10 per minute",
      "20 per minute",
      "24 per minute",
    ],
    answer: 0,
    rationale:
      "A rate under 8 — or respiratory failure or arrest — means you ventilate. The worry thresholds are over 28 or under 8; fast breathing needs a workup, and chaotic irregular patterns suggest a head injury.",
    why: [
      "Correct. Under 8 per minute cannot move enough air — assist with a BVM.",
      "10 is slightly slow and worth watching, but the ventilate trigger is under 8.",
      "20 sits at the top of the normal adult range of 12–20.",
      "24 is mildly fast — investigate the cause, but a bag is not the fix.",
    ],
    followUp: {
      prompt: "The adult worry thresholds for respiratory rate are:",
      choices: [
        "Over 20 or under 12",
        "Over 28 or under 8",
        "Over 40 or under 4",
      ],
      answer: 1,
      why: "Worry over 28 or under 8. Under 8 (or failure/arrest) means ventilate; fast gets a workup.",
    },
    keyPoints: [
      {
        text: "Under 8/min — or failure or arrest — means assist ventilations",
        terms: ["8", "eight", "ventilat", "bag"],
      },
      {
        text: "Worry over 28; fast breathing gets a workup, not automatically a bag",
        terms: ["28", "fast", "workup", "worry"],
      },
    ],
  },
  {
    id: "assess-pulse-sites",
    topic: "assess",
    prompt: "Where should you check the pulse on an unresponsive 6-month-old?",
    choices: [
      "The carotid artery",
      "The radial artery",
      "The brachial artery",
      "The femoral artery",
    ],
    answer: 2,
    rationale:
      "Infants under 1 get a brachial pulse — pressing on an infant's neck can collapse the airway. Awake adults and children get radial; unresponsive adults and children get carotid.",
    why: [
      "Poking an infant's soft neck risks collapsing the airway you are trying to protect.",
      "Radial is the site for awake adults and older children, and it is hard to feel on an infant.",
      "Correct. The inside of the upper arm is the standard infant pulse point.",
      "Femoral is a backup in shock or trauma, not the routine infant site.",
    ],
    followUp: {
      prompt: "Why not check the carotid on an infant?",
      choices: [
        "It is too weak to feel",
        "Infants have no carotid pulse",
        "Pressing the soft neck can collapse the airway",
      ],
      answer: 2,
      why: "The infant neck is short and soft — poking it risks the airway you are protecting. Use the brachial.",
    },
    keyPoints: [
      {
        text: "Infant under 1 year → brachial pulse, inside the upper arm",
        terms: ["brachial", "arm", "infant"],
      },
      {
        text: "Awake → radial; unresponsive adult or child → carotid",
        terms: ["radial", "carotid", "awake", "unresponsive"],
      },
    ],
  },
  {
    id: "assess-sign-symptom",
    topic: "assess",
    prompt: "Which of the following is a sign rather than a symptom?",
    choices: [
      "Nausea",
      "Dizziness",
      "Pain rated 8 out of 10",
      "Cyanosis around the lips",
    ],
    answer: 3,
    rationale:
      "Signs are what you can see or measure and another provider could verify — cyanosis, vitals, bleeding. Symptoms are what the patient reports, even when they attach a number to it.",
    why: [
      "Nausea is a feeling the patient reports — you cannot observe it directly.",
      "Dizziness is also reported, not measured.",
      "A pain score is still the patient's report — the number does not make it objective.",
      "Correct. Blue lips are visible to anyone who looks — an objective finding.",
    ],
    followUp: {
      prompt: "Which of these is a symptom?",
      choices: [
        "A blood pressure of 88/60",
        "A headache the patient reports",
        "A deformed forearm",
      ],
      answer: 1,
      why: "Symptoms are reported; signs are observed or measured — vitals, deformity, cyanosis.",
    },
    keyPoints: [
      {
        text: "Sign = observable or measurable by anyone (cyanosis, vitals, bleeding)",
        terms: ["sign", "observ", "measur", "see"],
      },
      {
        text: "Symptom = what the patient reports, even with a number attached",
        terms: ["symptom", "report", "feel", "says"],
      },
    ],
  },
  {
    id: "reassess-splint",
    topic: "reassess",
    prompt:
      "Ten minutes after you splint a forearm, the patient reports new tingling in her fingers. You should:",
    choices: [
      "Reassure her that tingling is expected after splinting",
      "Elevate the arm and add more padding without checking",
      "Reassess distal pulse, motor, and sensation — the splint may now be too tight",
      "Remove the splint and leave the arm unsplinted for transport",
    ],
    answer: 2,
    rationale:
      "Swelling can turn a good splint into a tourniquet. New numbness, tingling, or severe compression pain triggers a distal CSM recheck. If you did an intervention, you recheck it.",
    why: [
      "New tingling is never dismissed — it is the early warning of compromised circulation.",
      "Adding padding blindly can tighten the compartment you are worried about.",
      "Correct. Recheck circulation, sensation, and movement distal to the splint and loosen if compromised.",
      "The fracture still needs support — the fix is adjusting the splint, not abandoning it.",
    ],
    followUp: {
      prompt: "What does CSM stand for in the splint recheck?",
      choices: [
        "Circulation, sensation, movement",
        "Color, size, moisture",
        "Capillary, systolic, mean",
      ],
      answer: 0,
      why: "Distal circulation, sensation, and movement — pulse, feeling, wiggle — beyond every splint, every pass.",
    },
    keyPoints: [
      {
        text: "Swelling can turn a splint into a tourniquet — new tingling or numbness means recheck now",
        terms: ["swell", "tight", "tingl", "numb", "tourniquet"],
      },
      {
        text: "If you did an intervention, you recheck it — CSM distal to the splint",
        terms: ["csm", "recheck", "circulation", "sensation", "movement", "pulse"],
      },
    ],
  },
  {
    id: "resp-peds-rate",
    topic: "resp",
    prompt:
      "Which respiratory rate is within normal limits for a 1-month-old infant?",
    choices: [
      "12 breaths per minute",
      "20 breaths per minute",
      "44 breaths per minute",
      "70 breaths per minute",
    ],
    answer: 2,
    rationale:
      "Infants breathe 30–60 per minute, children 12–40, adults 12–20. The younger the patient, the faster the normal rate.",
    why: [
      "12 is an adult rate — dangerously slow for an infant.",
      "20 is still below the infant floor of 30 per minute.",
      "Correct. 44 sits comfortably inside the infant range of 30–60.",
      "70 exceeds even the infant ceiling — that is respiratory distress.",
    ],
    followUp: {
      prompt: "The normal adult respiratory range is:",
      choices: ["8–10", "12–20", "20–30"],
      answer: 1,
      why: "Adults 12–20, children 12–40, infants 30–60 — younger always runs faster.",
    },
    keyPoints: [
      {
        text: "Infants 30–60, children 12–40, adults 12–20 breaths per minute",
        terms: ["30", "60", "12", "20", "40"],
      },
      {
        text: "The younger the patient, the faster the normal rate",
        terms: ["younger", "faster"],
      },
    ],
  },
  {
    id: "resp-lobes-dead",
    topic: "resp",
    prompt: "The left lung has how many lobes, and why?",
    choices: [
      "Two, to leave room for the heart",
      "Two, to leave room for the liver",
      "Three, matching the right lung",
      "Three, to leave room for the aorta",
    ],
    answer: 0,
    rationale:
      "The right lung has three lobes; the left has two because the heart occupies that side of the chest. Tidal volume is one breath, residual volume keeps the alveoli open after exhale, and dead space is air that never exchanges gas.",
    why: [
      "Correct. The heart sits left of midline, so the left lung gives up a lobe.",
      "The liver sits under the right diaphragm — it does not shape the left lung.",
      "The lungs are not symmetric — the right has three lobes, the left two.",
      "The lobe count is right, but the aorta is not the reason for the difference.",
    ],
    followUp: {
      prompt: "Air sitting in the trachea that never reaches the alveoli is:",
      choices: ["Tidal volume", "Residual volume", "Dead space"],
      answer: 2,
      why: "Dead space air exchanges nothing. Tidal = one breath; residual keeps the alveoli open after a full exhale.",
    },
    keyPoints: [
      {
        text: "Right lung has 3 lobes; the left has 2 to make room for the heart",
        terms: ["two", "2", "three", "3", "heart", "lobe"],
      },
      {
        text: "Tidal = one breath; residual keeps alveoli open; dead space exchanges nothing",
        terms: ["tidal", "residual", "dead space", "exchange"],
      },
    ],
  },
  {
    id: "resp-o2-vs-ppv",
    topic: "resp",
    prompt:
      "A patient is breathing 28 times per minute with very shallow chest rise and is becoming sleepy. The most appropriate intervention is:",
    choices: [
      "A nasal cannula at 4 L/min",
      "A non-rebreather at 15 L/min",
      "CPAP",
      "Bag-valve-mask ventilations",
    ],
    answer: 3,
    rationale:
      "Fast and shallow means inadequate tidal volume — the air never reaches the alveoli. Supplemental oxygen cannot fix air that is not arriving; positive pressure from a BVM can.",
    why: [
      "A cannula only enriches breaths that are already reaching the alveoli — these are not.",
      "A non-rebreather still depends on the patient moving adequate volume on their own.",
      "CPAP requires an alert patient who is ventilating adequately and following commands.",
      "Correct. Inadequate tidal volume with declining mental status gets positive-pressure ventilation.",
    ],
    followUp: {
      prompt: "Why won't a non-rebreather fix fast-and-shallow breathing?",
      choices: [
        "The mask leaks at high rates",
        "NRBs are only for trauma",
        "Oxygen only helps if the air actually reaches the alveoli",
      ],
      answer: 2,
      why: "Shallow breaths never make it past the dead space — enriching them changes nothing. Positive pressure pushes air in.",
    },
    keyPoints: [
      {
        text: "Fast plus shallow = inadequate tidal volume — air never reaches the alveoli",
        terms: ["shallow", "tidal", "alveoli", "volume"],
      },
      {
        text: "Inadequate ventilation → BVM (positive pressure); supplemental O₂ requires adequate breathing",
        terms: ["bvm", "bag", "positive pressure", "ventilat"],
      },
    ],
  },
  {
    id: "circ-thinners",
    topic: "circ",
    prompt:
      "A patient on warfarin falls and strikes his head. Why is this fall more dangerous for him than for most patients?",
    choices: [
      "Warfarin raises his blood pressure",
      "His blood cannot clot effectively, so bleeding continues",
      "Warfarin masks the pain of the injury",
      "Warfarin lowers his blood sugar",
    ],
    answer: 1,
    rationale:
      "Anticoagulants block clots from forming or growing, so trauma and internal bleeding — especially in the head — are worse and harder to stop, even when the injury looks minor.",
    why: [
      "Warfarin acts on clotting factors, not blood pressure.",
      "Correct. Without effective clotting, a minor head strike can become a major brain bleed.",
      "Anticoagulants have no pain-masking effect.",
      "Blood sugar is insulin and glucagon territory — not anticoagulants.",
    ],
    followUp: {
      prompt: "Your blood-thinner question matters most for which complaint?",
      choices: [
        "Any head strike or possible internal bleed",
        "A sprained ankle with no swelling",
        "Sunburn",
      ],
      answer: 0,
      why: "Anticoagulated head strikes and belly trauma bleed longer and hide worse — the transport bias goes up.",
    },
    keyPoints: [
      {
        text: "Anticoagulants block clot formation — bleeding keeps going, even from minor trauma",
        terms: ["clot", "anticoag", "thin", "bleed"],
      },
      {
        text: "A head strike on warfarin can become a brain bleed — ask about thinners every time",
        terms: ["head", "brain", "warfarin", "ask"],
      },
    ],
  },
  {
    id: "circ-shock-types",
    topic: "circ",
    prompt: "Septic shock is primarily caused by which mechanism?",
    choices: [
      "Failure of the heart as a pump",
      "Loss of blood volume",
      "Widespread dilation of the blood vessels",
      "Obstruction of the airway",
    ],
    answer: 2,
    rationale:
      "Sepsis, anaphylaxis, and neurogenic shock are pipe problems — massive vasodilation. Pump failures are MI, CHF, tension pneumothorax, and tamponade. Fluid losses are hemorrhage, GI bleed, and severe dehydration.",
    why: [
      "Pump failure is cardiogenic or obstructive shock — MI, CHF, tamponade, tension pneumothorax.",
      "Volume loss is hypovolemic shock — bleeding or severe dehydration, not sepsis.",
      "Correct. Infection triggers vessel dilation everywhere, so the container gets too big for the blood.",
      "Airway obstruction causes hypoxia, not the distributive collapse of sepsis.",
    ],
    followUp: {
      prompt: "Anaphylactic shock is which kind of failure?",
      choices: ["Pump", "Fluid loss", "Pipes — massive dilation"],
      answer: 2,
      why: "Anaphylaxis, sepsis, and neurogenic are pipe (distributive) failures — the vessels dilate everywhere.",
    },
    keyPoints: [
      {
        text: "Pump = MI/CHF/tamponade/tension; pipes = sepsis/anaphylaxis/neurogenic; fluid = bleeding/dehydration",
        terms: ["pump", "pipe", "fluid", "dilat", "distribut"],
      },
      {
        text: "Sepsis dilates vessels everywhere — the container outgrows the blood in it",
        terms: ["sepsis", "vessel", "container", "infection", "dilat"],
      },
    ],
  },
  {
    id: "body-hemophilia",
    topic: "body",
    prompt:
      "A patient with hemophilia has a small laceration that has soaked through two dressings. You should:",
    choices: [
      "Maintain firm, uninterrupted direct pressure and transport promptly",
      "Lift the dressing every few minutes to check whether a clot has formed",
      "Apply a tourniquet immediately for any bleeding in this patient",
      "Delay transport until the bleeding stops on its own",
    ],
    answer: 0,
    rationale:
      "Hemophiliacs are missing clotting factors, so even minor trauma bleeds for a long time. Hold continuous pressure without peeking, ask what they take, and move early — you do not carry replacement factor.",
    why: [
      "Correct. Constant pressure plus early transport — the hospital has the factor you do not.",
      "Peeking disturbs whatever fragile clot has started to form.",
      "A tourniquet is for uncontrolled extremity hemorrhage after pressure fails, not every cut.",
      "Waiting on a patient who cannot clot means waiting forever while volume drains.",
    ],
    followUp: {
      prompt: "Why does a hemophiliac's small cut matter so much?",
      choices: [
        "Their skin is thinner",
        "They are missing clotting factors, so bleeding does not stop on its own",
        "Their blood pressure runs higher",
      ],
      answer: 1,
      why: "Missing factors (Hemophilia A = factor VIII) mean minor wounds bleed for a long time — pressure and early transport.",
    },
    keyPoints: [
      {
        text: "Hemophilia = missing clotting factors — minor trauma bleeds a long time",
        terms: ["factor", "clot", "missing", "viii", "8"],
      },
      {
        text: "Firm uninterrupted pressure, no peeking, early transport — the hospital has the factor",
        terms: ["pressure", "peek", "uninterrupt", "transport", "hospital"],
      },
    ],
  },
  {
    id: "body-aerobic",
    topic: "body",
    prompt:
      "During shock, cells switch to anaerobic metabolism. This produces:",
    choices: [
      "More energy with less waste",
      "Lactic acid and a buildup of acidosis",
      "Extra glucose for the brain",
      "An increase in body heat",
    ],
    answer: 1,
    rationale:
      "Hypoperfusion starves cells of oxygen, forcing anaerobic metabolism: far less energy, lactic acid, acidosis, and heat loss. That is why shock patients get a blanket even on a warm day.",
    why: [
      "Anaerobic metabolism produces far less energy, not more.",
      "Correct. Without oxygen, cells make lactic acid and the body turns acidotic.",
      "Cells burn glucose in shock — they do not produce it.",
      "Shock patients lose heat, which is exactly why you cover them.",
    ],
    followUp: {
      prompt: "Why does a shock patient get a blanket even on a warm day?",
      choices: [
        "Comfort only",
        "To hide injuries from bystanders",
        "Anaerobic metabolism loses heat, and they cannot spare the energy",
      ],
      answer: 2,
      why: "Shock cells make far less energy and shed heat — cover the patient to protect what little is left.",
    },
    keyPoints: [
      {
        text: "Hypoperfusion → anaerobic metabolism: far less energy plus lactic acid and acidosis",
        terms: ["anaerobic", "lactic", "acid", "less energy"],
      },
      {
        text: "Heat loss comes with it — blanket shock patients even when it is warm",
        terms: ["heat", "blanket", "cover", "warm"],
      },
    ],
  },
  {
    id: "move-power-grip",
    topic: "move",
    prompt:
      "When using the power grip to lift a stretcher, your hands should be positioned:",
    choices: [
      "Palms down with the hands close together",
      "Palms down with the arms fully extended",
      "Palms up with one hand stacked on the other",
      "Palms up, about 10 inches apart, fully wrapped around the bar",
    ],
    answer: 3,
    rationale:
      "Power grip is palms up, hands roughly 10 inches apart, fingers fully wrapped. Lift with the legs, keep the shoulders over the pelvis, hold the load close, and never twist.",
    why: [
      "Palms down loses grip strength and control of the bar.",
      "Extended arms move the load away from your body and load the back.",
      "Stacked hands cannot balance a stretcher bar.",
      "Correct. Palms up and spaced apart gives the strongest, most stable hold.",
    ],
    followUp: {
      prompt: "The power lift protects your back by:",
      choices: [
        "Lifting with the legs, load close, no twisting",
        "Leaning over the load with straight legs",
        "Using one-handed grips for balance",
      ],
      answer: 0,
      why: "Legs lift, shoulders stay over the pelvis, load stays close, never twist — the grip and the lift work together.",
    },
    keyPoints: [
      {
        text: "Power grip: palms up, hands about 10 inches apart, fingers fully wrapped",
        terms: ["palm", "10", "ten", "wrap", "up"],
      },
      {
        text: "Lift with the legs, load close, shoulders over pelvis, no twisting",
        terms: ["leg", "close", "twist", "pelvis", "back"],
      },
    ],
  },
  {
    id: "move-stair-iso",
    topic: "move",
    prompt:
      "A conscious patient with no spinal complaint must be carried down two flights of stairs in a building with no elevator. The best device is:",
    choices: [
      "The wheeled gurney",
      "A long backboard",
      "A stair chair",
      "A scoop stretcher",
    ],
    answer: 2,
    rationale:
      "Conscious, no spine concern, stairs — that is the stair chair. Unconscious or spine-injured patients go on a board, carried feet first with the strongest providers at the ends.",
    why: [
      "Gurneys do not belong on stairs — they tip and drop patients.",
      "A board is for unconscious or spine-injured patients, not a cooperative seated carry.",
      "Correct. The stair chair is built for exactly this: awake patient, stairs, no elevator.",
      "The scoop is for patients you cannot roll, like hip fractures — not stair work.",
    ],
    followUp: {
      prompt: "Same stairs, but the patient is unconscious. Now what?",
      choices: [
        "Backboard, carried feet first, strongest providers at the ends",
        "Stair chair anyway",
        "Wait for an elevator",
      ],
      answer: 0,
      why: "Unconscious or spine concern = board. Feet first on stairs, with the strength stationed at the ends.",
    },
    keyPoints: [
      {
        text: "Conscious, no spine concern, stairs = stair chair",
        terms: ["stair chair", "conscious", "sit"],
      },
      {
        text: "Unconscious or spine = backboard, feet first, strongest at the ends",
        terms: ["board", "feet first", "unconscious", "spine"],
      },
    ],
  },
  {
    id: "flow",
    topic: "assess",
    prompt:
      "You have completed the scene size-up on an unresponsive medical patient. Your next step is:",
    choices: [
      "Obtaining a SAMPLE history from the family",
      "The primary assessment",
      "A full set of baseline vital signs",
      "The detailed physical exam",
    ],
    answer: 1,
    rationale:
      "The call order is scene size-up, primary assessment, history, secondary exam with vitals, field impression and interventions, then reassessment. Life threats come before questions.",
    why: [
      "History waits until the ABCs are checked — a life threat will not wait for SAMPLE.",
      "Correct. The primary assessment hunts life threats immediately after the scene is sized up.",
      "Vitals ride with the secondary exam, after life threats are managed.",
      "The detailed exam comes later — after the primary and history.",
    ],
    followUp: {
      prompt: "Where does the field impression land in the call order?",
      choices: [
        "Before the primary survey",
        "Only at the hospital",
        "After history and the secondary exam, driving your treatment",
      ],
      answer: 2,
      why: "Scene → primary → history → secondary and vitals → impression plus interventions → reassess.",
    },
    keyPoints: [
      {
        text: "Order: scene size-up → primary → history → secondary + vitals → impression and treatment → reassess",
        terms: ["scene", "primary", "history", "secondary", "order", "reassess"],
      },
      {
        text: "Life threats come before questions — history waits for the ABCs",
        terms: ["life threat", "abc", "before", "wait"],
      },
    ],
  },
  {
    id: "scene-five",
    topic: "assess",
    prompt: "Which of the following is a component of the scene size-up?",
    choices: [
      "Determining the number of patients",
      "Obtaining baseline vital signs",
      "Checking pupil response",
      "Asking the OPQRST questions",
    ],
    answer: 0,
    rationale:
      "The scene size-up happens before you touch anyone: BSI, scene safety, MOI or NOI, number of patients, and the need for extra resources. Call law enforcement early for suspected abuse or an escalating scene.",
    why: [
      "Correct. Counting patients tells you whether you need more units before you commit.",
      "Vitals are part of patient assessment, which starts after the size-up.",
      "Pupils belong to the physical exam, not the size-up.",
      "OPQRST is history-taking — well after the scene is secured.",
    ],
    followUp: {
      prompt: "When do you get law enforcement rolling?",
      choices: [
        "After transport, if at all",
        "Early — suspected abuse or an escalating scene",
        "Only for car crashes",
      ],
      answer: 1,
      why: "Abuse, violence, or a heating-up scene gets law started early — before you become the second patient.",
    },
    keyPoints: [
      {
        text: "Five size-up tasks: BSI, scene safety, MOI/NOI, number of patients, extra resources",
        terms: ["bsi", "safety", "moi", "noi", "number", "resource"],
      },
      {
        text: "All of it happens before patient contact",
        terms: ["before", "contact", "touch"],
      },
    ],
  },
  {
    id: "upper-sounds",
    topic: "assess",
    prompt:
      "You hear gurgling from an unresponsive patient's airway. Your immediate action is to:",
    choices: [
      "Insert an oropharyngeal airway",
      "Apply a non-rebreather at 15 L/min",
      "Suction the oropharynx",
      "Begin bag-valve-mask ventilations",
    ],
    answer: 2,
    rationale:
      "Gurgling means fluid in the airway — suction it before anything else. Snoring means the tongue (reposition or adjunct); stridor means upper-airway swelling. Pushing air past fluid drives it into the lungs.",
    why: [
      "An OPA fixes the tongue, and inserting it through fluid just shoves the fluid deeper.",
      "Oxygen blown over a wet airway never reaches the alveoli.",
      "Correct. Fluid you can hear must be suctioned out — up to 10 seconds per pass.",
      "Bagging first forces the fluid down into the lungs — suction, then ventilate.",
    ],
    followUp: {
      prompt: "You hear high-pitched stridor instead. What is that?",
      choices: [
        "Fluid — suction it",
        "The tongue — reposition",
        "Upper-airway swelling — think anaphylaxis or croup",
      ],
      answer: 2,
      why: "Stridor = upper-airway swelling. Snoring = tongue. Gurgling = fluid, which gets suction.",
    },
    keyPoints: [
      {
        text: "Gurgling = fluid → suction before pushing any air",
        terms: ["gurgl", "fluid", "suction"],
      },
      {
        text: "Snoring = tongue; stridor = upper-airway swelling",
        terms: ["snor", "tongue", "stridor", "swell"],
      },
    ],
  },
  {
    id: "adult-numbers",
    topic: "assess",
    prompt:
      "Using the pediatric formula, the minimum acceptable systolic blood pressure for a 5-year-old is:",
    choices: ["70 mmHg", "80 mmHg", "90 mmHg", "100 mmHg"],
    answer: 1,
    rationale:
      "Under age 10, minimum systolic is 2 × age + 70 — for a 5-year-old, 2 × 5 + 70 = 80. At age 10 the formula reaches 90, the adult cutoff. Adult normals: RR 12–20, pulse 60–100, systolic 90–120.",
    why: [
      "70 is the formula's base with no age added — a newborn number, too low for a 5-year-old.",
      "Correct. 2 × 5 + 70 = 80 mmHg.",
      "90 is the adult floor, which the formula does not reach until age 10.",
      "100 is well above the minimum for a 5-year-old.",
    ],
    followUp: {
      prompt:
        "At what age does the 2-times-age-plus-70 formula meet the adult floor of 90?",
      choices: ["Age 6", "Age 10", "Age 15"],
      answer: 1,
      why: "2 × 10 + 70 = 90 — from age 10 up, use the adult cutoff.",
    },
    keyPoints: [
      {
        text: "Under 10: minimum systolic = 2 × age + 70",
        terms: ["2", "70", "formula", "age"],
      },
      {
        text: "The adult floor is 90; the formula reaches it at age 10",
        terms: ["90", "10", "adult"],
      },
    ],
  },
  {
    id: "gcs",
    topic: "assess",
    prompt:
      "A patient opens his eyes to your voice, is confused when he speaks, and obeys commands. His Glasgow Coma Scale score is:",
    choices: ["11", "12", "13", "14"],
    answer: 2,
    rationale:
      "Eyes to voice = 3, confused speech = 4, obeys commands = 6, for a total of 13. Ranges: eyes 1–4, verbal 1–5, motor 1–6. Fully alert is 15; no response at all is 3.",
    why: [
      "11 would require worse verbal or motor findings than described.",
      "12 undercounts one component — recheck eyes 3, verbal 4, motor 6.",
      "Correct. 3 (eyes to voice) + 4 (confused) + 6 (obeys) = 13.",
      "14 would need spontaneous eye opening or fully oriented speech.",
    ],
    followUp: {
      prompt: "The lowest possible GCS score is:",
      choices: ["0", "1", "3"],
      answer: 2,
      why: "Each category bottoms out at 1 — eyes 1–4, verbal 1–5, motor 1–6 — so the floor is 3, not 0.",
    },
    keyPoints: [
      {
        text: "Eyes 1–4, verbal 1–5, motor 1–6 — add the three scores",
        terms: ["eyes", "verbal", "motor", "add", "1-4", "1–4"],
      },
      {
        text: "15 = fully alert; 3 = no response at all",
        terms: ["15", "3", "alert", "floor", "lowest"],
      },
    ],
  },
  {
    id: "focused-vs-detailed",
    topic: "assess",
    prompt:
      "Which patient requires a rapid head-to-toe exam rather than a focused exam?",
    choices: [
      "An alert adult with wrist pain after tripping",
      "An alert driver who was ejected from his vehicle",
      "An adult with two days of sore throat",
      "An adult with a small laceration on one hand",
    ],
    answer: 1,
    rationale:
      "Significant mechanism of injury — ejection, high speed, a big fall — earns a full head-to-toe even if the patient is awake, because injuries hide. Responsive patients who can localize a minor complaint get a focused exam.",
    why: [
      "A localized wrist complaint after a simple trip gets a focused exam of that limb.",
      "Correct. Ejection is a major mechanism — hidden multi-system injury until proven otherwise.",
      "A medical complaint the patient can describe gets a focused assessment.",
      "One small cut on one hand is the definition of a focused exam.",
    ],
    followUp: {
      prompt: "Why does the awake, talking ejected driver still get head-to-toe?",
      choices: [
        "Protocol paperwork",
        "Significant mechanism hides injuries even in talking patients",
        "Because he cannot legally refuse",
      ],
      answer: 1,
      why: "Big mechanism = hidden or multiple injuries until proven otherwise — the exam goes hunting for them.",
    },
    keyPoints: [
      {
        text: "Significant MOI (ejection, high speed, big fall) → rapid head-to-toe even if awake",
        terms: ["moi", "mechanism", "eject", "head-to-toe", "head to toe"],
      },
      {
        text: "Localized minor complaint → focused exam of that area only",
        terms: ["focused", "localiz", "point", "minor", "area"],
      },
    ],
  },
  {
    id: "load-go",
    topic: "assess",
    prompt: "Which patient is the highest transport priority?",
    choices: [
      "Stable abdominal pain that has lasted a month",
      "An ankle injury with intact pulse, motor, and sensation",
      "A responsive patient whose airway required suctioning",
      "An anxious patient with completely normal vital signs",
    ],
    answer: 2,
    rationale:
      "High priority means a time-sensitive threat: altered mental status, an airway you had to open or suction, assisted ventilations, major bleeding, shock, ACS-type chest pain, or complicated childbirth. Stable complaints can stay and play.",
    why: [
      "A month of stable pain with good ABCs is not time-critical.",
      "An isolated ankle injury with intact distal checks is a low-priority transport.",
      "Correct. Needing airway intervention puts the patient in the load-and-go category.",
      "Anxiety with normal vitals is not a physiologic threat.",
    ],
    followUp: {
      prompt: "Which other finding makes a patient load-and-go?",
      choices: [
        "A month of stable back pain",
        "A resolved nosebleed",
        "Signs of shock",
      ],
      answer: 2,
      why: "Altered status, airway interventions, assisted ventilations, big bleeds, shock, ACS pain, complicated childbirth — all high priority.",
    },
    keyPoints: [
      {
        text: "High priority = a time-sensitive threat: altered, airway work, ventilation, shock, major bleed",
        terms: ["altered", "airway", "shock", "ventilat", "bleed", "priority"],
      },
      {
        text: "Stable, non-critical complaints can stay and play",
        terms: ["stable", "stay", "non-critical"],
      },
    ],
  },
  {
    id: "golden-platinum",
    topic: "assess",
    prompt: "For a critical trauma patient, the \"Platinum 10\" refers to:",
    choices: [
      "The 10 minutes from injury to the operating room",
      "A maximum of 10 minutes on scene doing only essential ABC care",
      "A maximum transport time of 10 minutes",
      "The first 10 minutes after hospital arrival",
    ],
    answer: 1,
    rationale:
      "Platinum 10 is arrive-to-drive: no more than about 10 minutes on scene, doing only essential ABC work. The Golden Hour is the bigger clock — injury to surgery in under an hour.",
    why: [
      "Injury to the OR is the Golden Hour, and it is 60 minutes, not 10.",
      "Correct. Ten minutes on scene, life threats only, then drive.",
      "Transport time depends on distance — the 10 minutes is your scene time.",
      "Hospital-arrival benchmarks belong to the ED, not the Platinum 10.",
    ],
    followUp: {
      prompt: "The Golden Hour runs from:",
      choices: [
        "Dispatch to hospital arrival",
        "Injury to surgery",
        "Scene arrival to hospital door",
      ],
      answer: 1,
      why: "Injury to the operating room in under an hour — your 10 scene minutes live inside that window.",
    },
    keyPoints: [
      {
        text: "Platinum 10 = 10 minutes or less on scene, essential ABC care only",
        terms: ["10", "ten", "scene", "abc"],
      },
      {
        text: "Golden Hour = injury to surgery in under 60 minutes",
        terms: ["golden", "hour", "surgery", "60", "injury"],
      },
    ],
  },
  {
    id: "opqrst-ot",
    topic: "assess",
    prompt:
      "You ask a chest-pain patient, \"What were you doing when the pain started?\" Which OPQRST element is this?",
    choices: ["Onset", "Provocation", "Quality", "Timing"],
    answer: 0,
    rationale:
      "Onset is the activity at the moment the pain began. Timing is how long it has lasted — sudden pain 10 minutes ago is far more concerning than pain for two weeks. Severity is the 0–10 scale, and the change matters more than the first number.",
    why: [
      "Correct. Onset captures what the patient was doing when it began.",
      "Provocation asks what makes the pain better or worse.",
      "Quality asks what the pain feels like — sharp, dull, crushing.",
      "Timing asks how long it has been going on, not what started it.",
    ],
    followUp: {
      prompt: "\u201CDoes anything make it better or worse?\u201D is which letter?",
      choices: ["P — provocation/palliation", "Q — quality", "R — region"],
      answer: 0,
      why: "Provocation/palliation asks what changes the pain. Quality is how it feels; region/radiation is where it goes.",
    },
    keyPoints: [
      {
        text: "Onset = what you were doing when it started; Timing = how long it has lasted",
        terms: ["onset", "timing", "start", "duration", "doing when"],
      },
      {
        text: "Sudden and recent is scarier than weeks-old pain; a severity CHANGE matters more than the first number",
        terms: ["sudden", "recent", "severity", "change", "worse"],
      },
    ],
  },
  {
    id: "clocks",
    topic: "reassess",
    prompt:
      "How often should you reassess a stable patient during transport?",
    choices: [
      "Every 5 minutes",
      "Every 10 minutes",
      "Every 15 minutes",
      "Every 30 minutes",
    ],
    answer: 2,
    rationale:
      "Stable patients get a reassessment about every 15 minutes; unstable or critical patients about every 5. One set of vitals is a snapshot — two or more make a trend.",
    why: [
      "Every 5 minutes is the clock for unstable or critical patients.",
      "10 splits the difference — the standard intervals are 5 and 15.",
      "Correct. Stable means roughly every 15 minutes.",
      "30 minutes leaves too much room for a quiet deterioration.",
    ],
    followUp: {
      prompt:
        "Your chest-pain patient turns pale and clammy mid-ride. Reassess clock?",
      choices: [
        "Stay at every 15 minutes",
        "Wait for the ED to reassess",
        "Move to every 5 — he is now unstable",
      ],
      answer: 2,
      why: "Deterioration reclassifies him as unstable — the 5-minute clock starts immediately.",
    },
    keyPoints: [
      {
        text: "Stable = about every 15 minutes; unstable or critical = every 5",
        terms: ["15", "5", "five", "fifteen"],
      },
      {
        text: "Two or more vital sets make a trend — one set is just a snapshot",
        terms: ["trend", "snapshot", "two sets", "second set", "compare"],
      },
    ],
  },
  {
    id: "reassess-pass",
    topic: "reassess",
    prompt:
      "A complete reassessment includes all of the following EXCEPT:",
    choices: [
      "Rechecking mental status",
      "Repeating the entire SAMPLE history",
      "Obtaining a new full set of vital signs",
      "Rechecking every intervention you performed",
    ],
    answer: 1,
    rationale:
      "The reassessment pass is mental status, ABCs, a new full vital set, and a recheck of every intervention — tourniquets, dressings, splints, meds, restraints. History is not re-interviewed unless something changed.",
    why: [
      "Mental status is rechecked every pass — a falling AVPU is the earliest alarm.",
      "Correct — this is the exception. You do not restart the SAMPLE interview every cycle.",
      "A fresh vital set is required — trends need at least two sets.",
      "If you did it, you recheck it — splints tighten and dressings soak through.",
    ],
    followUp: {
      prompt: "Which intervention rechecks belong in every reassessment pass?",
      choices: [
        "Only medications",
        "Tourniquets, dressings, splints, meds, restraints — all of them",
        "Only the last thing you did",
      ],
      answer: 1,
      why: "Everything you did gets rechecked: tourniquet holding, dressing dry, splint CSM, med response, restraint circulation.",
    },
    keyPoints: [
      {
        text: "A pass = mental status + ABCs + a new full set of vitals + every intervention",
        terms: ["mental", "abc", "vitals", "intervention", "full set"],
      },
      {
        text: "History is not re-interviewed unless something changed",
        terms: ["history", "sample", "not", "unless", "re-interview"],
      },
    ],
  },
  {
    id: "rosc",
    topic: "reassess",
    prompt:
      "During CPR you feel a strong carotid pulse return. You should:",
    choices: [
      "Continue compressions for two more minutes to be certain",
      "Obtain a SAMPLE history from bystanders",
      "Place the patient in the recovery position and load",
      "Stop compressions and reassess airway and breathing",
    ],
    answer: 3,
    rationale:
      "Return of circulation is not automatic return of breathing — the heart can restart while the patient still needs ventilations. Any major change sends you back through mental status, airway, breathing, circulation.",
    why: [
      "Compressing a beating heart is harmful — a real pulse means compressions stop.",
      "History can wait — the airway and breathing status cannot.",
      "Recovery position requires adequate breathing, which you have not confirmed yet.",
      "Correct. Stop compressions and immediately check whether he is breathing adequately.",
    ],
    followUp: {
      prompt: "The pulse is back but he is not breathing. You:",
      choices: [
        "Restart compressions",
        "Put him in the recovery position",
        "Ventilate with the BVM",
      ],
      answer: 2,
      why: "ROSC without breathing = rescue ventilations. Compressions are for no pulse; recovery position needs adequate breathing.",
    },
    keyPoints: [
      {
        text: "Return of pulse does not mean return of breathing — reassess airway and breathing immediately",
        terms: ["rosc", "breath", "reassess", "airway", "not mean"],
      },
      {
        text: "Never compress a beating heart; big changes send you back to mental status and ABCs",
        terms: ["stop compress", "beating", "abc", "change", "never compress"],
      },
    ],
  },
  {
    id: "test-med-order",
    topic: "reassess",
    prompt:
      "Your patient needs a medication, and your protocol has no standing order for it. Before administering, you must:",
    choices: [
      "Contact medical control for an order",
      "Have the patient sign a consent form",
      "Administer it and notify the ED on arrival",
      "Administer half the dose to be safe",
    ],
    answer: 0,
    rationale:
      "Without standing orders, the sequence is: contact medical control, administer if approved, then reassess. On the exam, assume you need an online order unless the question already gave you one.",
    why: [
      "Correct. No standing order means an online order from medical control first.",
      "A signature is consent paperwork, not a medication order.",
      "Give-first-explain-later is practicing outside your authorization.",
      "Half of an unauthorized dose is still an unauthorized dose.",
    ],
    followUp: {
      prompt:
        "The stem says protocol authorizes standing-order aspirin. Now what?",
      choices: [
        "Still call medical control first",
        "Give it per protocol, then reassess",
        "Have the patient sign a consent form first",
      ],
      answer: 1,
      why: "Standing orders ARE the authorization. You call only when the stem gives you neither an order nor a protocol.",
    },
    keyPoints: [
      {
        text: "No standing order → contact medical control before giving the med",
        terms: ["medical control", "order", "contact", "call"],
      },
      {
        text: "Sequence matters and is graded: authorization → administer → reassess",
        terms: ["sequence", "reassess", "then", "order of"],
      },
    ],
  },
  {
    id: "vent-resp-ox",
    topic: "resp",
    prompt:
      "The exchange of gases between the alveoli and the blood is called:",
    choices: ["Ventilation", "Respiration", "Oxygenation", "Perfusion"],
    answer: 1,
    rationale:
      "Ventilation is air moving in and out; respiration is gas exchange at the alveoli; oxygenation is oxygen loading onto hemoglobin — what the pulse ox reads. Three different failures need three different fixes.",
    why: [
      "Ventilation is the mechanical movement of air — chest rise, not gas exchange.",
      "Correct. Respiration is the actual swap of oxygen and CO₂ across the alveolar wall.",
      "Oxygenation is oxygen binding to hemoglobin in the blood, one step downstream.",
      "Perfusion is blood delivery to the tissues — the circulation side.",
    ],
    followUp: {
      prompt: "The pulse ox reading measures:",
      choices: [
        "Ventilation",
        "Respiration",
        "Oxygenation — O₂ loaded onto hemoglobin",
      ],
      answer: 2,
      why: "SpO₂ is oxygenation. Ventilation is air movement; respiration is the alveolar gas swap.",
    },
    keyPoints: [
      {
        text: "Ventilation = air moving; respiration = alveolar gas exchange; oxygenation = O₂ on hemoglobin",
        terms: ["ventilation", "respiration", "oxygenation", "exchange", "hemoglobin"],
      },
      {
        text: "Three different failures — three different fixes",
        terms: ["different", "three", "failure", "fix"],
      },
    ],
  },
  {
    id: "c345",
    topic: "resp",
    prompt:
      "A spinal cord injury above C3–C5 threatens breathing because it can paralyze the:",
    choices: [
      "Intercostal muscles",
      "Abdominal muscles",
      "Diaphragm",
      "Accessory neck muscles",
    ],
    answer: 2,
    rationale:
      "\"C3, 4, 5 keeps the diaphragm alive\" — the phrenic nerve exits there. An injury above that level can stop the diaphragm; a lower neck injury can paralyze the body yet leave breathing intact.",
    why: [
      "The intercostals are driven by thoracic nerves further down the cord.",
      "Abdominal muscles assist exhalation and are innervated lower still.",
      "Correct. The phrenic nerve from C3–C5 drives the diaphragm — the main breathing muscle.",
      "The accessory muscles have their own nerve supply and cannot sustain breathing alone anyway.",
    ],
    followUp: {
      prompt: "\u201CC3, 4, 5 keeps the ___ alive.\u201D",
      choices: ["Heart", "Diaphragm", "Cerebellum"],
      answer: 1,
      why: "The phrenic nerve (C3–C5) drives the diaphragm — the rhyme locks the level.",
    },
    keyPoints: [
      {
        text: "The phrenic nerve exits C3–C5 and drives the diaphragm",
        terms: ["phrenic", "c3", "c4", "c5", "diaphragm"],
      },
      {
        text: "Injury at or above that level can stop breathing; below it may spare the diaphragm",
        terms: ["above", "below", "paralyz", "stop breath", "spare"],
      },
    ],
  },
  {
    id: "patterns",
    topic: "resp",
    prompt:
      "A diabetic patient with fruity breath is breathing very deep and fast. This pattern is called:",
    choices: [
      "Agonal respirations",
      "Biot's respirations",
      "Cheyne-Stokes respirations",
      "Kussmaul respirations",
    ],
    answer: 3,
    rationale:
      "Kussmaul is deep, fast breathing — the body blowing off acid in DKA or aspirin overdose. Do not reflexively bag it down; it is compensation. Agonal = arrest gasps, Cheyne-Stokes = wax-wane with pauses (brain), Biot's = chaotic (brainstem).",
    why: [
      "Agonal breaths are the slow, ineffective gasps of cardiac arrest — treat as no breathing.",
      "Biot's is irregular and chaotic, pointing at the brainstem — not this regular deep-fast pattern.",
      "Cheyne-Stokes waxes, wanes, and pauses — a brain-injury pattern.",
      "Correct. Deep and fast in an acidotic diabetic is Kussmaul — compensation you should not suppress.",
    ],
    followUp: {
      prompt: "Breathing that waxes, wanes, and pauses points to:",
      choices: [
        "Cheyne-Stokes — brain injury",
        "Kussmaul — acidosis",
        "Agonal — arrest",
      ],
      answer: 0,
      why: "The wax-wane-pause cycle is Cheyne-Stokes, a brain-injury pattern. Biot's is chaotic and points at the brainstem.",
    },
    keyPoints: [
      {
        text: "Kussmaul = deep + fast = blowing off acid (DKA); do not bag it down",
        terms: ["kussmaul", "acid", "dka", "deep", "blow"],
      },
      {
        text: "Agonal = arrest gasps; Cheyne-Stokes = wax-wane (brain); Biot's = chaotic (brainstem)",
        terms: ["agonal", "cheyne", "biot", "gasp", "chaotic"],
      },
    ],
  },
  {
    id: "co-sat",
    topic: "resp",
    prompt:
      "A patient rescued from a house fire has no burns and an SpO₂ of 100% on room air. You should:",
    choices: [
      "Apply a non-rebreather at 15 L/min despite the reading",
      "Withhold oxygen because the saturation is adequate",
      "Apply a nasal cannula at 2 L/min for comfort",
      "Monitor on room air during transport",
    ],
    answer: 0,
    rationale:
      "Carbon monoxide occupies hemoglobin, and the pulse ox counts those seats as full — a fire patient can read 100% while suffocating. Treat the exposure with high-flow oxygen. Anemia, cold fingers, nail polish, and bright light can also fool the probe.",
    why: [
      "Correct. Assume CO exposure and flood him with high-concentration oxygen.",
      "The reading is a lie in CO poisoning — trusting it is the trap this question sets.",
      "A trickle of oxygen does not displace carbon monoxide from hemoglobin.",
      "Monitoring alone leaves the CO parked on his hemoglobin the whole ride.",
    ],
    followUp: {
      prompt: "Why does the pulse ox read 100% in CO poisoning?",
      choices: [
        "It counts CO-occupied hemoglobin as saturated",
        "The probe is broken",
        "CO raises real oxygen levels",
      ],
      answer: 0,
      why: "The machine sees occupied seats, not what occupies them — CO fills the hemoglobin and reads as saturation.",
    },
    keyPoints: [
      {
        text: "CO occupies hemoglobin; the pulse ox counts those seats as full — a false-normal reading",
        terms: ["hemoglobin", "occup", "seat", "false", "carbon monoxide"],
      },
      {
        text: "Fire or CO exposure → high-flow oxygen regardless of the number",
        terms: ["high-flow", "high flow", "nrb", "15", "regardless"],
      },
    ],
  },
  {
    id: "bag-vs-nrb",
    topic: "resp",
    prompt:
      "Which patient needs bag-valve-mask ventilations rather than a non-rebreather?",
    choices: [
      "SpO₂ of 89% while speaking in full sentences",
      "Chest pain with an SpO₂ of 92% and adequate breathing",
      "Wheezing with an SpO₂ of 91% and good tidal volume",
      "Agonal gasps at 4 per minute",
    ],
    answer: 3,
    rationale:
      "The bag is for failed ventilation: apnea, agonal breathing, or inadequate rate or volume. A patient who is breathing adequately but hypoxic, distressed, or shocked gets high-concentration oxygen — on the test, almost always a non-rebreather.",
    why: [
      "Full sentences prove adequate ventilation — this patient gets supplemental oxygen.",
      "Adequate breathing with chest pain earns an NRB, not a bag.",
      "Good tidal volume means air is moving — treat the wheeze, give oxygen.",
      "Correct. Agonal gasps are not breathing — ventilate immediately.",
    ],
    followUp: {
      prompt: "Breathing adequately but shocky and pale — which oxygen?",
      choices: [
        "Bag him anyway",
        "No oxygen until the sats drop",
        "Non-rebreather at 15 L/min",
      ],
      answer: 2,
      why: "Adequate mechanics plus hypoxia or shock = high-concentration O₂. The bag is only for failed ventilation.",
    },
    keyPoints: [
      {
        text: "Bag = apnea, agonal gasps, or inadequate rate/volume",
        terms: ["bag", "bvm", "agonal", "apnea", "inadequate"],
      },
      {
        text: "Breathing but hypoxic or shocked = NRB while you keep watching the airway",
        terms: ["nrb", "non-rebreather", "15", "hypox"],
      },
    ],
  },
  {
    id: "suction-triggers",
    topic: "airway",
    prompt: "Which finding is an indication for oropharyngeal suctioning?",
    choices: [
      "Snoring respirations",
      "Audible gurgling",
      "An SpO₂ of 90%",
      "Unresponsiveness by itself",
    ],
    answer: 1,
    rationale:
      "Suction has two triggers: fluid you can see, or gurgling you can hear. Measure the rigid catheter from mouth corner to earlobe, suction only on the way out, 10 seconds max at every age.",
    why: [
      "Snoring is the tongue — fix it with positioning or an airway adjunct, not suction.",
      "Correct. Gurgling means fluid in the airway — clear it before you push any air.",
      "A low saturation calls for oxygen or ventilation, not suction, unless fluid is present.",
      "Unconsciousness alone with a dry airway gets an opener and an adjunct, not prophylactic suction.",
    ],
    followUp: {
      prompt: "Maximum suction time per pass, at any age?",
      choices: ["5 seconds", "10 seconds", "30 seconds"],
      answer: 1,
      why: "10 seconds max — you remove air and oxygen along with the fluid. Suction on the way out.",
    },
    keyPoints: [
      {
        text: "Two triggers only: visible fluid or audible gurgling",
        terms: ["see", "visible", "gurgl", "two trigger", "fluid", "hear"],
      },
      {
        text: "Rigid catheter measured mouth-corner to earlobe; 10 seconds max; suction on the way out",
        terms: ["10", "earlobe", "way out", "measure", "rigid"],
      },
    ],
  },
  {
    id: "tilt-vs-thrust",
    topic: "airway",
    prompt:
      "You find an unresponsive patient at the bottom of a staircase. You should open the airway using:",
    choices: [
      "The jaw-thrust maneuver",
      "The head-tilt chin-lift",
      "A blind finger sweep",
      "Hyperextension of the neck",
    ],
    answer: 0,
    rationale:
      "An unknown fall means possible spine injury — use the jaw thrust and keep the head and neck in line. Head-tilt chin-lift is for medical patients with no spine concern. When unsure, err toward the jaw thrust.",
    why: [
      "Correct. Fingers behind the jaw angle, push into an underbite, neck stays neutral.",
      "The tilt moves the cervical spine — wrong choice with a possible fall injury.",
      "Blind finger sweeps are out — they push objects deeper.",
      "Hyperextending the neck is exactly the movement you are trying to prevent.",
    ],
    followUp: {
      prompt: "Unresponsive in bed, clearly medical, no trauma. Which opener?",
      choices: ["Head-tilt chin-lift", "Jaw thrust", "NPA first, then decide"],
      answer: 0,
      why: "Medical with no spine concern = head-tilt chin-lift. Trauma or unknown = jaw thrust.",
    },
    keyPoints: [
      {
        text: "Possible spine involvement (falls, wrecks, unknown) → jaw thrust, neck stays neutral",
        terms: ["jaw", "thrust", "neutral", "spine", "trauma"],
      },
      {
        text: "Medical with no spine concern → head-tilt chin-lift",
        terms: ["tilt", "chin", "medical"],
      },
    ],
  },
  {
    id: "opa",
    topic: "airway",
    prompt:
      "Which patient is an appropriate candidate for an oropharyngeal airway?",
    choices: [
      "A patient who responds to painful stimulus",
      "A semi-conscious patient who gags on examination",
      "An unresponsive patient with no gag reflex",
      "An awake patient with slurred speech",
    ],
    answer: 2,
    rationale:
      "The OPA is only for the fully unresponsive patient with no gag — AVPU = U. Size it mouth corner to earlobe, insert rotated (180° or 90°), and if a gag appears, pull it and expect vomit.",
    why: [
      "A pain response means an intact enough gag to reject the OPA and vomit.",
      "An active gag is the hard stop — this patient gets an NPA if allowed, or a manual jaw hold.",
      "Correct. No responsiveness and no gag are both required before an OPA goes in.",
      "An awake patient protects his own airway — no adjunct belongs in his mouth.",
    ],
    followUp: {
      prompt: "The OPA is in and the patient starts gagging. You:",
      choices: [
        "Hold it in place until he settles",
        "Push it deeper past the gag",
        "Pull it now and expect vomit",
      ],
      answer: 2,
      why: "A gag means the OPA comes out immediately — have suction in reach.",
    },
    keyPoints: [
      {
        text: "OPA only if fully unresponsive with NO gag reflex",
        terms: ["no gag", "unresponsive", "gag reflex"],
      },
      {
        text: "Size corner of mouth to earlobe; insert rotated; any gag = pull it now",
        terms: ["earlobe", "rotate", "180", "pull", "size"],
      },
    ],
  },
  {
    id: "npa-stop",
    topic: "airway",
    prompt: "A nasopharyngeal airway is contraindicated in a patient with:",
    choices: [
      "An intact gag reflex",
      "Alcohol intoxication",
      "Unresponsiveness",
      "Suspected basilar skull fracture",
    ],
    answer: 3,
    rationale:
      "With a fractured skull base, the tube can pass through the break into the brain. Any significant head or face trauma is the NPA hard stop. If there is facial trauma and a gag, use neither adjunct — hold the jaw manually.",
    why: [
      "An intact gag is actually a reason to choose the NPA over the OPA.",
      "Intoxication alone does not block an NPA — a threatened airway may need one.",
      "Unresponsive patients often get an NPA or OPA — unresponsiveness is not the stop.",
      "Correct. A basilar skull fracture turns the nasal route into a path to the brain.",
    ],
    followUp: {
      prompt: "Semi-conscious with an intact gag, no facial trauma. Which adjunct?",
      choices: ["OPA", "NPA", "Neither, ever"],
      answer: 1,
      why: "A gag rules out the OPA; the NPA tolerates a gag — as long as there is no head or face trauma.",
    },
    keyPoints: [
      {
        text: "NPA hard stop = head or face trauma / possible basilar skull fracture",
        terms: ["skull", "basilar", "face", "head trauma", "fracture"],
      },
      {
        text: "The NPA is the gag-tolerant adjunct; facial trauma plus a gag = hold the jaw manually",
        terms: ["gag", "tolerat", "hand", "jaw", "manual"],
      },
    ],
  },
  {
    id: "skip-sample",
    topic: "airway",
    prompt:
      "In which situation is it acceptable to skip the SAMPLE history?",
    choices: [
      "Never — history always comes first",
      "An unconscious patient with no family, ID, or medication list available",
      "On every trauma call",
      "Whenever transport time is under 10 minutes",
    ],
    answer: 1,
    rationale:
      "When the patient is out and there is no one and nothing to ask, there is no history to take — go to the physical exam. Life threats and a short scene beat empty history boxes.",
    why: [
      "History never comes before life threats, and sometimes there is no history to get.",
      "Correct. No patient answers and no outside source means the exam is your information.",
      "Trauma patients still get a history whenever someone can provide one.",
      "A short ride does not erase the value of a quick SAMPLE when a source exists.",
    ],
    followUp: {
      prompt: "He is unconscious but his wife is right there. History?",
      choices: [
        "Skip it — he cannot answer",
        "Wait for him to wake up",
        "Take SAMPLE from the wife",
      ],
      answer: 2,
      why: "Any source counts: family, bystanders, med lists, bracelets. You skip only when there is truly nothing.",
    },
    keyPoints: [
      {
        text: "Skip history only when the patient is out AND no family, ID, or med list exists",
        terms: ["no family", "no source", "nothing", "unconscious", "skip"],
      },
      {
        text: "Otherwise pull SAMPLE from any available source; the physical exam becomes your information",
        terms: ["bystander", "family", "exam", "source", "wife", "med list"],
      },
    ],
  },
  {
    id: "nrb-nc",
    topic: "airway",
    prompt:
      "An adult is breathing adequately with an SpO₂ of 87% and visible distress. The most appropriate oxygen device is:",
    choices: [
      "A nasal cannula at 2 L/min",
      "A nasal cannula at 6 L/min",
      "A non-rebreather at 15 L/min",
      "A bag-valve mask",
    ],
    answer: 2,
    rationale:
      "Adequate breathing plus real hypoxia or distress gets the high-concentration device — the non-rebreather at 10–15 L/min. The cannula delivers only about 24–44% and dries the nose at 6 L. On the exam, the NRB is almost always the answer here.",
    why: [
      "Two liters is a comfort flow — far too little for a saturation in the 80s.",
      "Six liters through a cannula still tops out around 44% oxygen and burns the nose.",
      "Correct. Significant hypoxia with adequate breathing calls for high-concentration oxygen.",
      "A bag is for inadequate ventilation — this patient is moving air fine.",
    ],
    followUp: {
      prompt: "The nasal cannula flow range is:",
      choices: ["1–6 L/min", "8–12 L/min", "10–15 L/min"],
      answer: 0,
      why: "Cannula runs 1–6 L/min (about 24–44%); 15 L/min is non-rebreather territory.",
    },
    keyPoints: [
      {
        text: "Real hypoxia or distress with adequate breathing → NRB at 10–15 L/min",
        terms: ["nrb", "non-rebreather", "15", "10"],
      },
      {
        text: "Cannula = 1–6 L/min, about 24–44% — the low-need comfort device",
        terms: ["cannula", "1", "6", "44", "24"],
      },
    ],
  },
  {
    id: "cpap",
    topic: "airway",
    prompt: "Which patient is an appropriate candidate for CPAP?",
    choices: [
      "SBP of 82 with crackles in both lungs",
      "Unresponsive with snoring respirations",
      "Actively vomiting with a GI bleed",
      "An alert CHF patient, SBP 128, working hard to breathe, following commands",
    ],
    answer: 3,
    rationale:
      "CPAP needs an alert patient who is still breathing, follows commands, has an SBP of at least 90, and has no facial or chest trauma, pneumothorax, or vomiting. It drops blood pressure, so shock is a contraindication.",
    why: [
      "CPAP lowers blood pressure further — an SBP of 82 is a hard stop.",
      "An unresponsive patient cannot tolerate or protect against the mask — he needs a bag.",
      "Vomiting into a sealed positive-pressure mask is an aspiration disaster.",
      "Correct. Awake, breathing, normotensive, and cooperative with wet lungs — the CPAP patient.",
    ],
    followUp: {
      prompt: "Mid-transport his systolic slides to 84. The CPAP stays or goes?",
      choices: [
        "Stays — he started above 90",
        "Comes off — CPAP below SBP 90 drops him further",
        "Turn the pressure up instead",
      ],
      answer: 1,
      why: "CPAP lowers blood pressure. Below 90 it comes off, and you support ventilation another way.",
    },
    keyPoints: [
      {
        text: "CPAP needs: alert, follows commands, still breathing, systolic at least 90",
        terms: ["alert", "command", "90", "breathing", "awake"],
      },
      {
        text: "Kills: apnea, low BP, chest or face trauma, pneumothorax, vomiting",
        terms: ["apnea", "trauma", "pneumo", "vomit", "low bp", "hypotens"],
      },
    ],
  },
  {
    id: "choke",
    topic: "airway",
    prompt:
      "An adult choking on food can only produce a faint wheeze and cannot speak. You should:",
    choices: [
      "Encourage him to keep coughing",
      "Begin chest compressions immediately",
      "Deliver 5 back blows followed by 5 abdominal thrusts",
      "Perform a blind finger sweep",
    ],
    answer: 2,
    rationale:
      "Silent or nearly silent means severe obstruction: alternate 5 back blows and 5 abdominal thrusts on a conscious adult or child. Infants get back blows and chest thrusts. If he collapses, go straight to compressions — pulse or not.",
    why: [
      "Coaching the cough is for a mild obstruction where he can still talk and cough.",
      "Compressions start when a choking patient collapses, not while he is upright and conscious.",
      "Correct. A conscious severe obstruction gets 5 and 5 until it clears or he drops.",
      "Blind finger sweeps push the food deeper and are no longer taught.",
    ],
    followUp: {
      prompt: "Same choking patient — but now he collapses. You:",
      choices: [
        "Start chest compressions, pulse or not",
        "Keep doing abdominal thrusts on the floor",
        "Check the mouth every 30 seconds and wait",
      ],
      answer: 0,
      why: "Collapse from choking = compressions immediately — they double as your obstruction pump.",
    },
    keyPoints: [
      {
        text: "Severe (silent, no air) = 5 back blows + 5 abdominal thrusts, repeat",
        terms: ["back blow", "abdominal", "5", "five", "thrust"],
      },
      {
        text: "Mild (talking or coughing) = coach the cough; collapse = start compressions",
        terms: ["cough", "mild", "collapse", "compress"],
      },
    ],
  },
  {
    id: "bvm-rates",
    topic: "airway",
    prompt:
      "When ventilating an apneic adult who still has a pulse, you should deliver one breath every:",
    choices: ["2 to 3 seconds", "6 seconds", "10 seconds", "15 seconds"],
    answer: 1,
    rationale:
      "Adults with a pulse get one breath every 6 seconds — about 10–12 per minute — with 10–15 L/min oxygen on the bag, squeezing only until the chest visibly rises. Over-squeezing fills the stomach and drops blood pressure.",
    why: [
      "Every 2–3 seconds is the child and infant rate — too fast for an adult.",
      "Correct. One breath every 6 seconds keeps an adult around 10 per minute.",
      "Every 10 seconds delivers only 6 breaths a minute — under-ventilation.",
      "Every 15 seconds is 4 breaths a minute — nowhere near enough.",
    ],
    followUp: {
      prompt: "How hard do you squeeze the bag?",
      choices: [
        "Flat, every time",
        "Halfway on a count of three",
        "Just until the chest visibly rises",
      ],
      answer: 2,
      why: "Visible chest rise only — over-squeezing fills the stomach (vomit) and drops the blood pressure.",
    },
    keyPoints: [
      {
        text: "Adult with a pulse: 1 breath every 6 seconds (~10/min); child or infant every 2–3 seconds",
        terms: ["6 second", "10", "2–3", "2-3"],
      },
      {
        text: "Squeeze to visible chest rise only — over-ventilating drops BP and causes vomiting",
        terms: ["rise", "over", "stomach", "gentle", "visible"],
      },
    ],
  },
  {
    id: "pump-pipes",
    topic: "circ",
    prompt: "Adequate perfusion depends on which three components?",
    choices: [
      "The heart, the blood vessels, and the blood",
      "The brain, the heart, and the lungs",
      "The airway, the breathing, and the circulation",
      "Plasma, platelets, and red blood cells",
    ],
    answer: 0,
    rationale:
      "Perfusion needs a working pump (heart), intact pipes (vessels), and enough fluid (blood). Failure of any one produces shock. IV fluid can replace volume, but only blood restores oxygen-carrying red cells.",
    why: [
      "Correct. Pump, pipes, and fluid — lose any one and perfusion collapses.",
      "Those organs depend on perfusion; they are not the components that create it.",
      "ABCs are your assessment order, not the perfusion triad.",
      "Those are parts of blood itself — one component of the triad, not all three.",
    ],
    followUp: {
      prompt: "IV fluid replaces volume but cannot:",
      choices: [
        "Raise the blood pressure",
        "Carry oxygen the way red cells do",
        "Fill the pipes",
      ],
      answer: 1,
      why: "Saline restores volume and pressure but has no hemoglobin — only blood restores oxygen-carrying capacity.",
    },
    keyPoints: [
      {
        text: "Perfusion triad: pump (heart), pipes (vessels), fluid (blood)",
        terms: ["pump", "pipe", "fluid", "heart", "vessel", "blood"],
      },
      {
        text: "Any one failing = shock; IV fluid is not oxygen-carrying red cells",
        terms: ["fail", "shock", "iv", "red cell", "oxygen"],
      },
    ],
  },
  {
    id: "left-right-fail",
    topic: "circ",
    prompt:
      "A patient has jugular vein distention and swollen ankles, but his lungs are clear. This presentation suggests failure of the:",
    choices: [
      "Left side of the heart",
      "Both sides of the heart equally",
      "Aortic valve",
      "Right side of the heart",
    ],
    answer: 3,
    rationale:
      "Blood backs up behind the failing side. Right-side failure backs up into the body — JVD and peripheral edema. Left-side failure backs up into the lungs — shortness of breath and crackles (CHF).",
    why: [
      "Left failure floods the lungs with crackles — his lungs are clear.",
      "Equal biventricular failure would show lung findings too.",
      "An isolated valve problem is not what JVD plus edema with clear lungs points to.",
      "Correct. The body-side backup — neck veins and ankles — is right-heart failure.",
    ],
    followUp: {
      prompt: "Crackles and severe breathlessness with no leg swelling — which side failed?",
      choices: ["Right", "Left", "Neither — that is asthma"],
      answer: 1,
      why: "Left failure backs up into the lungs: crackles, dyspnea, CHF. Right failure backs up into the body.",
    },
    keyPoints: [
      {
        text: "Blood backs up BEHIND the side that failed",
        terms: ["back", "behind", "backup"],
      },
      {
        text: "Left → lungs (crackles, SOB); right → body (JVD, ankle edema)",
        terms: ["left", "right", "lung", "jvd", "edema", "crackle"],
      },
    ],
  },
  {
    id: "tpma",
    topic: "circ",
    prompt:
      "Blood returning from the body to the heart passes through which valve first?",
    choices: [
      "The tricuspid valve",
      "The pulmonic valve",
      "The mitral valve",
      "The aortic valve",
    ],
    answer: 0,
    rationale:
      "The valve order is T-P-M-A: body → right atrium → tricuspid → right ventricle → pulmonic → lungs → left atrium → mitral → left ventricle → aortic → aorta. Pulmonary arteries are the exception that carries deoxygenated blood.",
    why: [
      "Correct. Blood from the vena cavae enters the right atrium and crosses the tricuspid first.",
      "The pulmonic valve is second — the exit from the right ventricle toward the lungs.",
      "The mitral valve is third, after blood returns oxygenated from the lungs.",
      "The aortic valve is the final gate out to the body.",
    ],
    followUp: {
      prompt: "Which vessels are the famous exception carrying deoxygenated blood?",
      choices: ["Pulmonary veins", "Coronary arteries", "Pulmonary arteries"],
      answer: 2,
      why: "Pulmonary arteries run right ventricle → lungs with deoxygenated blood; umbilical arteries are the other exception.",
    },
    keyPoints: [
      {
        text: "Valve order T-P-M-A: tricuspid → pulmonic → mitral → aortic",
        terms: ["tpma", "t-p-m-a", "tricuspid", "pulmonic", "mitral", "aortic"],
      },
      {
        text: "Pulmonary arteries carry deoxygenated blood — the exception to arteries-carry-oxygen",
        terms: ["deoxygen", "exception", "pulmonary arter"],
      },
    ],
  },
  {
    id: "co",
    topic: "circ",
    prompt: "Cardiac output is calculated as:",
    choices: [
      "Heart rate × systolic blood pressure",
      "Preload minus afterload",
      "Stroke volume × heart rate",
      "Tidal volume × respiratory rate",
    ],
    answer: 2,
    rationale:
      "Cardiac output = stroke volume × heart rate — at rest, roughly 80 mL × 70 = 5.6 L/min, so the whole blood volume circulates about once a minute. A very fast heart rate can cut filling time, drop stroke volume, and lower output.",
    why: [
      "Blood pressure is a product of output and resistance, not an input to the formula.",
      "Preload and afterload influence stroke volume, but they are not the equation.",
      "Correct. Milliliters per beat times beats per minute equals output per minute.",
      "Tidal volume × rate is minute volume — the breathing twin of this formula.",
    ],
    followUp: {
      prompt: "Heart rate jumps to 190. Why can cardiac output actually FALL?",
      choices: [
        "Filling time shrinks, so stroke volume collapses",
        "The heart muscle gets stronger",
        "The blood gets thicker",
      ],
      answer: 0,
      why: "Too fast means no time to fill — stroke volume drops and output falls despite the rate.",
    },
    keyPoints: [
      {
        text: "Cardiac output = stroke volume × heart rate (about 80 mL × 70 ≈ 5.6 L/min)",
        terms: ["stroke volume", "sv", "80", "5.6", "multiply", "times"],
      },
      {
        text: "Very fast rates cut filling time → stroke volume and output drop",
        terms: ["fill", "fast", "drop", "time"],
      },
    ],
  },
  {
    id: "shock-stages",
    topic: "circ",
    prompt:
      "A trauma patient has a heart rate of 124, pale cool skin, and a blood pressure of 104/72. This patient is in:",
    choices: [
      "Compensated shock",
      "Decompensated shock",
      "Irreversible shock",
      "No shock — the blood pressure is normal",
    ],
    answer: 0,
    rationale:
      "Fast heart rate and clamped-down skin with a blood pressure still holding is compensation. When the systolic falls below 90, compensation has failed — decompensated shock. A normal pressure never rules shock out.",
    why: [
      "Correct. The vessels are squeezing and the rate is up, but the pressure is still holding.",
      "Decompensated requires a falling pressure — his systolic is still above 90.",
      "Irreversible shock is end-stage organ failure, far beyond this picture.",
      "This is the exam trap — a normal BP with shock signs is compensated shock, not no shock.",
    ],
    followUp: {
      prompt: "What marks the switch to decompensated shock?",
      choices: [
        "Heart rate over 100",
        "Any pale skin",
        "A falling systolic pressure — under 90 in an adult",
      ],
      answer: 2,
      why: "Compensation holds the pressure up. When systolic falls, compensation has failed — that is decompensated shock.",
    },
    keyPoints: [
      {
        text: "Compensated = shock signs (fast HR, cool pale skin, anxiety) with BP still holding",
        terms: ["compensat", "holding", "normal bp", "still"],
      },
      {
        text: "Decompensated = systolic falls (under 90 adult); a normal BP never rules out shock",
        terms: ["decompensat", "90", "fall", "drop", "hypotens"],
      },
    ],
  },
  {
    id: "solid-hollow",
    topic: "circ",
    prompt:
      "Blunt trauma to the right upper quadrant most concerns you for major bleeding from the:",
    choices: ["Spleen", "Appendix", "Stomach", "Liver"],
    answer: 3,
    rationale:
      "The liver sits mostly in the RUQ and is a major bleed source after blunt trauma there. Solid organs — liver, spleen, kidneys, pancreas — bleed; hollow organs — stomach, intestines, bladder, gallbladder — leak and cause peritonitis.",
    why: [
      "The spleen is the left-upper-quadrant solid organ — the mirror-image answer.",
      "The appendix lives in the right lower quadrant and is hollow.",
      "The stomach is hollow — it leaks and infects rather than pouring blood.",
      "Correct. RUQ impact plus a solid, blood-rich organ equals a serious internal bleed.",
    ],
    followUp: {
      prompt: "A blow to the LEFT upper quadrant — which organ bleeds?",
      choices: ["Spleen", "Liver", "Appendix"],
      answer: 0,
      why: "The spleen is the LUQ solid organ and a classic hidden bleeder.",
    },
    keyPoints: [
      {
        text: "Solid organs (liver, spleen, kidneys, pancreas) bleed; hollow ones leak → peritonitis",
        terms: ["solid", "hollow", "bleed", "leak", "periton"],
      },
      {
        text: "Liver mostly RUQ; spleen LUQ; appendix RLQ",
        terms: ["ruq", "luq", "rlq", "liver", "spleen", "quadrant"],
      },
    ],
  },
  {
    id: "pulses",
    topic: "circ",
    prompt: "In an unresponsive adult, you should check the pulse at the:",
    choices: [
      "Radial artery",
      "Brachial artery",
      "Carotid artery",
      "Dorsalis pedis artery",
    ],
    answer: 2,
    rationale:
      "Unresponsive adults and children get a carotid check; responsive patients get radial; infants get brachial; femoral is the shock and trauma backup. A weak or absent radial pulse in a living patient suggests low blood pressure.",
    why: [
      "Radial is for responsive patients — it disappears early as pressure falls.",
      "Brachial is the infant site, not the adult default.",
      "Correct. The carotid is the last pulse to go and the most reliable in an unresponsive adult.",
      "The foot pulse is a distal circulation check, not where you confirm life.",
    ],
    followUp: {
      prompt: "The radial pulse is weak or absent but he is awake and talking. Think:",
      choices: [
        "Normal variant",
        "Broken pulse ox",
        "Falling blood pressure — shock",
      ],
      answer: 2,
      why: "The radial disappears early as pressure falls — a weak radial in a living patient is a shock flag.",
    },
    keyPoints: [
      {
        text: "Unresponsive adult or child → carotid; awake → radial; infant → brachial",
        terms: ["carotid", "radial", "brachial", "unresponsive"],
      },
      {
        text: "A weak or absent radial while alive = low pressure — a shock clue",
        terms: ["weak", "absent", "shock", "low bp", "pressure", "fall"],
      },
    ],
  },
  {
    id: "receptors",
    topic: "body",
    prompt: "Stimulation of beta-2 receptors causes:",
    choices: [
      "Vasoconstriction",
      "An increased heart rate",
      "A drop in blood sugar",
      "Bronchodilation",
    ],
    answer: 3,
    rationale:
      "Alpha receptors constrict vessels and raise blood pressure; beta-1 speeds and strengthens the heart; beta-2 dilates the bronchioles. Epinephrine hits all three — which is why an EpiPen raises pressure and opens airways at once.",
    why: [
      "Squeezing the vessels is the alpha effect.",
      "Speeding the heart is beta-1 — the one beta blockers block.",
      "Adrenergic stimulation raises blood sugar if anything — it does not drop it.",
      "Correct. Beta-2 opens the lower airways — the receptor albuterol targets.",
    ],
    followUp: {
      prompt: "Beta blockers slow the heart by blocking:",
      choices: ["Alpha", "Beta-1", "Beta-2"],
      answer: 1,
      why: "Beta-1 is the cardiac receptor — blocking it drops rate, squeeze, and blood pressure.",
    },
    keyPoints: [
      {
        text: "Alpha = vasoconstriction and BP up; beta-1 = heart rate and contractility; beta-2 = bronchodilation",
        terms: ["alpha", "beta-1", "beta 1", "beta-2", "beta 2", "constrict", "bronchodil"],
      },
      {
        text: "Epinephrine hits all three — pressure up AND airways open",
        terms: ["epi", "all three", "epipen", "both"],
      },
    ],
  },
  {
    id: "brain-parts",
    topic: "body",
    prompt:
      "Breathing, heart rate, and blood pressure are controlled by which part of the brain?",
    choices: [
      "The cerebrum",
      "The cerebellum",
      "The brainstem",
      "The reticular activating system",
    ],
    answer: 2,
    rationale:
      "The brainstem — midbrain, pons, medulla — runs the life functions, which is why it is the most protected structure. The cerebrum handles speech, thought, memory, and senses; the cerebellum handles balance; the RAS gates consciousness.",
    why: [
      "The cerebrum is thought, speech, memory, and the senses — altered there means AMS, not apnea.",
      "The cerebellum coordinates balance and movement.",
      "Correct. Damage here stops breathing and circulation — it is immediately lethal.",
      "The RAS is the consciousness switch, not the vital-sign controller.",
    ],
    followUp: {
      prompt: "Slurred speech and one-sided weakness localize to the:",
      choices: ["Cerebrum", "Cerebellum", "Brainstem"],
      answer: 0,
      why: "Speech, thought, memory, senses, and movement commands live in the cerebrum. Balance is the cerebellum.",
    },
    keyPoints: [
      {
        text: "Brainstem (midbrain, pons, medulla) runs breathing, heart rate, BP — lethal if hit",
        terms: ["brainstem", "medulla", "pons", "breath", "vital"],
      },
      {
        text: "Cerebrum = speech/thought/memory/senses; cerebellum = balance; RAS = consciousness",
        terms: ["cerebrum", "cerebell", "ras", "balance", "conscious"],
      },
    ],
  },
  {
    id: "jvd-flat",
    topic: "body",
    prompt:
      "A semi-sitting trauma patient has flat, collapsed jugular veins. This finding suggests:",
    choices: [
      "Right-sided heart failure",
      "Cardiac tamponade",
      "Significant blood loss",
      "Tension pneumothorax",
    ],
    answer: 2,
    rationale:
      "Flat jugulars mean an empty tank — hemorrhage or severe dehydration. Distended jugulars (JVD) mean backup: right-heart failure, tamponade, or tension pneumothorax. Inspect the neck veins semi-upright.",
    why: [
      "Right-heart failure backs blood up and distends the neck veins.",
      "Tamponade blocks filling, so blood backs up — JVD, not flat veins.",
      "Correct. Collapsed jugulars in trauma mean the volume is gone — think bleeding.",
      "Tension pneumothorax also produces JVD by squeezing the great vessels.",
    ],
    followUp: {
      prompt: "JVD + one silent lung field + severe dyspnea =",
      choices: ["Hemorrhagic shock", "Tension pneumothorax", "Simple asthma"],
      answer: 1,
      why: "Backup signs plus a dead lung field is the tension pattern — pressure is squeezing the venous return.",
    },
    keyPoints: [
      {
        text: "Flat jugulars = an empty tank: bleeding or severe dehydration",
        terms: ["flat", "empty", "hypovolem", "blood loss", "tank"],
      },
      {
        text: "JVD = a backup: right-heart failure, tamponade, tension pneumothorax",
        terms: ["jvd", "distend", "backup", "tamponade", "tension"],
      },
    ],
  },
  {
    id: "burns",
    topic: "body",
    prompt:
      "A burn that is dry and leathery with little pain at its center is classified as:",
    choices: [
      "Superficial",
      "Partial thickness",
      "Full thickness",
      "A radiation burn",
    ],
    answer: 2,
    rationale:
      "Full thickness destroys all skin layers and the nerves with them, so the worst area can hurt the least. Superficial is red with no blisters; partial thickness reaches the dermis, blisters, and is very painful — often at the rim of a full-thickness burn.",
    why: [
      "Superficial burns are red and tender but never leathery.",
      "Partial thickness blisters and is intensely painful — the opposite of a numb center.",
      "Correct. Leathery, dry, and numb means every layer, nerves included, is gone.",
      "Radiation describes the burn source, not the depth you are being asked to classify.",
    ],
    followUp: {
      prompt: "Red, blistered, and screaming-painful is which depth?",
      choices: ["Superficial", "Partial thickness", "Full thickness"],
      answer: 1,
      why: "Blisters plus severe pain = partial thickness into the dermis. Full thickness destroys the nerves.",
    },
    keyPoints: [
      {
        text: "Full thickness = leathery, dry, nerve endings destroyed → least pain at the center",
        terms: ["leather", "nerve", "painless", "numb", "full"],
      },
      {
        text: "Superficial = red without blisters; partial = blisters and severe pain (often the rim)",
        terms: ["blister", "red", "partial", "rim", "superficial"],
      },
    ],
  },
  {
    id: "insulin-glucagon",
    topic: "body",
    prompt: "Which hormone lowers blood glucose?",
    choices: ["Glucagon", "Insulin", "Epinephrine", "Cortisol"],
    answer: 1,
    rationale:
      "Insulin moves sugar out of the blood into the cells; glucagon raises blood sugar. Both come from the pancreas. Normal glucose runs about 80–120, and under 80 is low — check it in anyone altered.",
    why: [
      "Glucagon does the opposite — it raises blood sugar from stored glycogen.",
      "Correct. Insulin drives glucose into the cells, dropping the blood level.",
      "Epinephrine mobilizes sugar for fight-or-flight — it raises glucose.",
      "Cortisol is a stress hormone that also raises blood sugar.",
    ],
    followUp: {
      prompt: "Both insulin and glucagon are made by the:",
      choices: ["Liver", "Thyroid", "Pancreas"],
      answer: 2,
      why: "The pancreas makes both; the liver stores the glycogen that glucagon unlocks.",
    },
    keyPoints: [
      {
        text: "Insulin lowers blood glucose (moves it into cells); glucagon raises it",
        terms: ["insulin", "glucagon", "lower", "raise", "cell"],
      },
      {
        text: "Normal glucose about 80–120; under 80 is low — check anyone altered",
        terms: ["80", "120", "low", "altered", "check"],
      },
    ],
  },
  {
    id: "shock-preg",
    topic: "move",
    prompt:
      "A patient who is 32 weeks pregnant shows signs of shock. She should be positioned:",
    choices: [
      "Supine with the legs elevated",
      "On her left side",
      "In the semi-Fowler position",
      "Flat supine",
    ],
    answer: 1,
    rationale:
      "At 20 weeks and beyond, the uterus can compress the vena cava when supine and cut venous return — supine hypotensive syndrome. Roll her left. For non-pregnant shock, use flat supine; raising the feet is no longer recommended.",
    why: [
      "Feet-up positioning is outdated, and supine is exactly what compresses her vena cava.",
      "Correct. Left lateral rolls the uterus off the vena cava and restores return.",
      "Semi-sitting is a breathing position, not the fix for gravid compression in shock.",
      "Flat supine is right for non-pregnant shock but dangerous this far into pregnancy.",
    ],
    followUp: {
      prompt: "What exactly does lying flat on her back do at 32 weeks?",
      choices: [
        "Raises her blood pressure",
        "Speeds up labor",
        "The uterus compresses the vena cava and cuts venous return",
      ],
      answer: 2,
      why: "Supine hypotensive syndrome — the gravid uterus pinches the vena cava. Roll her onto her left side.",
    },
    keyPoints: [
      {
        text: "20+ weeks supine → the uterus compresses the vena cava (supine hypotensive syndrome)",
        terms: ["vena cava", "compress", "20 week", "supine hypotensive", "pinch"],
      },
      {
        text: "Left lateral restores venous return; the feet-up trick is outdated",
        terms: ["left", "lateral", "roll", "return", "feet"],
      },
    ],
  },
  {
    id: "recovery",
    topic: "move",
    prompt:
      "An unresponsive overdose patient is breathing adequately with no suspected spinal injury. You should place him:",
    choices: [
      "In the recovery position, on his side",
      "Supine with an oropharyngeal airway",
      "Prone with the head turned",
      "In the High Fowler position",
    ],
    answer: 0,
    rationale:
      "Unresponsive plus adequate breathing plus no spine concern equals the recovery position — it keeps the tongue forward and lets vomit drain. A patient who needs ventilations stays supine so you can work the airway.",
    why: [
      "Correct. The lateral position protects the airway while he breathes on his own.",
      "Supine with an adjunct is the setup for a patient who needs bagging — his breathing is adequate.",
      "Prone is never a transport position for a compromised patient.",
      "Sitting an unresponsive patient upright does nothing for the airway and risks a slump.",
    ],
    followUp: {
      prompt: "Post-seizure patient, breathing fine, groggy. Position?",
      choices: ["Recovery position", "Supine and flat", "High Fowler"],
      answer: 0,
      why: "Post-ictal plus adequate breathing plus no spine concern = recovery position. If breathing fails, supine for the bag.",
    },
    keyPoints: [
      {
        text: "Recovery = unresponsive + breathing adequately + no spine concern; gravity drains vomit",
        terms: ["recovery", "side", "lateral", "vomit", "drain"],
      },
      {
        text: "Needs ventilations → stays supine so you can work the airway",
        terms: ["supine", "bag", "ventilat", "back"],
      },
    ],
  },
  {
    id: "restrain",
    topic: "move",
    prompt:
      "Before restraining a combative patient, your first consideration should be:",
    choices: [
      "Whether hypoxia, low glucose, or a head injury explains the behavior",
      "Positioning him prone so he cannot spit at the crew",
      "Whether two rescuers will be enough to hold him",
      "Applying the restraints now and reassessing at the hospital",
    ],
    answer: 0,
    rationale:
      "Combativeness can be a symptom — rule out hypoxia, hypoglycemia, and head injury first. When restraint is justified, use five people, supine only, then recheck ABCs and distal circulation, and chart situation, intervention, and outcome.",
    why: [
      "Correct. Treatable medical causes come before physical control.",
      "Prone restraint causes positional asphyxia — patients stay supine, always.",
      "The standard is five people — one per limb plus one — not two.",
      "Restraints demand continuous rechecks of ABCs and distal circulation, not a wait until arrival.",
    ],
    followUp: {
      prompt: "How many people does a safe restraint take?",
      choices: ["Two", "Five", "As many as are standing around"],
      answer: 1,
      why: "Five — one per limb plus one. Supine only, then keep rechecking ABCs and distal circulation.",
    },
    keyPoints: [
      {
        text: "First rule out hypoxia, low sugar, and head injury as the real cause",
        terms: ["hypox", "sugar", "glucose", "head injury", "cause", "medical"],
      },
      {
        text: "Five people, supine only, recheck circulation — chart situation, intervention, outcome",
        terms: ["five", "5", "supine", "recheck", "chart"],
      },
    ],
  },
  {
    id: "board-straps",
    topic: "move",
    prompt:
      "When securing a patient to a long backboard, which body part is strapped LAST?",
    choices: ["The torso", "The hips", "The legs", "The head"],
    answer: 3,
    rationale:
      "Strap the torso in an X, then the hips, then the legs, and secure the head last with blocks. If the body shifts before the head is fixed, the neck twists with it. On the log roll, the head-holder counts and everyone rolls as a unit.",
    why: [
      "The torso goes first — it anchors the body so nothing slides.",
      "The hips are second, locking the pelvis after the torso.",
      "The legs are third, ahead of only the head.",
      "Correct. The head is secured last so a shifting body cannot wrench the neck.",
    ],
    followUp: {
      prompt: "During the log roll, who calls the count?",
      choices: [
        "The provider at the feet",
        "Whoever is most senior",
        "The one holding the head",
      ],
      answer: 2,
      why: "The person holding C-spine owns the count so the head and body move as one unit.",
    },
    keyPoints: [
      {
        text: "Strap order: torso (X) → hips → legs → head LAST with blocks",
        terms: ["torso", "hip", "leg", "head last", "order", "x"],
      },
      {
        text: "Body is fixed first so a shift cannot twist the neck; the head-holder counts the roll",
        terms: ["shift", "twist", "neck", "count", "unit"],
      },
    ],
  },
  {
    id: "devices",
    topic: "move",
    prompt:
      "The best device for moving a patient with a suspected hip fracture off the floor without rolling her is:",
    choices: [
      "A stair chair",
      "A scoop stretcher",
      "A long backboard with a log roll",
      "A blanket drag",
    ],
    answer: 1,
    rationale:
      "The scoop splits in half and slides under from both sides — no rolling required, which is the whole point with a hip fracture. Stairs get the stair chair, water rescues get a backboard or Stokes, and everyday transport is the gurney.",
    why: [
      "A stair chair needs a patient who can sit — a broken hip cannot.",
      "Correct. The split scoop captures her without the roll that a board demands.",
      "The log roll is exactly the movement you are trying to avoid.",
      "Drags are for emergency moves under immediate threat, not a controlled lift.",
    ],
    followUp: {
      prompt: "When IS an emergency drag justified?",
      choices: [
        "Immediate danger — fire, traffic, gunfire",
        "Whenever the carry feels heavy",
        "When the patient prefers it",
      ],
      answer: 0,
      why: "Emergency moves accept spine risk only when staying kills faster — fire, threat, seconds on the clock.",
    },
    keyPoints: [
      {
        text: "Scoop splits in half — captures a no-roll patient (hip fracture) without rolling",
        terms: ["scoop", "split", "no roll", "without roll", "hip"],
      },
      {
        text: "Stairs = stair chair; water = board or Stokes; everyday = the gurney",
        terms: ["stair", "stokes", "gurney", "water", "match"],
      },
    ],
  },
  {
    id: "five-rights",
    topic: "meds",
    prompt:
      "Which of the following is one of the original five rights of medication administration?",
    choices: [
      "Right documentation",
      "Right indication",
      "Right response",
      "Right route",
    ],
    answer: 3,
    rationale:
      "The original five rights: right patient, medication, dose, route, and time. Documentation and response come after the drug is given — always chart name, dose, route, time, and the patient's response.",
    why: [
      "Documentation is essential but is a later addition, not one of the original five.",
      "Indication guides the decision to give, but it is not on the classic list.",
      "Response is what you reassess after administration.",
      "Correct. Route — oral, sublingual, IM, inhaled — is one of the original five.",
    ],
    followUp: {
      prompt: "\u201CRight time\u201D includes checking:",
      choices: [
        "The expiration date",
        "The pharmacy's hours",
        "When the patient last ate",
      ],
      answer: 0,
      why: "Time covers expiration, repeat intervals, and hold conditions — an expired med fails the right.",
    },
    keyPoints: [
      {
        text: "Five rights: patient, medication, dose, route, time",
        terms: ["patient", "medication", "dose", "route", "time", "five"],
      },
      {
        text: "After giving: chart name, dose, route, time, and the response",
        terms: ["chart", "response", "document", "after"],
      },
    ],
  },
  {
    id: "glucose",
    topic: "meds",
    prompt: "Oral glucose is contraindicated when the patient:",
    choices: [
      "Is a known type 1 diabetic",
      "Cannot swallow or protect the airway",
      "Ate a meal within the last hour",
      "Has a glucose reading of 60",
    ],
    answer: 1,
    rationale:
      "The gel is thick — an unconscious patient or one who cannot swallow will aspirate it. The green light is sugar under 80, conscious, able to swallow, one tube by mouth. Unresponsive hypoglycemics get IV dextrose from ALS or the ED.",
    why: [
      "Type 1 diabetics are exactly who this drug is for when they crash.",
      "Correct. No swallow or no airway protection means the gel goes into the lungs.",
      "A recent meal does not block the gel — the low reading is what matters.",
      "A glucose of 60 with an intact airway is the indication, not a contraindication.",
    ],
    followUp: {
      prompt: "Sugar 58, awake, swallows fine. The dose is:",
      choices: [
        "One tube of oral glucose",
        "Half a tube, then wait an hour",
        "IM glucagon — EMTs carry it everywhere",
      ],
      answer: 0,
      why: "One tube by mouth for the conscious hypoglycemic who can swallow — then recheck the sugar.",
    },
    keyPoints: [
      {
        text: "Green light: sugar under 80, conscious, able to swallow and protect the airway",
        terms: ["80", "conscious", "swallow", "awake", "protect"],
      },
      {
        text: "Cannot swallow or unresponsive = aspiration risk → IV dextrose at ALS or the ED",
        terms: ["aspirat", "unrespons", "dextrose", "als", "cannot"],
      },
    ],
  },
  {
    id: "asa",
    topic: "meds",
    prompt:
      "The correct prehospital aspirin dose for suspected ACS chest pain is:",
    choices: [
      "81 mg swallowed whole",
      "160–325 mg chewed",
      "325 mg swallowed whole with water",
      "650 mg chewed",
    ],
    answer: 1,
    rationale:
      "Chew 160–325 mg — two to four baby aspirin — so it absorbs fast. Aspirin makes platelets slippery so the clot cannot grow; it does not dissolve what is already there. Allergy is a hard stop, and kids do not get it (Reye's syndrome).",
    why: [
      "A single 81 mg swallowed whole is under-dosed and absorbs too slowly.",
      "Correct. 160–325 mg chewed is the fast-absorbing antiplatelet dose.",
      "Swallowing whole delays absorption when minutes matter — chewing is the point.",
      "650 mg exceeds the protocol dose without adding benefit.",
    ],
    followUp: {
      prompt: "Why chewed instead of swallowed whole?",
      choices: [
        "It tastes better",
        "Faster absorption when minutes matter",
        "It protects the stomach",
      ],
      answer: 1,
      why: "Chewing gets the antiplatelet effect on board fast during an evolving MI.",
    },
    keyPoints: [
      {
        text: "160–325 mg chewed (2–4 baby aspirin) for suspected cardiac chest pain",
        terms: ["160", "325", "chew", "baby"],
      },
      {
        text: "Makes platelets slippery so the clot cannot GROW; allergy is a hard stop; no kids (Reye's)",
        terms: ["platelet", "slippery", "grow", "allerg", "reye"],
      },
    ],
  },
  {
    id: "nitro-kill",
    topic: "meds",
    prompt: "Which finding contraindicates nitroglycerin administration?",
    choices: [
      "A systolic blood pressure of 104",
      "Chest pain rated 9 out of 10",
      "Sildenafil (Viagra) taken the previous evening",
      "A history of a prior heart attack",
    ],
    answer: 2,
    rationale:
      "Kill nitro for a systolic under 100, an erectile-dysfunction -fil drug within 24 hours, or a head injury — stacked vasodilators crash the pressure. Dose is 0.4 mg SL, blood pressure before each dose, every 5 minutes, maximum 3. Gloves on: it absorbs through skin.",
    why: [
      "104 is still triple digits — nitro is allowed, with a BP check before every dose.",
      "Severe pain is the reason to consider nitro, not a reason to withhold it.",
      "Correct. A -fil within 24 hours plus nitro can collapse the blood pressure.",
      "A prior MI makes ACS more likely — history is not a contraindication.",
    ],
    followUp: {
      prompt: "The nitro dosing rhythm is:",
      choices: [
        "0.4 mg sublingual, BP before each dose, every 5 minutes, max 3",
        "0.4 mg IM, one time only",
        "One tablet every minute until the pain stops",
      ],
      answer: 0,
      why: "Sublingual 0.4 mg, check the pressure before each dose, every 5 minutes, stop at 3 — or when SBP drops below 100 or the pain resolves.",
    },
    keyPoints: [
      {
        text: "Kills: systolic under 100, ED meds (-fil: Viagra/Cialis) within ~24–48 hours, head injury",
        terms: ["100", "fil", "viagra", "cialis", "24", "head"],
      },
      {
        text: "0.4 mg SL, BP before each dose, every 5 minutes, max 3; gloves — it absorbs through skin",
        terms: ["0.4", "sl", "5 min", "max 3", "glove", "three"],
      },
    ],
  },
  {
    id: "anaphylaxis",
    topic: "meds",
    prompt:
      "A patient stung by a bee has hives across his chest and audible wheezing. The best treatment is:",
    choices: [
      "An albuterol nebulizer alone",
      "0.3 mg epinephrine IM in the lateral thigh",
      "Oral diphenhydramine and reassessment",
      "High-flow oxygen only",
    ],
    answer: 1,
    rationale:
      "Two body systems — skin plus respiratory — after an exposure is anaphylaxis, and anaphylaxis gets epinephrine: adult 0.3 mg IM lateral thigh (peds 0.15). Simple asthma with no allergic picture gets albuterol instead.",
    why: [
      "Albuterol opens the airways but does nothing for the systemic reaction driving them shut.",
      "Correct. Hives plus wheeze equals two systems — that is the epi threshold.",
      "An oral antihistamine is far too slow for a reaction already in the airway.",
      "Oxygen supports him but does not stop the reaction — epi does.",
    ],
    followUp: {
      prompt: "What upgrades an allergic reaction to anaphylaxis?",
      choices: [
        "Any hives at all",
        "A known bee allergy",
        "Airway or shock involvement, or two-plus body systems",
      ],
      answer: 2,
      why: "Epi criteria: airway compromise, hypotension or shock, or two or more systems — here skin plus respiratory.",
    },
    keyPoints: [
      {
        text: "Anaphylaxis = airway involvement, shock or low BP, or two-plus body systems",
        terms: ["two system", "2 system", "airway", "shock", "systems"],
      },
      {
        text: "Adult epi 0.3 mg IM in the lateral thigh (peds 0.15); plain wheezing alone gets albuterol",
        terms: ["0.3", "thigh", "im", "0.15", "albuterol"],
      },
    ],
  },
  {
    id: "naloxone",
    topic: "meds",
    prompt:
      "Naloxone will reverse respiratory depression caused by which of the following?",
    choices: [
      "Alprazolam (Xanax)",
      "Alcohol",
      "Fentanyl",
      "Diazepam (Valium)",
    ],
    answer: 2,
    rationale:
      "Naloxone is an antagonist at opioid receptors only — it reverses heroin, fentanyl, oxycodone, morphine. It does nothing for alcohol or benzodiazepines. Prefer the intranasal route, and expect nausea and a possibly combative wake-up.",
    why: [
      "Xanax is a benzodiazepine — naloxone does not touch those receptors.",
      "Alcohol depression is not opioid-mediated — naloxone cannot reverse it.",
      "Correct. Fentanyl is an opioid, exactly what naloxone displaces.",
      "Valium is also a benzodiazepine — outside naloxone's reach.",
    ],
    followUp: {
      prompt: "The best field route for naloxone, per your protocols:",
      choices: [
        "Intranasal — the mucosa absorbs it, no needle, works while apneic",
        "An oral tablet",
        "IV push only",
      ],
      answer: 0,
      why: "Intranasal skips needles and works even when they are not breathing — and expect a rough wake-up.",
    },
    keyPoints: [
      {
        text: "Naloxone reverses opioids only — heroin, fentanyl, oxycodone, morphine",
        terms: ["opioid", "antagonist", "fentanyl", "heroin", "receptor"],
      },
      {
        text: "Useless for benzos or alcohol; benign if no opioid aboard; watch for the combative wake-up",
        terms: ["benzo", "alcohol", "benign", "combative", "wake"],
      },
    ],
  },
  {
    id: "albuterol",
    topic: "meds",
    prompt: "Albuterol relieves asthma symptoms by:",
    choices: [
      "Stimulating beta-2 receptors to dilate the bronchioles",
      "Blocking the release of histamine",
      "Thinning the mucus in the airways",
      "Constricting the bronchial blood vessels",
    ],
    answer: 0,
    rationale:
      "Albuterol is a beta-2 agonist — it relaxes the bronchiole muscle and opens the lower airway. The nebulizer runs on 6 L/min of oxygen with the liquid in the cup; an MDI must fire as the patient inhales, and kids get a spacer.",
    why: [
      "Correct. Beta-2 stimulation is bronchodilation — the wheeze opens up.",
      "Histamine blocking is antihistamine territory, not albuterol's mechanism.",
      "Albuterol relaxes airway muscle — it does not thin secretions.",
      "Vessel constriction is an alpha effect and not how a wheeze gets better.",
    ],
    followUp: {
      prompt: "The nebulizer runs on oxygen at:",
      choices: ["2 L/min", "6 L/min", "15 L/min"],
      answer: 1,
      why: "The small-volume nebulizer runs about 6 L/min — enough to mist the liquid continuously into the mask.",
    },
    keyPoints: [
      {
        text: "Albuterol = beta-2 agonist → bronchodilation for asthma and wheezing",
        terms: ["beta-2", "beta 2", "bronchodil", "relax", "open"],
      },
      {
        text: "SVN at 6 L/min; an MDI must fire on the inhale (use a spacer for kids)",
        terms: ["6", "svn", "mdi", "spacer", "inhale"],
      },
    ],
  },
  {
    id: "emt-list",
    topic: "meds",
    prompt:
      "Which of the following medications is NOT within the standard EMT scope of practice?",
    choices: [
      "Aspirin",
      "Oral glucose",
      "Patient-assisted nitroglycerin",
      "IV dextrose",
    ],
    answer: 3,
    rationale:
      "The EMT list is aspirin, nitroglycerin, oral glucose, epinephrine, naloxone, and albuterol — with Tylenol or Benadryl only if protocol specifically adds them. IV medications, intubation, and IO access belong to paramedics.",
    why: [
      "Aspirin for suspected ACS is a core EMT medication.",
      "Oral glucose for the conscious hypoglycemic is on the EMT list.",
      "Assisting a patient's own prescribed nitro is EMT scope.",
      "Correct. Anything through an IV — including dextrose — is ALS territory.",
    ],
    followUp: {
      prompt: "Grandma offers her own nitro for your patient's chest pain. You:",
      choices: [
        "Use it — same drug",
        "Decline — assist only with the PATIENT's own prescription",
        "Give half a tablet to be safe",
      ],
      answer: 1,
      why: "Assisted meds must belong to the patient. Someone else's prescription is off-limits.",
    },
    keyPoints: [
      {
        text: "The EMT six: aspirin, nitro, oral glucose, epinephrine, naloxone, albuterol",
        terms: ["six", "aspirin", "nitro", "glucose", "epi", "naloxone", "albuterol"],
      },
      {
        text: "IV meds, intubation, IO = paramedic; OTC extras only if protocol writes them in",
        terms: ["iv", "paramedic", "als", "protocol", "scope"],
      },
    ],
  },
  {
    id: "ventilate-first",
    topic: "assess",
    prompt:
      "An overdose patient is breathing 5 times per minute with shallow effort. Naloxone is in your hand. Your FIRST action is to:",
    choices: [
      "Begin bag-valve-mask ventilations",
      "Administer the naloxone intranasally right away",
      "Apply a non-rebreather at 15 L/min",
      "Check a blood glucose level",
    ],
    answer: 0,
    rationale:
      "Airway and breathing come before medications — ventilate the inadequate breather first, then give the drug. On the exam, when one option fixes the ABCs and another is a medication, the ABC fix wins.",
    why: [
      "Correct. Five shallow breaths a minute is failed ventilation — bag him now.",
      "Naloxone takes minutes to work; his brain needs oxygen during those minutes.",
      "A mask cannot ventilate a patient who is barely moving air on his own.",
      "Glucose is a fine later check, but not while ventilation is failing.",
    ],
    followUp: {
      prompt: "You are bagging while your partner preps the naloxone. That is:",
      choices: [
        "Wrong — one intervention at a time",
        "Right — ventilation continues while the drug is readied",
        "Wrong — naloxone replaces the bagging",
      ],
      answer: 1,
      why: "Ventilate AND prepare the drug in parallel — the bag never stops for the med.",
    },
    keyPoints: [
      {
        text: "ABCs before meds: inadequate breathing → BVM first, always",
        terms: ["abc", "first", "bvm", "bag", "ventilat", "before"],
      },
      {
        text: "Naloxone takes minutes to work — the brain needs oxygen during every one of them",
        terms: ["minute", "brain", "oxygen", "while", "hypox"],
      },
    ],
  },
  {
    id: "chart",
    topic: "assess",
    prompt:
      "You suspect abuse. Which statement belongs on your PCR?",
    choices: [
      "\"The husband obviously abused her\"",
      "Patient states, \"My husband hit me,\" with a 4 cm purple bruise noted on the left cheek",
      "\"The patient appeared to be a drunk\"",
      "\"Injuries inconsistent with story — husband at fault\"",
    ],
    answer: 1,
    rationale:
      "Charts hold objective observations and the patient's words in quotes — never conclusions about guilt. Reporting a suspicion of abuse through the mandatory channel is required and is not defamation; defamation is stating a false fact as fact.",
    why: [
      "That is an accusation of guilt, not an observation — it does not belong on a chart.",
      "Correct. A measured, described finding plus a direct quote — objective and verifiable.",
      "Character judgments have no place on a medical record.",
      "Assigning fault is for investigators — you document findings and file the report.",
    ],
    followUp: {
      prompt: "Reporting your abuse suspicion to the required authority is:",
      choices: [
        "A defamation risk — stay quiet",
        "Mandatory, and protected when made in good faith",
        "Optional if the patient denies it",
      ],
      answer: 1,
      why: "Mandatory reporting is required and legally protected. Defamation is stating a FALSE fact as fact — not filing a required report.",
    },
    keyPoints: [
      {
        text: "Chart objective findings — size, color, location — plus the patient's words in quotes",
        terms: ["objective", "quote", "describ", "measur", "words"],
      },
      {
        text: "No guilt conclusions on the PCR; suspicions go through the mandatory reporting channel",
        terms: ["guilt", "conclusion", "mandatory", "report", "accus"],
      },
    ],
  },
];

const QUESTIONS_V2: Question[] = [
  {
    id: "v2-life-moro",
    topic: "life",
    prompt:
      "You bump a 3-week-old's bassinet. Both arms fly out, fingers spread, then the baby cries. Which reflex is that?",
    choices: ["Rooting", "Palmar grasp", "Moro", "Sucking"],
    answer: 2,
    rationale:
      "Moro is the startle: arms abduct, fingers fan, then the infant often cries. Rooting turns toward a cheek touch; palmar grasp squeezes a finger; sucking triggers at the lips.",
    why: [
      "Rooting is a head turn toward a cheek stroke — a feeding cue, not a startle.",
      "Palmar grasp is a squeeze when you put a finger in the palm.",
      "Correct. Arms out plus a cry after a sudden movement is Moro.",
      "Sucking starts when something touches the lips or the roof of the mouth.",
    ],
    followUp: {
      prompt: "Which of these is also a normal newborn reflex?",
      choices: ["Babinski only after age 2", "Sucking", "Adult-pattern startle"],
      answer: 1,
      why: "Newborns should have Moro, palmar grasp, rooting, and sucking. A missing Moro is the abnormal finding.",
    },
    keyPoints: [
      {
        text: "Moro = startle with arms wide after a sudden movement or drop",
        terms: ["moro", "startle", "arms", "abduct"],
      },
      {
        text: "Do not mix it with rooting (cheek) or palmar grasp (hand squeeze)",
        terms: ["root", "palmar", "grasp", "cheek"],
      },
    ],
  },
  {
    id: "v2-life-fontanelle-age",
    topic: "life",
    prompt:
      "A well-appearing 14-month-old still has a soft anterior fontanelle. What does that tell you?",
    choices: [
      "It should have closed by 6 months — suspect hydrocephalus",
      "That is still in the normal window",
      "Only the posterior fontanelle should still be open",
      "Fontanelles stay open until school age",
    ],
    answer: 1,
    rationale:
      "The anterior fontanelle closes around 9–18 months, so 14 months can still be open. The posterior usually closes by about 3 months.",
    why: [
      "Six months is too early to call an open anterior fontanelle pathologic.",
      "Correct. Anterior closure is 9–18 months — 14 months can still be open.",
      "The posterior, not the anterior, closes first — around 3 months.",
      "They are not still open in school-age children.",
    ],
    followUp: {
      prompt: "A 5-month-old has a wide-open posterior fontanelle. That is:",
      choices: [
        "Expected — posterior closes at 12 months",
        "Late — posterior usually closes by about 3 months",
        "Proof of dehydration",
      ],
      answer: 1,
      why: "Posterior first (about 3 months). An open posterior at 5 months is late and worth flagging, not a dehydration sign by itself.",
    },
    keyPoints: [
      {
        text: "Anterior fontanelle closes about 9–18 months",
        terms: ["9", "18", "anterior"],
      },
      {
        text: "Posterior closes first, around 3 months",
        terms: ["posterior", "3 month", "three"],
      },
    ],
  },
  {
    id: "v2-life-nose-breather",
    topic: "life",
    prompt:
      "A 4-month-old has a stuffy nose and is working harder to breathe. Why does that matter more than in an adult?",
    choices: [
      "Infants prefer to breathe through the nose",
      "Infants have no diaphragm",
      "Their alveoli do not open until age 1",
      "They cannot cough",
    ],
    answer: 0,
    rationale:
      "Young infants are preferential nose breathers. Nasal congestion can obstruct a large share of their airway.",
    why: [
      "Correct. A blocked nose is a blocked airway in a young infant.",
      "They have a diaphragm — they depend on it more than adults do.",
      "Alveoli are present and working from birth.",
      "Infants can cough; the issue here is nasal obstruction.",
    ],
    followUp: {
      prompt: "What else makes a little swelling dangerous in an infant airway?",
      choices: [
        "The airway is already narrow and cone-shaped",
        "They have extra cartilaginous rings",
        "The epiglottis sits lower than an adult's",
      ],
      answer: 0,
      why: "A narrow cone plus a large tongue means millimeters of swelling steal a big fraction of the opening.",
    },
    keyPoints: [
      {
        text: "Young infants are preferential nose breathers — congestion is an airway problem",
        terms: ["nose", "nasal", "congest", "prefer"],
      },
      {
        text: "The airway is narrow and cone-shaped, so small swelling closes it fast",
        terms: ["narrow", "cone", "swell"],
      },
    ],
  },
  {
    id: "v2-life-elderly-gag",
    topic: "life",
    prompt:
      "An 82-year-old with a recent stroke now has a weak cough. What are you most worried about?",
    choices: [
      "Faster metabolism and fever",
      "Aspiration and pneumonia",
      "A sudden increase in vital capacity",
      "Hyperactive gag reflex",
    ],
    answer: 1,
    rationale:
      "Aging plus a stroke weakens cough and gag, so food and secretions go the wrong way — aspiration pneumonia is the risk.",
    why: [
      "Metabolism slows with age; that is not the airway concern here.",
      "Correct. Weak cough and gag let material into the lungs.",
      "Vital capacity shrinks with age, it does not jump up.",
      "The gag gets weaker, not stronger.",
    ],
    followUp: {
      prompt: "Aging lungs also have:",
      choices: [
        "More elasticity and more surface area",
        "Less elasticity, larger alveoli, less surface area",
        "A larger residual cough reserve",
      ],
      answer: 1,
      why: "Less elastic recoil, bigger alveoli, less surface for gas exchange — plus weaker protective reflexes.",
    },
    keyPoints: [
      {
        text: "Weaker cough and gag in older adults raise aspiration and pneumonia risk",
        terms: ["cough", "gag", "aspirat", "pneumonia"],
      },
      {
        text: "Stroke or sedation on top of that makes the risk worse",
        terms: ["stroke", "sedat", "weak"],
      },
    ],
  },
  {
    id: "v2-terms-brady",
    topic: "terms",
    prompt: "Bradypnea means:",
    choices: [
      "Fast breathing",
      "Difficult breathing",
      "Slow breathing",
      "No breathing",
    ],
    answer: 2,
    rationale:
      "Brady- is slow and -pnea is breathing. Tachy- is fast, dys- is difficulty, a- is without.",
    why: [
      "Fast is tachypnea.",
      "Difficult is dyspnea.",
      "Correct. Brady- + pnea = slow breathing.",
      "No breathing is apnea.",
    ],
    followUp: {
      prompt: "Hypotension means:",
      choices: ["High blood pressure", "Low blood pressure", "No pulse"],
      answer: 1,
      why: "Hypo- = low. Hyper- = high. A- would be without.",
    },
    keyPoints: [
      {
        text: "brady- = slow, tachy- = fast, dys- = difficult, a-/an- = without",
        terms: ["brady", "tachy", "dys", "slow", "fast"],
      },
      {
        text: "hypo- = low, hyper- = high",
        terms: ["hypo", "hyper", "low", "high"],
      },
    ],
  },
  {
    id: "v2-terms-speech-stroke",
    topic: "terms",
    prompt:
      "After a stroke, the patient understands you but cannot form words. The correct term is:",
    choices: ["Dysphagia", "Aphasia", "Dysplasia", "Apnea"],
    answer: 1,
    rationale:
      "Phasia (s) is speech. Aphasia is a speech or language deficit. Dysphagia (g) is swallowing.",
    why: [
      "Dysphagia is difficulty swallowing — watch the g.",
      "Correct. Aphasia is the speech/language problem.",
      "Dysplasia is abnormal cell growth, not a stroke finding you chart this way.",
      "Apnea is not breathing.",
    ],
    followUp: {
      prompt: "A patient who coughs and chokes on water most likely has:",
      choices: ["Aphasia", "Dysphagia", "Dysplasia"],
      answer: 1,
      why: "Choking on liquids is swallowing — dysphagia. Mixing these on a chart sends the hospital after the wrong problem.",
    },
    keyPoints: [
      {
        text: "phasia (s) = speech; phagia (g) = swallowing",
        terms: ["speech", "swallow", "phasia", "phagia"],
      },
      {
        text: "Chart the right one — stroke care and aspiration precautions are different problems",
        terms: ["chart", "stroke", "aspirat"],
      },
    ],
  },
  {
    id: "v2-terms-distal",
    topic: "terms",
    prompt:
      "A laceration sits just above the left wrist. Relative to the elbow, that wound is:",
    choices: ["Proximal", "Distal", "Medial", "Superior"],
    answer: 1,
    rationale:
      "Distal means farther from the trunk. The wrist is farther out than the elbow.",
    why: [
      "Proximal is toward the trunk — the elbow is proximal to the wrist.",
      "Correct. Wrist is distal to the elbow.",
      "Medial is toward the midline, not along the limb.",
      "Superior is toward the head — not how you locate a forearm wound vs the elbow.",
    ],
    followUp: {
      prompt: "The patient's right is:",
      choices: [
        "Your right as you face them",
        "Their right in anatomic position",
        "Always the side of the injury",
      ],
      answer: 1,
      why: "Left and right are the patient's, standing in anatomic position — never mirrored from your view.",
    },
    keyPoints: [
      {
        text: "Distal = farther from the core; proximal = closer to it",
        terms: ["distal", "proximal", "core", "trunk"],
      },
      {
        text: "Left and right are always the patient's",
        terms: ["patient", "their", "anatomic"],
      },
    ],
  },
  {
    id: "v2-terms-fowler",
    topic: "terms",
    prompt:
      "A CHF patient is sitting bolt upright, leaning on the stretcher. That position is:",
    choices: ["Supine", "Prone", "High Fowler", "Trendelenburg"],
    answer: 2,
    rationale:
      "High Fowler is sitting nearly upright — the working position for respiratory distress. Supine is flat on the back; prone is face down.",
    why: [
      "Supine is flat on the back — wrong for wet lungs.",
      "Prone is face down and is not a transport position for this patient.",
      "Correct. Sitting nearly upright is High Fowler.",
      "Trendelenburg (head down) is not the move for pulmonary edema.",
    ],
    followUp: {
      prompt: "A non-pregnant shock patient is usually transported:",
      choices: ["High Fowler", "Prone", "Supine"],
      answer: 2,
      why: "Shock = flat supine. Breathing trouble sits up. Pregnant late-term shock is the left-lateral exception.",
    },
    keyPoints: [
      {
        text: "High Fowler = sitting upright for respiratory distress",
        terms: ["fowler", "upright", "sit"],
      },
      {
        text: "Shock (not late pregnancy) = supine; never prone for a compromised patient",
        terms: ["supine", "shock", "prone"],
      },
    ],
  },
  {
    id: "v2-docs-risks",
    topic: "docs",
    prompt:
      "An alert, oriented adult refuses transport after you explain the risks. The chart must show:",
    choices: [
      "That you talked him into going",
      "That you explained the risks and he still refused",
      "Only his signature — nothing else",
      "A diagnosis proving he is fine",
    ],
    answer: 1,
    rationale:
      "Informed refusal means you documented capacity, the risks you explained, and that he declined anyway. A signature alone is not the whole story.",
    why: [
      "You cannot force a capacitated adult. Document the refusal.",
      "Correct. Risks explained + capacity + refusal belong on the PCR.",
      "A signature without the narrative is a weak chart.",
      "You do not clear him medically by writing a diagnosis.",
    ],
    followUp: {
      prompt: "A 15-year-old refuses. Who signs?",
      choices: [
        "The teen, if he sounds mature",
        "A parent or legal guardian",
        "Any adult in the house",
      ],
      answer: 1,
      why: "Minors need the legally responsible person. A roommate or neighbor is not enough.",
    },
    keyPoints: [
      {
        text: "Informed refusal = capacity + risks explained + the decision, all charted",
        terms: ["risk", "capacity", "refus", "informed"],
      },
      {
        text: "Minors need a parent or guardian; get a witness when you can",
        terms: ["guardian", "minor", "parent", "witness"],
      },
    ],
  },
  {
    id: "v2-docs-addendum",
    topic: "docs",
    prompt:
      "You notice a wrong time stamp after the PCR is already submitted. You:",
    choices: [
      "Delete the PCR and rewrite it",
      "White out the time on a printed copy",
      "File an addendum",
      "Ignore it — submitted charts cannot change",
    ],
    answer: 2,
    rationale:
      "After submission, corrections go in as an addendum. The original stays; you add the fix and own it.",
    why: [
      "Deleting and rewriting looks like a cover-up.",
      "Obliterating an entry is the same problem on paper.",
      "Correct. Addendum keeps the original and adds the correction.",
      "You do correct it — just not by rewriting history.",
    ],
    followUp: {
      prompt: "On a paper PCR, a wrong word is still in front of you. You:",
      choices: [
        "Single line through it, initial, write the correction",
        "Scribble until it is unreadable",
        "Use correction fluid",
      ],
      answer: 0,
      why: "One line, initials, original still legible. That is the legal standard.",
    },
    keyPoints: [
      {
        text: "After submission, fix errors with an addendum — do not rewrite the original",
        terms: ["addendum", "submit", "original"],
      },
      {
        text: "On paper: one line, initials, keep it readable",
        terms: ["line", "initial", "legible", "readable"],
      },
    ],
  },
  {
    id: "v2-docs-abandon",
    topic: "docs",
    prompt:
      "You wheel a patient into the ED, park the stretcher in the hall, and leave without telling anyone. That is:",
    choices: [
      "A complete transfer of care",
      "Abandonment",
      "Acceptable if the PCR is done",
      "Only a problem if the patient codes",
    ],
    answer: 1,
    rationale:
      "Abandonment is ending care without handing the patient to someone of equal or higher training. A named nurse or physician has to take the patient.",
    why: [
      "Transfer requires a person who accepts care — not an empty hallway.",
      "Correct. No named handoff is abandonment.",
      "Paperwork does not replace a verbal handoff.",
      "Harm is not required for it to be abandonment.",
    ],
    followUp: {
      prompt: "The line that proves the handoff is complete is:",
      choices: [
        "Arrived at ED 14:22",
        "Care transferred to RN Patel",
        "Patient comfortable on arrival",
      ],
      answer: 1,
      why: "Name the clinician who assumed care. Time of arrival is not a transfer.",
    },
    keyPoints: [
      {
        text: "Abandonment = stopping care without a proper handoff",
        terms: ["abandon", "handoff", "transfer"],
      },
      {
        text: "Chart the name of the person who took the patient",
        terms: ["name", "rn", "nurse", "who"],
      },
    ],
  },
  {
    id: "v2-docs-trauma-dest",
    topic: "docs",
    prompt:
      "A stable, talking patient was ejected from a highway rollover. Closest small ER is 6 minutes; a trauma center is 14. You go:",
    choices: [
      "The small ER — closest always wins",
      "The trauma center — capability beats a few extra minutes here",
      "Whichever the family requests",
      "Home, since he is talking",
    ],
    answer: 1,
    rationale:
      "Significant mechanism (ejection, rollover) belongs at a trauma center when the patient can make the extra minutes. Arrests get the absolute closest.",
    why: [
      "Closest is for arrests and when the patient will not survive the extra trip.",
      "Correct. Ejection is a trauma-center mechanism.",
      "Family preference does not override destination policy.",
      "Talking does not cancel a major mechanism.",
    ],
    followUp: {
      prompt: "Pulseless in the front yard. Destination?",
      choices: [
        "The closest ED",
        "The farthest specialty hospital",
        "Wait for the medical examiner",
      ],
      answer: 0,
      why: "Cardiac arrest goes to the closest appropriate ED — do not bypass for a specialty center.",
    },
    keyPoints: [
      {
        text: "Destination = closest most appropriate facility",
        terms: ["appropriate", "closest", "facility"],
      },
      {
        text: "Ejection/trauma can bypass a closer ER; arrest cannot",
        terms: ["eject", "trauma", "arrest", "bypass"],
      },
    ],
  },
  {
    id: "v2-assess-laceration",
    topic: "assess",
    prompt: "In DCAP-BTLS, the L stands for:",
    choices: ["Lungs", "Lacerations", "Liver", "Lateral"],
    answer: 1,
    rationale:
      "BTLS is burns, tenderness, lacerations, swelling. Lacerations are cuts through the skin.",
    why: [
      "Lungs are assessed in breathing, not in that letter.",
      "Correct. L = lacerations.",
      "Liver lives in the abdominal exam, not that acronym letter.",
      "Lateral is a direction word, not a DCAP-BTLS finding.",
    ],
    followUp: {
      prompt: "A scrape that took off the top skin layers is a:",
      choices: ["Contusion", "Abrasion", "Puncture"],
      answer: 1,
      why: "Abrasion = scrape. Contusion = bruise. Puncture = hole.",
    },
    keyPoints: [
      {
        text: "DCAP-BTLS: deformities, contusions, abrasions, punctures, burns, tenderness, lacerations, swelling",
        terms: ["lacerat", "dcap", "btls", "abras"],
      },
      {
        text: "Look and feel every region — tenderness is a palpation finding",
        terms: ["tender", "palp", "feel"],
      },
    ],
  },
  {
    id: "v2-assess-pupils-head",
    topic: "assess",
    prompt:
      "After a fall, one pupil is large and sluggish, the other is midsize and reactive. You should think:",
    choices: [
      "Normal variant — pupils are often unequal",
      "Possible brain herniation or eye trauma on the large side",
      "Classic opioid toxidrome",
      "Low blood sugar",
    ],
    answer: 1,
    rationale:
      "Unequal or blown pupils after trauma point to rising pressure or globe injury. Opioids pinpoint both pupils.",
    why: [
      "A new unequal pair after trauma is not dismissed as normal.",
      "Correct. Blown or sluggish on one side is a brain or globe problem until proven otherwise.",
      "Opioids make both pupils pinpoint.",
      "Hypoglycemia alters mentation; it does not classically blow one pupil.",
    ],
    followUp: {
      prompt: "PERRL means the pupils are:",
      choices: [
        "Pale, empty, round, reactive, lazy",
        "Equal, round, reactive to light",
        "Pinpoint, equal, red, reactive, large",
      ],
      answer: 1,
      why: "Pupils Equal, Round, Reactive to Light — that is the normal exam you are comparing against.",
    },
    keyPoints: [
      {
        text: "Unequal or blown pupil after trauma = pressure or globe injury until proven otherwise",
        terms: ["unequal", "blown", "herniat", "trauma"],
      },
      {
        text: "Opioids pinpoint both; stimulants dilate both",
        terms: ["pinpoint", "opioid", "dilat", "stimulant"],
      },
    ],
  },
  {
    id: "v2-assess-implied",
    topic: "assess",
    prompt:
      "An unresponsive diabetic is on the kitchen floor. No family. You treat under:",
    choices: [
      "Expressed consent",
      "Informed refusal",
      "Implied consent",
      "A signed DNR you have not seen",
    ],
    answer: 2,
    rationale:
      "An emergency plus no capacity equals implied consent — a reasonable person would want care.",
    why: [
      "Expressed consent needs an alert patient who agrees.",
      "He cannot refuse right now — he has no capacity.",
      "Correct. Unresponsive + emergency = implied consent.",
      "You cannot honor a DNR you have not been shown.",
    ],
    followUp: {
      prompt: "He wakes, is oriented ×4, and refuses the hospital. Now you:",
      choices: [
        "Force transport — implied consent still applies",
        "Treat it as a new decision and document an informed refusal if he has capacity",
        "Leave without charting",
      ],
      answer: 1,
      why: "Capacity restored means he can refuse. Reassess, explain risks, chart it.",
    },
    keyPoints: [
      {
        text: "No capacity + emergency = implied consent",
        terms: ["implied", "unrespons", "capacity", "emergency"],
      },
      {
        text: "Once he is oriented and understands the risks, he can refuse",
        terms: ["oriented", "refus", "understand", "capacity"],
      },
    ],
  },
  {
    id: "v2-assess-infant-pulse",
    topic: "assess",
    prompt: "Where do you check a pulse on a 6-month-old?",
    choices: [
      "Carotid",
      "Radial",
      "Brachial",
      "Dorsalis pedis only",
    ],
    answer: 2,
    rationale:
      "Infants under 1 year: brachial pulse on the inside of the upper arm. The neck is short and soft — carotid pressure can collapse the airway.",
    why: [
      "Carotid is for unresponsive adults and children, not routine infants.",
      "Radial is the awake-adult site.",
      "Correct. Brachial for infants under 1 year.",
      "A foot pulse can be a CSM check, not the life-check site.",
    ],
    followUp: {
      prompt: "Awake 40-year-old, routine vitals. Pulse site?",
      choices: ["Carotid", "Radial", "Femoral"],
      answer: 1,
      why: "If they are awake, use the radial. Save the carotid for unresponsive adults and children.",
    },
    keyPoints: [
      {
        text: "Infant under 1 year → brachial",
        terms: ["brachial", "infant", "arm"],
      },
      {
        text: "Awake adult → radial; unresponsive adult or child → carotid",
        terms: ["radial", "carotid", "awake", "unresponsive"],
      },
    ],
  },
  {
    id: "v2-reassess-clock",
    topic: "reassess",
    prompt:
      "Your chest-pain patient is now pale, sweaty, and BP is 82/50. How often do you reassess?",
    choices: [
      "Every 15 minutes",
      "Every 5 minutes",
      "Once on arrival at the ED",
      "Only after each medication",
    ],
    answer: 1,
    rationale:
      "Unstable or critical patients get a full reassess about every 5 minutes. Stable is about every 15. He just became unstable.",
    why: [
      "15 minutes is the stable clock — he is not stable.",
      "Correct. Shocky and hypotensive = every 5.",
      "You do not wait for the ED to notice a crash.",
      "Meds get rechecked, but the whole patient is on a 5-minute clock now.",
    ],
    followUp: {
      prompt: "Why do you need at least two vital-sign sets?",
      choices: [
        "Protocol paperwork only",
        "One set is a snapshot; two make a trend",
        "The machine is often wrong the first time",
      ],
      answer: 1,
      why: "A single BP is a moment. A second set tells you if he is sliding.",
    },
    keyPoints: [
      {
        text: "Stable ≈ every 15 minutes; unstable/critical ≈ every 5",
        terms: ["15", "5", "five", "unstable"],
      },
      {
        text: "A change in condition resets the clock — do not stay on 15 after he crashes",
        terms: ["change", "crash", "clock", "reset"],
      },
    ],
  },
  {
    id: "v2-reassess-csm",
    topic: "reassess",
    prompt:
      "Twenty minutes after you splint a forearm, the fingers are pale and the patient says they are numb. You:",
    choices: [
      "Leave it — numbness is expected",
      "Take the splint off and abandon immobilization",
      "Loosen or adjust, then recheck distal CSM",
      "Add a second bandage tighter",
    ],
    answer: 2,
    rationale:
      "Swelling can turn a splint into a tourniquet. Loosen, readjust, and recheck circulation, sensation, and movement. The bone still needs support.",
    why: [
      "New numbness is a warning, not a normal splint finding.",
      "You still immobilize — you just fix the constriction.",
      "Correct. Adjust and recheck CSM.",
      "Tighter makes the problem worse.",
    ],
    followUp: {
      prompt: "CSM stands for:",
      choices: [
        "Circulation, sensation, movement",
        "Color, size, moisture",
        "Cap refill, systolic, MAP",
      ],
      answer: 0,
      why: "Pulse or cap refill, feeling, and wiggle — distal to every splint, every pass.",
    },
    keyPoints: [
      {
        text: "New numbness, tingling, or pale fingers = recheck the splint now",
        terms: ["numb", "pale", "tingl", "splint"],
      },
      {
        text: "Adjust it and recheck CSM — do not abandon immobilization",
        terms: ["csm", "adjust", "loosen", "circulation"],
      },
    ],
  },
  {
    id: "v2-reassess-rosc-bvm",
    topic: "reassess",
    prompt:
      "During CPR you feel a carotid pulse. The patient is still not breathing. Next?",
    choices: [
      "Keep compressing — pulses during CPR are fake",
      "Stop compressions and bag him",
      "Put him in the recovery position",
      "Wait 2 minutes and recheck",
    ],
    answer: 1,
    rationale:
      "A real pulse means stop compressions. No breathing means start ventilations. Recovery position needs adequate breathing.",
    why: [
      "Once you confirm a pulse, you do not keep crushing a beating heart.",
      "Correct. ROSC without breathing = BVM.",
      "Recovery position is for the breathing, groggy patient.",
      "You do not wait — he needs air now.",
    ],
    followUp: {
      prompt: "Pulse and adequate breathing both return. You:",
      choices: [
        "Restart CPR to be safe",
        "Reassess ABCs and watch for rearrest",
        "Remove oxygen immediately",
      ],
      answer: 1,
      why: "ROSC patients rearrest. Stay on mental status, ABCs, and oxygen as indicated.",
    },
    keyPoints: [
      {
        text: "Pulse back = stop compressions; still not breathing = ventilate",
        terms: ["stop", "compress", "ventilat", "bag", "rosc"],
      },
      {
        text: "Return of pulse is not return of breathing",
        terms: ["not", "breath", "pulse"],
      },
    ],
  },
  {
    id: "v2-reassess-pass",
    topic: "reassess",
    prompt: "A proper reassessment pass includes:",
    choices: [
      "Only a new blood pressure",
      "Mental status, ABCs, a full set of vitals, and every intervention",
      "A full SAMPLE history again",
      "Just the last drug you gave",
    ],
    answer: 1,
    rationale:
      "Each pass is mental status + ABCs + new vitals + a check of everything you did. You do not re-interview SAMPLE unless something changed.",
    why: [
      "One number is not a reassessment.",
      "Correct. That is the full pass.",
      "History is not repeated from scratch each time.",
      "Meds count, but so do tourniquets, dressings, and splints.",
    ],
    followUp: {
      prompt: "Which intervention check belongs every pass?",
      choices: [
        "Only oxygen devices",
        "Tourniquets, dressings, splints, meds, restraints",
        "None until the hospital",
      ],
      answer: 1,
      why: "If you did it, you recheck it — bleeding control, CSM, drug response, restraint circulation.",
    },
    keyPoints: [
      {
        text: "Pass = mentation + ABCs + full vitals + every intervention",
        terms: ["mental", "abc", "vitals", "intervention"],
      },
      {
        text: "Do not redo SAMPLE unless the story changed",
        terms: ["sample", "history", "unless"],
      },
    ],
  },
  {
    id: "v2-resp-infant-slow",
    topic: "resp",
    prompt:
      "A 3-month-old is breathing 18 times a minute, looking tired. That rate is:",
    choices: [
      "Normal for an infant",
      "Too slow — infants normally run about 30–60",
      "Too fast — bag immediately",
      "Only a problem if the sats are 100%",
    ],
    answer: 1,
    rationale:
      "Infant normal is about 30–60. Eighteen in a tired 3-month-old is bradypnea — treat the ventilation, not the number alone.",
    why: [
      "Adult 12–20 is not the infant range.",
      "Correct. 18 is below the infant floor.",
      "You may need to assist, but the finding is slow, not fast.",
      "A pretty sat does not fix a rate of 18 in an infant.",
    ],
    followUp: {
      prompt: "Normal adult respiratory rate is:",
      choices: ["8–10", "12–20", "30–60"],
      answer: 1,
      why: "Adults 12–20, children 12–40, infants 30–60. Younger is faster.",
    },
    keyPoints: [
      {
        text: "Infants 30–60, children 12–40, adults 12–20",
        terms: ["30", "60", "12", "20", "40"],
      },
      {
        text: "A tired infant at 18 is too slow — that is a ventilation problem",
        terms: ["slow", "18", "tired", "ventilat"],
      },
    ],
  },
  {
    id: "v2-resp-shallow",
    topic: "resp",
    prompt:
      "An adult is breathing 40 and shallow, getting sleepier. Best next airway move?",
    choices: [
      "Nasal cannula at 2 L",
      "Non-rebreather at 15 L and watch",
      "Positive-pressure ventilation with a BVM",
      "A paper bag to slow him down",
    ],
    answer: 2,
    rationale:
      "Fast plus shallow means tidal volume is not reaching the alveoli. An NRB only helps if air is actually exchanging. He needs a bag.",
    why: [
      "2 L will not fix dead-space panting.",
      "An NRB enrichs breaths that are not getting to the alveoli.",
      "Correct. Inadequate volume + falling mentation = BVM.",
      "Never re-breathe a deteriorating medical patient into a paper bag.",
    ],
    followUp: {
      prompt: "Why does an NRB fail here?",
      choices: [
        "Masks cannot run at 15 L",
        "Oxygen only works if the breath reaches the alveoli",
        "NRBs are only for trauma",
      ],
      answer: 1,
      why: "Dead-space breaths swap no gas. Positive pressure pushes volume in.",
    },
    keyPoints: [
      {
        text: "Fast + shallow = inadequate tidal volume",
        terms: ["shallow", "tidal", "volume", "fast"],
      },
      {
        text: "Falling mentation plus bad volume → BVM, not just a mask",
        terms: ["bvm", "bag", "mentation", "sleepy"],
      },
    ],
  },
  {
    id: "v2-resp-kussmaul",
    topic: "resp",
    prompt:
      "A diabetic is breathing deep and fast, with a fruity odor. You should:",
    choices: [
      "Coach him to slow down — he is hyperventilating from panic",
      "Recognize Kussmaul and do not bag away his compensation",
      "Give oral glucose immediately",
      "Treat it as opioid overdose",
    ],
    answer: 1,
    rationale:
      "Deep and fast in DKA is Kussmaul — he is blowing off acid. Do not suppress it. This is hyperglycemia, not a sugar you fix with oral glucose in the field.",
    why: [
      "This is not a panic attack. Slowing him traps acid.",
      "Correct. Protect the airway, give oxygen as needed, and do not bag him down.",
      "Oral glucose is for the conscious hypoglycemic, not DKA.",
      "Opioids slow and shallow; they do not make deep, fast, fruity breaths.",
    ],
    followUp: {
      prompt: "Waxing, waning, then a pause is:",
      choices: ["Kussmaul", "Cheyne-Stokes", "Agonal only"],
      answer: 1,
      why: "Cheyne-Stokes is the crescendo-decrescendo with pauses — think brain injury. Agonal is irregular dying gasps.",
    },
    keyPoints: [
      {
        text: "Kussmaul = deep + fast = blowing off metabolic acid (DKA)",
        terms: ["kussmaul", "dka", "acid", "deep"],
      },
      {
        text: "Do not bag it down; this is compensation, not panic",
        terms: ["compensat", "not", "panic", "slow"],
      },
    ],
  },
  {
    id: "v2-resp-dead-space",
    topic: "resp",
    prompt:
      "Air that sits in the trachea and bronchi and never reaches alveoli is called:",
    choices: [
      "Tidal volume",
      "Vital capacity",
      "Dead space",
      "Minute volume",
    ],
    answer: 2,
    rationale:
      "Dead space is the conducting airway that does not exchange gas. Tidal volume is one breath; minute volume is tidal × rate.",
    why: [
      "Tidal volume is the size of one breath, including dead space.",
      "Vital capacity is a pulmonary-function number, not this concept.",
      "Correct. Dead space air does not exchange.",
      "Minute volume is how much air moves per minute.",
    ],
    followUp: {
      prompt: "The left lung has fewer lobes because:",
      choices: [
        "It is vestigial",
        "The heart takes space on the left",
        "The liver sits under it",
      ],
      answer: 1,
      why: "Right lung 3 lobes, left lung 2 — room for the heart.",
    },
    keyPoints: [
      {
        text: "Dead space = air that never reaches alveoli",
        terms: ["dead space", "alveoli", "exchange"],
      },
      {
        text: "Shallow breaths can be almost all dead space",
        terms: ["shallow", "dead", "tidal"],
      },
    ],
  },
  {
    id: "v2-airway-gurgle",
    topic: "airway",
    prompt:
      "An unresponsive patient is gurgling. First action?",
    choices: [
      "Bag him — the sound means he needs oxygen",
      "Suction, then ventilate",
      "Insert an NPA and leave the fluid",
      "Sit him up and coach a cough",
    ],
    answer: 1,
    rationale:
      "Gurgling is fluid. Bagging first drives it into the lungs. Suction, then ventilate.",
    why: [
      "Positive pressure on a wet airway pushes vomit down.",
      "Correct. Suction first.",
      "An adjunct does not remove the fluid.",
      "He is unresponsive — he cannot cough on command.",
    ],
    followUp: {
      prompt: "Max suction time per pass?",
      choices: ["5 seconds", "10 seconds", "30 seconds"],
      answer: 1,
      why: "10 seconds. You remove oxygen with the fluid. Suction on the way out.",
    },
    keyPoints: [
      {
        text: "Gurgling = fluid → suction before any ventilation",
        terms: ["gurgl", "suction", "fluid"],
      },
      {
        text: "10 seconds max; measure corner of mouth to earlobe",
        terms: ["10", "earlobe", "measure"],
      },
    ],
  },
  {
    id: "v2-airway-jaw",
    topic: "airway",
    prompt:
      "Unresponsive after a motorcycle crash, helmet off, no obvious fluid. How do you open the airway?",
    choices: [
      "Head-tilt chin-lift",
      "Jaw thrust, neck kept neutral",
      "Hyperextend to lift the tongue",
      "Blind finger sweep",
    ],
    answer: 1,
    rationale:
      "Trauma or unknown mechanism = jaw thrust. Head-tilt moves the C-spine.",
    why: [
      "Head-tilt is for medical patients with no spine concern.",
      "Correct. Jaw thrust keeps the neck neutral.",
      "Hyperextension is the movement you are avoiding.",
      "Blind sweeps push objects deeper and are not taught.",
    ],
    followUp: {
      prompt: "Unresponsive from a diabetic emergency, no trauma. Opener?",
      choices: ["Jaw thrust only", "Head-tilt chin-lift", "None — go straight to a tube"],
      answer: 1,
      why: "Medical, no spine concern: head-tilt chin-lift.",
    },
    keyPoints: [
      {
        text: "Trauma or unknown = jaw thrust, C-spine neutral",
        terms: ["jaw", "thrust", "neutral", "trauma"],
      },
      {
        text: "Medical, no spine concern = head-tilt chin-lift",
        terms: ["tilt", "chin", "medical"],
      },
    ],
  },
  {
    id: "v2-airway-opa-gag",
    topic: "airway",
    prompt:
      "You drop an OPA and the patient gags. You:",
    choices: [
      "Push it deeper to seat it",
      "Tape it in place",
      "Pull it immediately and expect vomit",
      "Leave it and add an NPA",
    ],
    answer: 2,
    rationale:
      "A gag means the OPA comes out now. Have suction ready. OPA is only for a fully unresponsive patient with no gag.",
    why: [
      "Deeper makes the gag worse and can vomit him.",
      "Taping a gagging airway adjunct is dangerous.",
      "Correct. Out now, suction ready.",
      "Two adjuncts do not fix a gag reflex.",
    ],
    followUp: {
      prompt: "OPA sizing landmark:",
      choices: [
        "Tip of the nose to the chin",
        "Corner of the mouth to the earlobe",
        "Bridge of the nose to the xiphoid",
      ],
      answer: 1,
      why: "Mouth-corner to earlobe (or angle of the jaw). Insert inverted and rotate.",
    },
    keyPoints: [
      {
        text: "OPA only if unresponsive with no gag",
        terms: ["gag", "unresponsive", "opa"],
      },
      {
        text: "Any gag = pull it and be ready to suction",
        terms: ["pull", "vomit", "suction"],
      },
    ],
  },
  {
    id: "v2-airway-npa-raccoon",
    topic: "airway",
    prompt:
      "Unresponsive with raccoon eyes and blood from one ear after a fall. Best adjunct?",
    choices: [
      "NPA — he still has a gag",
      "OPA if no gag; otherwise hold the jaw — no NPA with basilar-skull signs",
      "NPA in the bleeding naris to tamponade it",
      "Nothing — adjuncts are contraindicated after any fall",
    ],
    answer: 1,
    rationale:
      "Raccoon eyes and otorrhea suggest a basilar skull fracture. An NPA can track into the cranial vault. Use an OPA if there is no gag, or manual jaw thrust.",
    why: [
      "NPA is the wrong hole when the skull base may be broken.",
      "Correct. Skip the nose; use OPA or your hands.",
      "Do not pack a possible skull-base bleed with an NPA.",
      "Falls do not ban every adjunct — they ban the nasal route when basilar signs are present.",
    ],
    followUp: {
      prompt: "NPA is the right pick when:",
      choices: [
        "There is a gag and no facial or skull trauma",
        "CSF is dripping from the nose",
        "The patient is fully awake and talking",
      ],
      answer: 0,
      why: "Gag-tolerant adjunct, but never with head or face trauma.",
    },
    keyPoints: [
      {
        text: "No NPA with head/face trauma or basilar skull signs (raccoon eyes, Battle's, CSF)",
        terms: ["npa", "basilar", "raccoon", "skull", "face"],
      },
      {
        text: "Use OPA if no gag, or hold the jaw manually",
        terms: ["opa", "jaw", "manual", "gag"],
      },
    ],
  },
  {
    id: "v2-circ-compensated",
    topic: "circ",
    prompt:
      "A stabbing victim is anxious, pale, and tachycardic. Radial pulse is thready. BP is 118/76. This is:",
    choices: [
      "Not shock — the pressure is normal",
      "Compensated shock",
      "Decompensated shock",
      "Irreversible shock only",
    ],
    answer: 1,
    rationale:
      "Shock signs with a pressure that is still holding is compensated shock. A normal BP never rules shock out. Decompensated is when the systolic falls.",
    why: [
      "That is the exam trap. Pressure is the last thing to drop.",
      "Correct. Signs of hypoperfusion, BP still up.",
      "Decompensated needs a falling systolic (under 90 in an adult).",
      "You cannot call irreversible from this single set.",
    ],
    followUp: {
      prompt: "The switch to decompensated shock is marked by:",
      choices: [
        "Heart rate over 100",
        "Any cool skin",
        "A falling systolic pressure",
      ],
      answer: 2,
      why: "Compensation exists to hold pressure. When systolic drops, compensation has failed.",
    },
    keyPoints: [
      {
        text: "Compensated = shock signs + BP still holding",
        terms: ["compensat", "holding", "normal", "tachycard"],
      },
      {
        text: "Decompensated = systolic falling (adult under 90); never use a normal BP to rule out shock",
        terms: ["90", "decompensat", "fall", "hypotens"],
      },
    ],
  },
  {
    id: "v2-circ-warfarin",
    topic: "circ",
    prompt:
      "An older adult on warfarin bumped his head on a cabinet. He says he feels fine. You:",
    choices: [
      "Release him — no loss of consciousness means no bleed",
      "Treat it as high-risk: anticoagulants hide and extend bleeds",
      "Give aspirin to protect the heart",
      "Only worry if he is on antibiotics",
    ],
    answer: 1,
    rationale:
      "Warfarin blocks clotting. A minor head strike can become an intracranial bleed hours later. Transport bias goes up; aspirin would make it worse.",
    why: [
      "No LOC does not clear an anticoagulated head strike.",
      "Correct. Ask about thinners on every trauma, especially heads.",
      "Aspirin is an antiplatelet — the opposite of what this patient needs.",
      "Antibiotics are not the bleeding risk here.",
    ],
    followUp: {
      prompt: "Anticoagulants mainly:",
      choices: [
        "Raise blood sugar",
        "Block clot formation so bleeding keeps going",
        "Speed heart rate",
      ],
      answer: 1,
      why: "They keep clots from forming. Small injuries bleed longer and hide worse.",
    },
    keyPoints: [
      {
        text: "Warfarin/anticoagulants + head strike = hidden brain-bleed risk",
        terms: ["warfarin", "anticoag", "head", "bleed"],
      },
      {
        text: "Ask about blood thinners on every trauma patient",
        terms: ["ask", "thinner", "every"],
      },
    ],
  },
  {
    id: "v2-circ-sepsis-pipes",
    topic: "circ",
    prompt:
      "A febrile nursing-home patient is hypotensive and flushed. Which part of the perfusion triad failed?",
    choices: [
      "Pump — the heart stopped",
      "Pipes — vessels dilated from infection",
      "Fluid — he is only dehydrated",
      "Lungs — this is always a pneumonia problem only",
    ],
    answer: 1,
    rationale:
      "Sepsis is distributive (pipe) shock: infection dilates the container so it outgrows the blood in it. He may also be dry, but the classic mechanism is vasodilation.",
    why: [
      "The pump can be fine; the container got bigger.",
      "Correct. Sepsis, anaphylaxis, and neurogenic are pipe failures.",
      "Dehydration can ride along, but flushed and febrile points at distributive shock.",
      "Pneumonia may be the source, but the shock type is still pipes.",
    ],
    followUp: {
      prompt: "Anaphylaxis is which failure?",
      choices: ["Pump", "Pipes — massive dilation", "Loss of red cells"],
      answer: 1,
      why: "Same family as sepsis: the vessels open everywhere.",
    },
    keyPoints: [
      {
        text: "Pump = heart; pipes = vessels; fluid = blood volume",
        terms: ["pump", "pipe", "fluid"],
      },
      {
        text: "Sepsis and anaphylaxis dilate the pipes",
        terms: ["sepsis", "dilat", "distribut", "anaphyla"],
      },
    ],
  },
  {
    id: "v2-circ-jvd-tamponade",
    topic: "circ",
    prompt:
      "Penetrating chest wound, JVD, muffled heart sounds, falling BP. That pattern is:",
    choices: [
      "Massive hemothorax emptying the tank",
      "Cardiac tamponade",
      "Simple rib fracture",
      "Asthma",
    ],
    answer: 1,
    rationale:
      "Beck's triad — JVD, muffled sounds, hypotension — is tamponade. Blood in the pericardial sac squeezes the heart (a pump problem from the outside).",
    why: [
      "Hemothorax usually flattens neck veins — the tank is empty.",
      "Correct. Backup into the neck plus a quiet heart is tamponade.",
      "A rib fracture does not muffle heart sounds or drop pressure like this.",
      "Asthma does not give muffled hearts after a stab.",
    ],
    followUp: {
      prompt: "Flat neck veins in a trauma patient suggest:",
      choices: [
        "Tamponade or tension pneumothorax",
        "Volume loss — bleeding or dehydration",
        "Right-heart failure",
      ],
      answer: 1,
      why: "Empty tank = flat jugulars. JVD is a backup problem.",
    },
    keyPoints: [
      {
        text: "JVD + muffled heart + hypotension = tamponade",
        terms: ["tamponade", "muffled", "jvd", "beck"],
      },
      {
        text: "Flat veins = empty tank; JVD = backup (tamponade, tension, right failure)",
        terms: ["flat", "empty", "backup", "tension"],
      },
    ],
  },
  {
    id: "v2-body-spleen",
    topic: "body",
    prompt:
      "A left-upper-quadrant blow in a pickup game, now pale and dizzy. Which solid organ is the classic bleeder?",
    choices: ["Appendix", "Spleen", "Bladder", "Gallbladder"],
    answer: 1,
    rationale:
      "The spleen sits in the LUQ and bleeds like a solid, blood-rich organ. Hollow organs leak contents and cause peritonitis more than instant shock.",
    why: [
      "The appendix is RLQ and hollow.",
      "Correct. LUQ + solid = spleen until proven otherwise.",
      "The bladder is hollow and pelvic.",
      "The gallbladder is hollow and RUQ.",
    ],
    followUp: {
      prompt: "A solid-organ injury mainly causes:",
      choices: ["Peritonitis from leaking acid", "Blood loss", "Constipation"],
      answer: 1,
      why: "Solid = bleed. Hollow = leak and peritonitis.",
    },
    keyPoints: [
      {
        text: "Spleen = LUQ solid organ and a hidden bleeder",
        terms: ["spleen", "luq", "left"],
      },
      {
        text: "Solid organs bleed; hollow organs leak",
        terms: ["solid", "hollow", "bleed", "leak"],
      },
    ],
  },
  {
    id: "v2-body-glucagon",
    topic: "body",
    prompt: "Glucagon's job is to:",
    choices: [
      "Move sugar into cells and lower the blood glucose",
      "Raise blood glucose by releasing stored sugar",
      "Clot blood",
      "Open the bronchioles",
    ],
    answer: 1,
    rationale:
      "Insulin lowers glucose; glucagon raises it. Both come from the pancreas.",
    why: [
      "That is insulin.",
      "Correct. Glucagon unlocks glycogen and raises the sugar.",
      "Clotting is platelets and clotting factors.",
      "Bronchodilation is beta-2 / albuterol territory.",
    ],
    followUp: {
      prompt: "A reasonable normal glucose range to remember is:",
      choices: ["30–50", "80–120", "250–400"],
      answer: 1,
      why: "About 80–120. Under 80 is low — check anyone who is altered.",
    },
    keyPoints: [
      {
        text: "Insulin lowers glucose; glucagon raises it",
        terms: ["insulin", "glucagon", "raise", "lower"],
      },
      {
        text: "Check a sugar on altered patients; under 80 is low",
        terms: ["80", "120", "altered", "low"],
      },
    ],
  },
  {
    id: "v2-body-full-thickness",
    topic: "body",
    prompt:
      "The center of a burn is dry, leathery, and the patient says that part does not hurt. Depth?",
    choices: [
      "Superficial",
      "Partial thickness",
      "Full thickness",
      "Just erythema",
    ],
    answer: 2,
    rationale:
      "Full thickness destroys dermis and nerve endings — leathery, dry, and painless in the center. The rim is often partial thickness and screaming painful.",
    why: [
      "Superficial is red, no blisters, painful.",
      "Partial thickness blisters and hurts a lot.",
      "Correct. Painless leather is full thickness.",
      "Erythema is a color, not this depth.",
    ],
    followUp: {
      prompt: "Whose palm estimates 1% TBSA?",
      choices: ["Yours", "The patient's", "An adult male standard"],
      answer: 1,
      why: "The patient's own palm is about 1% of their body surface.",
    },
    keyPoints: [
      {
        text: "Full thickness = leathery, dry, nerves gone → least pain in the center",
        terms: ["leather", "nerve", "painless", "full"],
      },
      {
        text: "Partial = blisters and severe pain; superficial = red, no blisters",
        terms: ["blister", "partial", "superficial", "red"],
      },
    ],
  },
  {
    id: "v2-body-phrenic",
    topic: "body",
    prompt:
      "A football player is numb from the shoulders down and is getting short of breath. The nerve you are worried about exits at:",
    choices: ["L4–L5", "C3–C4–C5", "T10–T12", "S1–S2"],
    answer: 1,
    rationale:
      "C3, 4, 5 keeps the diaphragm alive — the phrenic nerve. A high cervical injury can stop breathing.",
    why: [
      "Lumbar injuries spare the diaphragm.",
      "Correct. Phrenic nerve is C3–C5.",
      "Low thoracic levels do not drive the diaphragm.",
      "Sacral roots are bowel, bladder, and legs — not the diaphragm.",
    ],
    followUp: {
      prompt: "An injury well below C5 may still:",
      choices: [
        "Always stop breathing",
        "Spare the diaphragm while paralyzing the legs",
        "Only affect the arms",
      ],
      answer: 1,
      why: "Below the phrenic outflow the diaphragm can still fire. High cervical is the breathing killer.",
    },
    keyPoints: [
      {
        text: "Phrenic nerve = C3–C5 = diaphragm",
        terms: ["phrenic", "c3", "c5", "diaphragm"],
      },
      {
        text: "Injury at or above that level can stop breathing",
        terms: ["above", "breath", "stop", "high cervical"],
      },
    ],
  },
  {
    id: "v2-move-stair-chair",
    topic: "move",
    prompt:
      "A 70-year-old with flu is weak but awake, no spine concern, apartment is a walk-up. Best device?",
    choices: [
      "Long backboard down the stairs",
      "Stair chair",
      "Scoop stretcher standing up",
      "Fireman's carry as the default",
    ],
    answer: 1,
    rationale:
      "Conscious, no spine issue, stairs = stair chair. Boards are for the unconscious or spine-injured.",
    why: [
      "A board on stairs is for the patient who cannot sit or has a spine concern.",
      "Correct. Stair chair is the tool that matches this call.",
      "Scoop is for no-roll patients like hip fractures, not stair work.",
      "A carry is a last-ditch emergency move, not the plan.",
    ],
    followUp: {
      prompt: "Same stairs, but now he is unconscious. Device?",
      choices: [
        "Stair chair anyway",
        "Backboard, feet first, strongest at the ends",
        "Wait for an elevator that does not exist",
      ],
      answer: 1,
      why: "Unconscious or spine = board. Feet first on stairs.",
    },
    keyPoints: [
      {
        text: "Awake, no spine, stairs = stair chair",
        terms: ["stair chair", "conscious", "awake"],
      },
      {
        text: "Unconscious or spine = board, feet first",
        terms: ["board", "feet first", "unconscious"],
      },
    ],
  },
  {
    id: "v2-move-left-lateral",
    topic: "move",
    prompt:
      "A 34-week pregnant patient is hypotensive after a fender-bender, no spinal complaint. Best position?",
    choices: [
      "Flat supine to maximize venous return",
      "Left lateral",
      "Feet-up Trendelenburg",
      "Prone",
    ],
    answer: 1,
    rationale:
      "After about 20 weeks, the uterus compresses the vena cava when she lies flat. Left lateral restores venous return.",
    why: [
      "Supine hypotensive syndrome — flat makes her worse.",
      "Correct. Roll her onto her left side.",
      "Feet-up is outdated and still leaves the uterus on the cava.",
      "Prone is not a pregnant-trauma transport position.",
    ],
    followUp: {
      prompt: "What is the uterus compressing on her back?",
      choices: ["Aorta only", "The inferior vena cava", "The trachea"],
      answer: 1,
      why: "Inferior vena cava — venous return falls, pressure falls.",
    },
    keyPoints: [
      {
        text: "20+ weeks supine → uterus on the vena cava (supine hypotensive syndrome)",
        terms: ["vena cava", "20", "supine hypotensive"],
      },
      {
        text: "Left lateral restores return; do not leave her flat",
        terms: ["left", "lateral", "flat"],
      },
    ],
  },
  {
    id: "v2-move-head-last",
    topic: "move",
    prompt: "On a long board, the head is secured:",
    choices: [
      "First, so the neck cannot move at all",
      "Last, after the torso, hips, and legs",
      "Whenever there is a spare strap",
      "Never — collars replace straps",
    ],
    answer: 1,
    rationale:
      "Body first (torso X, hips, legs), head last with blocks. If the body can still shift, a strapped head becomes the fulcrum that wrenches the neck.",
    why: [
      "Head first lets a sliding torso twist the neck.",
      "Correct. Head last.",
      "Order is not optional.",
      "A collar is not a substitute for head blocks and straps.",
    ],
    followUp: {
      prompt: "Who calls the count on a log roll?",
      choices: [
        "The person at the feet",
        "The person holding the head",
        "Whoever is loudest",
      ],
      answer: 1,
      why: "The C-spine holder owns the count so the body and head move as one.",
    },
    keyPoints: [
      {
        text: "Strap torso, hips, and legs before the head",
        terms: ["torso", "head last", "hips", "legs"],
      },
      {
        text: "A shifting body with a fixed head twists the neck",
        terms: ["shift", "twist", "neck"],
      },
    ],
  },
  {
    id: "v2-move-power-grip",
    topic: "move",
    prompt: "The power grip is:",
    choices: [
      "Palms down, fingertips only",
      "Palms up, hands about 10 inches apart, fingers wrapped",
      "One-handed for better balance",
      "A pinch grip at the rail ends",
    ],
    answer: 1,
    rationale:
      "Palms up, spaced, full wrap — that is the strongest, most stable hold. Lift with the legs, load close, no twist.",
    why: [
      "Palms down and fingertips are a weak, fatiguing grip.",
      "Correct. That is the power grip.",
      "Two hands. Always.",
      "Pinch grips fail under load.",
    ],
    followUp: {
      prompt: "The power lift protects your back by:",
      choices: [
        "Bending at the waist with locked knees",
        "Legs lift, load close, shoulders over pelvis, no twisting",
        "Twisting to use momentum",
      ],
      answer: 1,
      why: "Legs do the work. The back stays stacked. Never rotate under a load.",
    },
    keyPoints: [
      {
        text: "Power grip: palms up, ~10 inches apart, fingers fully wrapped",
        terms: ["palm", "10", "wrap", "up"],
      },
      {
        text: "Lift with the legs, load close, do not twist",
        terms: ["leg", "close", "twist"],
      },
    ],
  },
  {
    id: "v2-meds-viagra",
    topic: "meds",
    prompt:
      "Chest pain, BP 142/88, patient took sildenafil (Viagra) last night. Nitroglycerin?",
    choices: [
      "Give it — the BP is high enough",
      "Hold it — ED drugs plus nitro can crash the pressure",
      "Give half a tablet",
      "Give it only if medical control is busy",
    ],
    answer: 1,
    rationale:
      "PDE-5 inhibitors (-fil: Viagra, Cialis) plus nitro can produce refractory hypotension. Hold nitro for about 24–48 hours after those drugs. BP over 100 does not cancel that rule.",
    why: [
      "The BP floor is necessary but not sufficient if he took an ED med.",
      "Correct. -fil drugs are a hard stop.",
      "A half dose is still the same drug-drug interaction.",
      "Busy medical control is not permission to skip the contraindication.",
    ],
    followUp: {
      prompt: "Nitro is also held when systolic is under:",
      choices: ["140", "100", "80 always only"],
      answer: 1,
      why: "Under 100 is the usual hold. Check BP before every dose.",
    },
    keyPoints: [
      {
        text: "No nitro with ED meds (-fil) in the last 24–48 hours",
        terms: ["fil", "viagra", "cialis", "24", "ed"],
      },
      {
        text: "Also hold if systolic is under 100 or there is a head injury",
        terms: ["100", "head", "systolic"],
      },
    ],
  },
  {
    id: "v2-meds-asa-dose",
    topic: "meds",
    prompt:
      "Suspected cardiac chest pain, no aspirin allergy. The protocol dose is:",
    choices: [
      "81 mg swallowed whole",
      "160–325 mg chewed",
      "650 mg for faster effect",
      "Aspirin is not an EMT drug",
    ],
    answer: 1,
    rationale:
      "160–325 mg chewed (often 2–4 baby aspirin). Chewing gets the antiplatelet effect on board faster. It makes platelets slippery so the clot cannot grow.",
    why: [
      "81 mg is one baby tablet — under-dosed if that is all you give, and swallowing is slower.",
      "Correct. Chew 160–325 mg.",
      "650 mg is above the usual protocol and does not add benefit.",
      "Aspirin is one of the EMT six.",
    ],
    followUp: {
      prompt: "A hard stop for aspirin is:",
      choices: [
        "A prior heart attack",
        "True aspirin allergy, or a kid (Reye's)",
        "Systolic of 130",
      ],
      answer: 1,
      why: "Allergy is a hard stop. Kids with viral illness + aspirin risk Reye's. Prior MI is a reason to give it, not hold it.",
    },
    keyPoints: [
      {
        text: "160–325 mg chewed for suspected ACS",
        terms: ["160", "325", "chew"],
      },
      {
        text: "Antiplatelet — stops the clot from growing; allergy and kids are holds",
        terms: ["platelet", "allerg", "reye", "kid"],
      },
    ],
  },
  {
    id: "v2-meds-epi-dose",
    topic: "meds",
    prompt:
      "Bee sting, hives, wheezing, BP 78/40. Adult epinephrine dose and route?",
    choices: [
      "0.15 mg IM in the deltoid",
      "0.3 mg IM in the lateral thigh",
      "0.3 mg oral",
      "Albuterol only — hold epi until the hospital",
    ],
    answer: 1,
    rationale:
      "This is anaphylaxis: two systems plus hypotension. Adult epi is 0.3 mg IM in the lateral thigh. 0.15 mg is the pediatric auto-injector.",
    why: [
      "0.15 mg is the kid dose, and the deltoid is not the preferred auto-injector site.",
      "Correct. 0.3 mg IM, lateral thigh.",
      "Epinephrine is not an oral drug in this setting.",
      "Albuterol can help wheeze; it does not fix shock. He needs epi now.",
    ],
    followUp: {
      prompt: "What makes this anaphylaxis, not a simple allergy?",
      choices: [
        "Hives alone",
        "Airway or shock, or two-plus body systems",
        "Any known bee allergy",
      ],
      answer: 1,
      why: "Skin plus lungs plus low BP is the definition that unlocks epi.",
    },
    keyPoints: [
      {
        text: "Adult epi 0.3 mg IM lateral thigh; peds 0.15 mg",
        terms: ["0.3", "0.15", "thigh", "im"],
      },
      {
        text: "Anaphylaxis = airway, shock/hypotension, or two-plus systems",
        terms: ["anaphyla", "two", "shock", "airway"],
      },
    ],
  },
  {
    id: "v2-meds-oral-glucose-hold",
    topic: "meds",
    prompt:
      "Glucose is 52. The patient is unresponsive with a snoring airway. Oral glucose?",
    choices: [
      "Yes — smear it on the gums",
      "No — he cannot protect his airway; that is an aspiration risk",
      "Yes — any low sugar gets a tube of paste",
      "Give it only if the family insists",
    ],
    answer: 1,
    rationale:
      "Oral glucose needs a conscious patient who can swallow. Unresponsive and snoring = no oral sugar. Airway first; ALS or the ED can give IV dextrose.",
    why: [
      "Gum-smear still leaves paste next to an unprotected airway.",
      "Correct. No swallow, no oral glucose.",
      "The number 52 is the indication only if the airway is safe.",
      "Family insistence does not change aspiration risk.",
    ],
    followUp: {
      prompt: "Sugar 58, awake, swallows water on command. Dose?",
      choices: [
        "One tube of oral glucose",
        "IM glucagon — EMTs always carry it",
        "Nothing until the ED",
      ],
      answer: 0,
      why: "Conscious and swallowing: one tube, then recheck the sugar.",
    },
    keyPoints: [
      {
        text: "Oral glucose only if conscious and able to swallow",
        terms: ["conscious", "swallow", "awake", "protect"],
      },
      {
        text: "Unresponsive or no gag → no oral sugar; need IV dextrose at ALS/ED",
        terms: ["unrespons", "aspirat", "dextrose", "als"],
      },
    ],
  },
  {
    id: "v2-life-immunity",
    topic: "life",
    prompt:
      "A healthy 5-year-old in kindergarten has had four colds since school started. The best explanation is:",
    choices: [
      "Vaccines have failed and should be repeated",
      "Maternal antibodies have faded and her own immunity is still building",
      "Her airways are narrower than an infant's",
      "School-age kids have no immune system",
    ],
    answer: 1,
    rationale:
      "Passive maternal antibodies fade around ages 4–6. Kids then build their own immunity through exposure — and they get sick doing it.",
    why: [
      "Routine kindergarten colds are not a vaccine-failure diagnosis.",
      "Correct. The borrowed antibodies are gone; hers are still in training.",
      "A 5-year-old airway is larger than an infant's — that is not why she is catching colds.",
      "They have an immune system — it is just inexperienced.",
    ],
    followUp: {
      prompt: "A 6-week-old is exposed to the same cold. Why might she stay well?",
      choices: [
        "Maternal antibodies can still be on board",
        "Infants never get viral illness",
        "Kindergarten germs cannot infect infants",
      ],
      answer: 0,
      why: "Early infancy still has leftover passive immunity. That protection is mostly gone by school age.",
    },
    keyPoints: [
      {
        text: "Maternal (passive) antibodies fade around ages 4–6",
        terms: ["4", "6", "maternal", "passive", "fade"],
      },
      {
        text: "After the fade, kids get sick more while building their own immunity",
        terms: ["own", "build", "school", "sick"],
      },
    ],
  },
  {
    id: "v2-life-diaphragm",
    topic: "life",
    prompt:
      "A 2-year-old with a huge, distended belly is now breathing faster. Why does the belly matter?",
    choices: [
      "Toddlers are primarily diaphragm breathers — a full belly limits that motion",
      "The belly pushes the heart into the left lung",
      "Kids this age do not use a diaphragm at all",
      "Distension only matters after age 10",
    ],
    answer: 0,
    rationale:
      "Young children rely on the diaphragm. A packed belly, a belly injury, or lying flat cuts their tidal volume.",
    why: [
      "Correct. Restrict the diaphragm and you restrict the toddler's breathing.",
      "The heart-space issue is about lung lobes, not this belly.",
      "They depend on the diaphragm more than adults do.",
      "This is most important in the youngest kids, not older ones.",
    ],
    followUp: {
      prompt: "Accessory neck-muscle use in that toddler means:",
      choices: [
        "Normal work of breathing for age 2",
        "Respiratory distress",
        "That the diaphragm is finally mature",
      ],
      answer: 1,
      why: "Neck and intercostal retractions are distress, not a normal toddler pattern.",
    },
    keyPoints: [
      {
        text: "Young kids are diaphragm breathers — chest wall muscles are still weak",
        terms: ["diaphragm", "chest wall", "toddler"],
      },
      {
        text: "A distended belly, injury, or flat position cuts their ventilation",
        terms: ["belly", "abdom", "flat", "distend"],
      },
    ],
  },
  {
    id: "v2-life-vs",
    topic: "life",
    prompt:
      "Compared with a healthy adolescent, a 6-month-old should have:",
    choices: [
      "A slower heart rate and higher blood pressure",
      "A faster heart rate, faster breathing, and a lower blood pressure",
      "Identical adult vital-sign ranges",
      "No palpable pulse at rest",
    ],
    answer: 1,
    rationale:
      "Younger means faster heart and breathing, lower blood pressure. Adolescents sit in adult ranges: HR 60–100, RR 12–20, systolic at least 90.",
    why: [
      "That is the opposite of the age trend.",
      "Correct. Fast-fast-low is the infant pattern.",
      "Adult numbers start around adolescence, not infancy.",
      "Infants have strong pulses — you just check the brachial.",
    ],
    followUp: {
      prompt: "When do vital signs usually match adult ranges?",
      choices: ["Toddlerhood", "Adolescence", "Around age 40"],
      answer: 1,
      why: "Teens share adult HR, RR, and a systolic floor of 90.",
    },
    keyPoints: [
      {
        text: "Younger = faster HR and RR, lower BP",
        terms: ["faster", "lower", "infant", "younger"],
      },
      {
        text: "Adolescents use adult ranges (HR 60–100, RR 12–20, SBP ≥ 90)",
        terms: ["adolescen", "teen", "60", "12", "90"],
      },
    ],
  },
  {
    id: "v2-life-moral",
    topic: "life",
    prompt:
      "A 15-year-old will only wear the collar if his friends say it looks fine. That moral stage is:",
    choices: [
      "Pre-conventional — he is avoiding punishment",
      "Conventional — peer approval drives the choice",
      "Post-conventional — he has an internal ethical code",
      "Concrete operational — a Piaget stage, not a moral one",
    ],
    answer: 1,
    rationale:
      "Teens usually reason at the conventional, peer-driven stage. Pre-conventional is punishment-avoidance; post-conventional is internalized ethics.",
    why: [
      "Avoiding a time-out is pre-conventional — typical of younger kids.",
      "Correct. Friends as the referee is conventional.",
      "Post-conventional would be 'I wear it because it is the right thing,' friends or not.",
      "Concrete operational is cognitive development, not Kohlberg.",
    ],
    followUp: {
      prompt: "A 6-year-old sits still only to avoid a time-out. Stage?",
      choices: ["Pre-conventional", "Conventional", "Post-conventional"],
      answer: 0,
      why: "Punishment-avoidance is pre-conventional.",
    },
    keyPoints: [
      {
        text: "Pre-conventional = avoid punishment; conventional = peers; post-conventional = internal ethics",
        terms: ["punish", "peer", "ethic", "conventional"],
      },
      {
        text: "Adolescents usually sit at the conventional, friend-driven stage",
        terms: ["teen", "adolescen", "friend", "peer"],
      },
    ],
  },
  {
    id: "v2-terms-hepat",
    topic: "terms",
    prompt: "Nephritis is inflammation of the:",
    choices: ["Liver", "Nerves", "Kidney", "Lung"],
    answer: 2,
    rationale:
      "Nephr- is kidney and -itis is inflammation. Hepat- is liver; neuro- is nerves; pulmon- is lung.",
    why: [
      "Liver is hepat- — hepatitis.",
      "Nerves are neuro-.",
      "Correct. Nephr- + itis = kidney inflammation.",
      "Lung is pulmon- or pneumo-.",
    ],
    followUp: {
      prompt: "Cardiomegaly means:",
      choices: ["Heart inflammation", "Enlarged heart", "Kidney failure"],
      answer: 1,
      why: "Cardi- = heart, -megaly = enlarged. -itis would be inflammation.",
    },
    keyPoints: [
      {
        text: "hepat- = liver, nephr- = kidney, cardi- = heart, pulmon- = lung",
        terms: ["hepat", "nephr", "liver", "kidney"],
      },
      {
        text: "-itis = inflammation",
        terms: ["itis", "inflam"],
      },
    ],
  },
  {
    id: "v2-terms-palm",
    topic: "terms",
    prompt:
      "You are estimating a scattered burn. Whose palm is about 1% of total body surface?",
    choices: [
      "Yours — every adult palm is the same",
      "The patient's",
      "A standard 9-inch template",
      "The parent's, if this is a child",
    ],
    answer: 1,
    rationale:
      "The patient's own palm is about 1% of their body surface. Your hand may be a different size entirely.",
    why: [
      "Your palm is sized to you, not to them.",
      "Correct. Use the patient's palm.",
      "There is no field template that replaces the patient's hand.",
      "A parent's hand overestimates a child's burn.",
    ],
    followUp: {
      prompt: "An entire adult leg on the Rule of Nines is about:",
      choices: ["9%", "18%", "36%"],
      answer: 1,
      why: "Each adult leg is 18%. An arm is 9%. Front of the torso is 18%.",
    },
    keyPoints: [
      {
        text: "The patient's palm ≈ 1% TBSA",
        terms: ["1", "palm", "patient"],
      },
      {
        text: "Depth (superficial / partial / full) is charted separately from area",
        terms: ["depth", "area", "separate"],
      },
    ],
  },
  {
    id: "v2-docs-soap",
    topic: "docs",
    prompt:
      "In a SOAP note, the line \"I have been dizzy since breakfast\" belongs under:",
    choices: ["Subjective", "Objective", "Assessment", "Plan"],
    answer: 0,
    rationale:
      "Subjective is what the patient says. Objective is what you measure or observe. Assessment is your impression; plan is treatment and transport.",
    why: [
      "Correct. Those are the patient's words.",
      "Objective would be a BP, a glucose, or pale skin you can see.",
      "Assessment is your field impression, not the quote.",
      "Plan is what you are going to do about it.",
    ],
    followUp: {
      prompt: "A blood pressure of 88/60 is:",
      choices: ["Subjective", "Objective", "Plan"],
      answer: 1,
      why: "Vitals are measurable — objective.",
    },
    keyPoints: [
      {
        text: "Subjective = what they say; objective = what you can measure or see",
        terms: ["subjective", "objective", "says", "measur"],
      },
      {
        text: "CHART = Chief complaint, History, Assessment, Rx, Transport",
        terms: ["chart", "chief", "rx", "transport"],
      },
    ],
  },
  {
    id: "v2-docs-radio",
    topic: "docs",
    prompt:
      "The handheld radio you take to the patient's side is the:",
    choices: [
      "Base station",
      "Mobile radio",
      "Portable radio",
      "Repeater",
    ],
    answer: 2,
    rationale:
      "Portable = handheld. Mobile is mounted in the truck. Base is fixed at the station or hospital. A repeater is hardware that rebroadcasts to extend range.",
    why: [
      "Base stations stay at the station or hospital.",
      "Mobile radios are bolted into the ambulance.",
      "Correct. Handheld = portable.",
      "A repeater is not a radio you carry — it is a range extender.",
    ],
    followUp: {
      prompt: "Push-to-talk, one person at a time, is:",
      choices: ["Simplex", "Duplex", "Multiplex"],
      answer: 0,
      why: "Simplex = one at a time. Duplex = both directions at once. Multiplex = multiple signals on one channel.",
    },
    keyPoints: [
      {
        text: "Portable = handheld, mobile = vehicle, base = fixed; FCC owns the frequencies",
        terms: ["portable", "handheld", "mobile", "base"],
      },
      {
        text: "Simplex = push-to-talk one at a time; duplex = both ways at once",
        terms: ["simplex", "duplex", "push"],
      },
    ],
  },
  {
    id: "v2-docs-sbar",
    topic: "docs",
    prompt: "In SBAR, the B stands for:",
    choices: ["Bleeding", "Background", "Breathing", "Base station"],
    answer: 1,
    rationale:
      "SBAR is Situation, Background, Assessment, Treatment — the order of a verbal handoff. The written ePCR follows.",
    why: [
      "Bleeding lives inside your assessment, not that letter.",
      "Correct. B = Background — history, meds, what happened before you arrived.",
      "Breathing is an ABC, not the B in SBAR.",
      "Base station is radio hardware.",
    ],
    followUp: {
      prompt: "The S in SBAR is:",
      choices: ["SAMPLE", "Signs", "Situation"],
      answer: 2,
      why: "Situation first — why you are calling and what is in front of you right now.",
    },
    keyPoints: [
      {
        text: "SBAR = Situation, Background, Assessment, Treatment",
        terms: ["situation", "background", "assessment", "treatment"],
      },
      {
        text: "Verbal handoff first; the ePCR is the written follow-up",
        terms: ["verbal", "handoff", "epcr"],
      },
    ],
  },
  {
    id: "v2-docs-ethno",
    topic: "docs",
    prompt:
      "You catch yourself thinking a patient's home remedies are \"ignorant\" because they are not how you grew up. That barrier is:",
    choices: [
      "Cultural imposition — you already forced a treatment",
      "Ethnocentrism — judging their culture by yours",
      "Defamation",
      "A radio problem",
    ],
    answer: 1,
    rationale:
      "Ethnocentrism is \"my culture is the standard.\" Cultural imposition goes further and forces your values onto the patient. Both count as noise in communication.",
    why: [
      "Imposition is the next step — making them do it your way.",
      "Correct. Ranking their culture under yours is ethnocentrism.",
      "Defamation is a false statement of fact, not a private bias.",
      "This is a people problem, not a transmitter problem.",
    ],
    followUp: {
      prompt: "In communications, \"noise\" means:",
      choices: [
        "Only loud sirens",
        "Anything that blocks the message — sound, language, culture, hearing loss",
        "A chart typo after the call",
      ],
      answer: 1,
      why: "Noise is any interference: sirens, age, vision, language, or cultural judgment.",
    },
    keyPoints: [
      {
        text: "Ethnocentrism = my culture first; imposition = forcing your values",
        terms: ["ethno", "imposition", "culture", "values"],
      },
      {
        text: "Noise = anything that blocks the message",
        terms: ["noise", "block", "interfer", "barrier"],
      },
    ],
  },
  {
    id: "v2-reassess-orders",
    topic: "reassess",
    prompt:
      "The stem gives you no standing order and no online order for a drug you want to give. You:",
    choices: [
      "Give half the dose and chart it",
      "Contact medical control first, then give if approved, then reassess",
      "Give the full dose — EMTs never need orders",
      "Skip the drug and also skip documenting the decision",
    ],
    answer: 1,
    rationale:
      "No standing order means you call. Sequence is graded: authorization → administer → reassess. Half of an unauthorized dose is still unauthorized.",
    why: [
      "A half dose without an order is still a protocol break.",
      "Correct. Call, give if approved, reassess.",
      "Scope is not a blank check.",
      "The decision belongs on the PCR either way.",
    ],
    followUp: {
      prompt: "Protocol lists aspirin as a standing order. You:",
      choices: [
        "Still call before every tablet",
        "Give it per protocol, then reassess",
        "Wait for the ED to give it",
      ],
      answer: 1,
      why: "Standing orders ARE the authorization. You call when the stem gives you neither.",
    },
    keyPoints: [
      {
        text: "No standing order → contact medical control before the drug",
        terms: ["medical control", "order", "contact", "call"],
      },
      {
        text: "Sequence: authorize → give → reassess",
        terms: ["reassess", "sequence", "then", "authorize"],
      },
    ],
  },
  {
    id: "v2-resp-three",
    topic: "resp",
    prompt:
      "A pulse ox of 86% with a good waveform is measuring:",
    choices: [
      "Ventilation — air moving in and out",
      "Respiration — alveolar gas exchange",
      "Oxygenation — oxygen loaded onto hemoglobin",
      "Perfusion of the foot",
    ],
    answer: 2,
    rationale:
      "SpO2 is oxygenation. Ventilation is air movement. Respiration is the alveolar swap. Three different failures, three different fixes.",
    why: [
      "Ventilation is rate and tidal volume — you watch the chest for that.",
      "Respiration is the gas exchange inside the alveoli.",
      "Correct. The probe reads O2 on hemoglobin.",
      "A finger probe is not a perfusion exam of the foot.",
    ],
    followUp: {
      prompt: "A patient with a sat of 98% who is not moving air has failed:",
      choices: ["Oxygenation only", "Ventilation", "The pulse ox battery"],
      answer: 1,
      why: "A pretty number does not mean air is moving. Bag the ventilation failure.",
    },
    keyPoints: [
      {
        text: "Ventilation = air moving; respiration = alveolar exchange; oxygenation = O2 on hemoglobin",
        terms: ["ventilation", "respiration", "oxygenation", "hemoglobin"],
      },
      {
        text: "SpO2 is oxygenation — it does not prove the patient is ventilating",
        terms: ["spo2", "sat", "not", "ventilat"],
      },
    ],
  },
  {
    id: "v2-resp-co",
    topic: "resp",
    prompt:
      "Pulled from a house fire, talking, sat 99% on room air, headache and nausea. Oxygen?",
    choices: [
      "None — the sat is perfect",
      "Nasal cannula at 2 L",
      "High-flow oxygen regardless of the number",
      "A paper bag to treat hyperventilation",
    ],
    answer: 2,
    rationale:
      "Carbon monoxide occupies hemoglobin. The pulse ox counts those seats as full, so you get a false-normal sat. Fire or CO exposure gets high-flow O2 anyway.",
    why: [
      "The machine is lying — CO looks like oxygen to it.",
      "2 L is comfort-level oxygen, not CO treatment.",
      "Correct. High-flow now; do not trust the sat.",
      "This is not a panic attack.",
    ],
    followUp: {
      prompt: "Why does the probe read 100% in CO poisoning?",
      choices: [
        "It counts CO-occupied hemoglobin as saturated",
        "CO raises real oxygen content",
        "Fire makes the probe more accurate",
      ],
      answer: 0,
      why: "Occupied seats count as saturated. The probe cannot tell CO from O2.",
    },
    keyPoints: [
      {
        text: "CO fills hemoglobin; the sat reads false-normal",
        terms: ["carbon", "hemoglobin", "false", "co"],
      },
      {
        text: "Fire or CO exposure → high-flow oxygen no matter the number",
        terms: ["high-flow", "high flow", "nrb", "regardless", "fire"],
      },
    ],
  },
  {
    id: "v2-resp-agonal",
    topic: "resp",
    prompt:
      "You find an adult with occasional irregular gasps and no other breathing. You:",
    choices: [
      "Coach him to take deeper breaths",
      "Put on a non-rebreather and reassess in 15 minutes",
      "Treat it as apnea — begin bag-valve-mask ventilation",
      "Wait to see if the gasps get regular",
    ],
    answer: 2,
    rationale:
      "Agonal gasps are not breathing. They are a sign of arrest or peri-arrest. Ventilate immediately — and check a pulse.",
    why: [
      "He cannot follow commands. Those are dying breaths.",
      "An NRB requires actual ventilation.",
      "Correct. Gasps = bag, now.",
      "Waiting wastes the only minutes that matter.",
    ],
    followUp: {
      prompt: "Breathing adequately but shocky and pale. Oxygen device?",
      choices: ["BVM anyway", "Non-rebreather at 15 L/min", "No oxygen until sats drop"],
      answer: 1,
      why: "Adequate mechanics plus shock or hypoxia = NRB. The bag is for failed ventilation.",
    },
    keyPoints: [
      {
        text: "Agonal gasps are not breathing — ventilate and check a pulse",
        terms: ["agonal", "gasp", "bag", "not breath"],
      },
      {
        text: "NRB is for the patient who is still actually moving air",
        terms: ["nrb", "moving air", "adequate"],
      },
    ],
  },
  {
    id: "v2-resp-distress",
    topic: "resp",
    prompt:
      "Tripod, retractions, two-word sentences, still moving air. This is:",
    choices: [
      "Normal work of breathing",
      "Respiratory distress — support oxygen and watch for failure",
      "Respiratory arrest — start compressions",
      "A primary psychiatric event",
    ],
    answer: 1,
    rationale:
      "Accessory-muscle use and broken speech are distress. He is still ventilating, so you oxygenate and prepare to bag if he tiring. Arrest is no breathing.",
    why: [
      "Tripod and retractions are never \"normal.\"",
      "Correct. Distress now; failure is next if he fades.",
      "He still has a pulse and some air movement — not arrest.",
      "Anxiety can coexist; the work of breathing is still real.",
    ],
    followUp: {
      prompt: "He gets sleepy and the retractions fade. That usually means:",
      choices: [
        "He is getting better",
        "He is sliding toward failure — be ready to bag",
        "You can take the oxygen off",
      ],
      answer: 1,
      why: "Tiring plus a quieter chest is decompensation, not recovery.",
    },
    keyPoints: [
      {
        text: "Retractions, tripod, and broken speech = respiratory distress",
        terms: ["retract", "tripod", "distress", "two-word"],
      },
      {
        text: "Sleepy and quieter means failure is coming — ready the BVM",
        terms: ["sleepy", "fail", "tire", "bvm"],
      },
    ],
  },
  {
    id: "v2-assess-lmp",
    topic: "assess",
    prompt:
      "A 27-year-old has sudden right-lower-quadrant pain and dizziness. After ABCs, you must ask:",
    choices: [
      "Her favorite foods this week",
      "Chance of pregnancy and the date of her last menstrual period",
      "Whether she flosses",
      "Her blood type only",
    ],
    answer: 1,
    rationale:
      "Childbearing age plus abdominal pain means you screen for pregnancy. Ectopic pregnancy is the hidden killer behind that question.",
    why: [
      "Diet is not the critical screen.",
      "Correct. Pregnancy chance and LMP, every time.",
      "Dental habits are irrelevant here.",
      "Blood type can wait; ectopic cannot.",
    ],
    followUp: {
      prompt: "Why is that question a life-threat screen?",
      choices: [
        "Ectopic pregnancy can rupture and bleed",
        "Pregnant patients cannot ride in an ambulance",
        "LMP is only for billing",
      ],
      answer: 0,
      why: "A ruptured ectopic is intra-abdominal hemorrhage. You are hunting for that.",
    },
    keyPoints: [
      {
        text: "Childbearing age + abdominal pain → pregnancy chance and LMP",
        terms: ["pregnan", "lmp", "period", "menstrual"],
      },
      {
        text: "Ectopic pregnancy is the life threat behind the question",
        terms: ["ectopic", "rupture", "bleed"],
      },
    ],
  },
  {
    id: "v2-assess-tq",
    topic: "assess",
    prompt:
      "Bright red blood is spurting from a mid-thigh wound. Direct pressure is soaking through. Next?",
    choices: [
      "A tourniquet proximal to the wound, then note the time",
      "A tourniquet on the neck of the femur",
      "Wait for a clot — never use a tourniquet",
      "Pack the chest wall",
    ],
    answer: 0,
    rationale:
      "Spurting = arterial. Pressure first; if a limb is still bleeding, tourniquet high and tight proximal to the wound. No tourniquet on the neck, torso, or junctions.",
    why: [
      "Correct. Limb, failed pressure, arterial — tourniquet now.",
      "The hip junction is not a tourniquet site.",
      "Waiting on arterial spurting is how people die.",
      "This is a thigh, not a chest.",
    ],
    followUp: {
      prompt: "Where is a tourniquet useless?",
      choices: ["Mid-arm", "Mid-thigh", "The neck or torso"],
      answer: 2,
      why: "Neck, torso, and shoulder/hip junctions get packing and pressure — not a TQ.",
    },
    keyPoints: [
      {
        text: "Direct pressure first; failed limb bleed → tourniquet proximal to the wound",
        terms: ["pressure", "tourniquet", "proximal"],
      },
      {
        text: "Spurting = arterial; no TQ on neck, torso, or junctions",
        terms: ["arterial", "spurt", "neck", "torso"],
      },
    ],
  },
  {
    id: "v2-assess-rr8",
    topic: "assess",
    prompt:
      "An adult overdose is breathing 6 times a minute, still has a pulse. You:",
    choices: [
      "Watch — 6 is close enough to 8",
      "Assist ventilations with a BVM",
      "Only apply a nasal cannula",
      "Start chest compressions",
    ],
    answer: 1,
    rationale:
      "Adult worry cutoffs are over 28 or under 8. Under 8 — or failure or arrest — means you bag. A pulse means no compressions yet.",
    why: [
      "Under 8 is the line. Six is not a watch-and-wait number.",
      "Correct. Rate of 6 = ventilate.",
      "A cannula does not move air for him.",
      "Compressions are for no pulse.",
    ],
    followUp: {
      prompt: "Adult breathing 32, alert, good tidal volume. You:",
      choices: [
        "Bag him automatically",
        "Work up the cause; a bag is not automatic just because he is fast",
        "Ignore it — only slow rates matter",
      ],
      answer: 1,
      why: "Over 28 is a worry. Fast with good volume gets oxygen and a cause hunt, not an automatic bag.",
    },
    keyPoints: [
      {
        text: "Under 8/min — or failure or arrest — means assist ventilations",
        terms: ["8", "eight", "ventilat", "bag"],
      },
      {
        text: "Worry over 28; fast is not automatically a BVM if volume is good",
        terms: ["28", "fast", "volume"],
      },
    ],
  },
  {
    id: "v2-assess-sign",
    topic: "assess",
    prompt: "Which of these is a sign?",
    choices: [
      "\"My chest feels tight\"",
      "A respiratory rate of 8",
      "\"I think I am going to die\"",
      "\"The pain is a 9\"",
    ],
    answer: 1,
    rationale:
      "Signs are observed or measured by you. Symptoms are what the patient reports — even when they attach a number.",
    why: [
      "That is a symptom — he told you.",
      "Correct. You counted it. That is a sign.",
      "A feeling of doom is a symptom.",
      "Pain scores are still reported — symptoms.",
    ],
    followUp: {
      prompt: "Blue lips you can see are:",
      choices: ["A symptom", "A sign", "Neither"],
      answer: 1,
      why: "Cyanosis is visible to anyone who looks — objective, a sign.",
    },
    keyPoints: [
      {
        text: "Sign = observable or measurable (rate, cyanosis, bleeding)",
        terms: ["sign", "measur", "observ", "see"],
      },
      {
        text: "Symptom = what the patient reports, even with a number on it",
        terms: ["symptom", "report", "says", "feel"],
      },
    ],
  },
  {
    id: "v2-assess-order",
    topic: "assess",
    prompt: "The correct order of a call is:",
    choices: [
      "History, then scene size-up, then ABCs",
      "Scene size-up → primary → history → secondary and vitals → impression and treatment → reassess",
      "Secondary exam, then decide if the scene is safe",
      "Transport first, assess in the bay",
    ],
    answer: 1,
    rationale:
      "Life threats come before questions. Scene and primary (ABCs) are first; history waits until the patient is not dying in front of you.",
    why: [
      "History never precedes a dangerous scene or a dead airway.",
      "Correct. That is the standard flow.",
      "You do not start detailed exams on an unsecured scene.",
      "You assess enough to move, but you do not skip the primary.",
    ],
    followUp: {
      prompt: "Where does the field impression land?",
      choices: [
        "Before the primary survey",
        "After history and the secondary, driving your treatment",
        "Only at the hospital",
      ],
      answer: 1,
      why: "Impression plus interventions sit after you have a primary, a history, and a secondary look.",
    },
    keyPoints: [
      {
        text: "Scene → primary → history → secondary + vitals → impression/treatment → reassess",
        terms: ["scene", "primary", "history", "secondary", "reassess"],
      },
      {
        text: "ABCs before questions — history waits",
        terms: ["abc", "before", "history", "life threat"],
      },
    ],
  },
  {
    id: "v2-assess-scene",
    topic: "assess",
    prompt: "Which task belongs in scene size-up?",
    choices: [
      "A full SAMPLE history",
      "BSI, scene safety, MOI/NOI, number of patients, extra resources",
      "OPQRST on the chest pain",
      "A detailed head-to-toe",
    ],
    answer: 1,
    rationale:
      "The five size-up jobs happen before you touch the patient. History and detailed exams come later.",
    why: [
      "SAMPLE is history — after the primary.",
      "Correct. Those five, before contact.",
      "OPQRST is history-taking.",
      "Head-to-toe is the secondary.",
    ],
    followUp: {
      prompt: "When do you get law enforcement rolling?",
      choices: [
        "After transport, if at all",
        "Early — suspected abuse or an escalating scene",
        "Only for highway wrecks",
      ],
      answer: 1,
      why: "Abuse, violence, or a heating-up scene gets law started before you become the second patient.",
    },
    keyPoints: [
      {
        text: "Five size-up tasks: BSI, safety, MOI/NOI, number of patients, extra resources",
        terms: ["bsi", "safety", "moi", "noi", "resource"],
      },
      {
        text: "All of it happens before patient contact",
        terms: ["before", "contact", "touch"],
      },
    ],
  },
  {
    id: "v2-assess-stridor",
    topic: "assess",
    prompt:
      "A child has a harsh, high-pitched sound on inspiration and is drooling. That sound is:",
    choices: [
      "Snoring — the tongue; just reposition",
      "Gurgling — suction and nothing else",
      "Stridor — upper-airway swelling; think croup, epiglottitis, anaphylaxis",
      "Wheezing — lower-airway bronchospasm only",
    ],
    answer: 2,
    rationale:
      "Stridor is an upper-airway warning. Snoring is the tongue. Gurgling is fluid. Wheezes are usually lower airway.",
    why: [
      "Snoring is soft and positional — not this harsh inspiratory sound.",
      "Gurgling is wet. Drooling plus stridor is swelling, not just fluid.",
      "Correct. Keep the kid calm; do not poke the airway.",
      "Wheeze is typically expiratory and lower.",
    ],
    followUp: {
      prompt: "Snoring in an unresponsive adult is usually:",
      choices: ["Fluid — suction first", "The tongue — reposition", "Asthma"],
      answer: 1,
      why: "Snoring = tongue. Open the airway. Gurgling is the suction trigger.",
    },
    keyPoints: [
      {
        text: "Stridor = upper-airway swelling (croup, epiglottitis, anaphylaxis)",
        terms: ["stridor", "upper", "swell", "croup"],
      },
      {
        text: "Snoring = tongue; gurgling = fluid",
        terms: ["snor", "tongue", "gurgl", "fluid"],
      },
    ],
  },
  {
    id: "v2-assess-pedsbp",
    topic: "assess",
    prompt:
      "Minimum acceptable systolic for a 4-year-old is about:",
    choices: ["50", "78", "90", "110"],
    answer: 1,
    rationale:
      "Under age 10: minimum systolic ≈ 2 × age + 70. 2 × 4 + 70 = 78. The adult floor of 90 starts around age 10.",
    why: [
      "50 is hypotensive at any pediatric age in this formula.",
      "Correct. 2 × 4 + 70 = 78.",
      "90 is the adult / age-10 floor.",
      "110 is a fine adult number, not the 4-year-old minimum.",
    ],
    followUp: {
      prompt: "At what age does 2 × age + 70 meet the adult floor of 90?",
      choices: ["Age 6", "Age 10", "Age 15"],
      answer: 1,
      why: "2 × 10 + 70 = 90. From 10 up, use 90.",
    },
    keyPoints: [
      {
        text: "Under 10: minimum systolic = 2 × age + 70",
        terms: ["2", "70", "age", "formula"],
      },
      {
        text: "Adult floor is 90; the formula reaches it at age 10",
        terms: ["90", "10", "adult"],
      },
    ],
  },
  {
    id: "v2-assess-gcs",
    topic: "assess",
    prompt:
      "Eyes open to speech, words are confused, he localizes pain. GCS?",
    choices: ["8", "12", "14", "15"],
    answer: 1,
    rationale:
      "Eyes to speech = 3, confused verbal = 4, localizes = 5. 3 + 4 + 5 = 12. Floor is 3, ceiling is 15.",
    why: [
      "8 would need much worse eyes or motor.",
      "Correct. 3 + 4 + 5 = 12.",
      "14 is almost normal — this patient is not.",
      "15 is fully alert: eyes 4, oriented 5, obeys 6.",
    ],
    followUp: {
      prompt: "The lowest possible GCS is:",
      choices: ["0", "1", "3"],
      answer: 2,
      why: "Each category bottoms at 1, so the floor is 3 — never 0.",
    },
    keyPoints: [
      {
        text: "Eyes 1–4, verbal 1–5, motor 1–6 — add them",
        terms: ["eyes", "verbal", "motor", "add"],
      },
      {
        text: "15 = fully alert; 3 = no response at all",
        terms: ["15", "3", "alert", "floor"],
      },
    ],
  },
  {
    id: "v2-assess-eject",
    topic: "assess",
    prompt:
      "A driver was ejected, is awake, and points to a wrist. Exam?",
    choices: [
      "Focused wrist exam only — he is talking",
      "Rapid head-to-toe — significant mechanism hides injuries",
      "No exam; go straight to the helicopter",
      "Pupils only",
    ],
    answer: 1,
    rationale:
      "Ejection, high speed, and big falls are significant MOI. Talking does not cancel a hidden second injury. Localized minor complaints get a focused exam; this is not that.",
    why: [
      "A wrist complaint after ejection is a distractor.",
      "Correct. Big mechanism = hunt the whole body.",
      "You still examine — you just do it fast.",
      "Pupils are one piece, not the exam.",
    ],
    followUp: {
      prompt: "A 20-year-old sliced a finger on a bagel, walking, stable. Exam?",
      choices: ["Rapid trauma head-to-toe", "Focused exam of the finger", "No physical exam"],
      answer: 1,
      why: "Isolated minor mechanism = focused exam.",
    },
    keyPoints: [
      {
        text: "Significant MOI (ejection, high speed, big fall) → rapid head-to-toe even if awake",
        terms: ["moi", "eject", "head-to-toe", "head to toe"],
      },
      {
        text: "Isolated minor complaint → focused exam of that area",
        terms: ["focused", "minor", "localiz", "finger"],
      },
    ],
  },
  {
    id: "v2-assess-priority",
    topic: "assess",
    prompt:
      "Which patient is high-priority / load-and-go?",
    choices: [
      "A month of stable back pain, walking",
      "A resolved nosebleed, normal vitals",
      "Altered mental status after a fall",
      "Anxious with a normal exam and normal vitals",
    ],
    answer: 2,
    rationale:
      "Altered status, airway work, assisted ventilations, major bleeding, shock, ACS pain, and complicated childbirth are high priority. Stable chronic complaints can stay and play.",
    why: [
      "Chronic stable pain is not a time-sensitive threat.",
      "A stopped nosebleed with normal vitals can be worked up on scene.",
      "Correct. Altered after trauma is load-and-go.",
      "Anxiety with a clean exam is not physiologic instability.",
    ],
    followUp: {
      prompt: "Which other finding makes a patient load-and-go?",
      choices: [
        "You are assisting ventilations",
        "A scraped knee",
        "A medication refill request",
      ],
      answer: 0,
      why: "If you are bagging, you are already in the high-priority column.",
    },
    keyPoints: [
      {
        text: "High priority: altered, airway work, ventilation, shock, major bleed, ACS, complicated birth",
        terms: ["altered", "shock", "ventilat", "priority", "bleed"],
      },
      {
        text: "Stable, non-critical complaints can stay and play",
        terms: ["stable", "stay", "chronic"],
      },
    ],
  },
  {
    id: "v2-assess-platinum",
    topic: "assess",
    prompt:
      "The Platinum 10 is:",
    choices: [
      "10 minutes from dispatch to the patient's door",
      "10 minutes or less on scene for a critical trauma, essential ABC care only",
      "10 minutes from the hospital door to the OR",
      "10 liters of oxygen on every trauma",
    ],
    answer: 1,
    rationale:
      "Platinum 10 is scene time — get the essential ABCs done and move. The Golden Hour is injury to surgery in under 60 minutes; your 10 minutes live inside that hour.",
    why: [
      "Response time is not the Platinum 10.",
      "Correct. Ten minutes on scene, then go.",
      "Door-to-OR is a hospital interval.",
      "Oxygen dose is not what that phrase means.",
    ],
    followUp: {
      prompt: "The Golden Hour runs from:",
      choices: [
        "Dispatch to hospital arrival",
        "Injury to surgery",
        "Scene arrival to hospital door",
      ],
      answer: 1,
      why: "Injury to the operating room in under an hour.",
    },
    keyPoints: [
      {
        text: "Platinum 10 = 10 minutes or less on scene, ABC care only",
        terms: ["10", "ten", "scene", "platinum"],
      },
      {
        text: "Golden Hour = injury to surgery in under 60 minutes",
        terms: ["golden", "hour", "surgery", "60"],
      },
    ],
  },
  {
    id: "v2-assess-onset",
    topic: "assess",
    prompt:
      "\"What were you doing when this started?\" is asking:",
    choices: [
      "Quality — how the pain feels",
      "Onset — what triggered it and whether it was sudden",
      "Radiation — where it goes",
      "Severity — the 0–10 number",
    ],
    answer: 1,
    rationale:
      "Onset is what you were doing when it began and whether it hit suddenly. Timing is how long it has lasted. Sudden and recent is scarier than weeks-old pain.",
    why: [
      "Quality is sharp, dull, pressure, tearing.",
      "Correct. That question is onset.",
      "Radiation is \"does it go anywhere?\"",
      "Severity is the number, and a change in that number matters more than the first one.",
    ],
    followUp: {
      prompt: "\"Does anything make it better or worse?\" is:",
      choices: ["P — provocation/palliation", "Q — quality", "T — timing"],
      answer: 0,
      why: "Provocation/palliation asks what changes the pain.",
    },
    keyPoints: [
      {
        text: "Onset = what you were doing when it started; timing = how long it has lasted",
        terms: ["onset", "timing", "start", "doing"],
      },
      {
        text: "Sudden and recent is scarier; a severity CHANGE matters more than the first number",
        terms: ["sudden", "change", "severity", "recent"],
      },
    ],
  },
  {
    id: "v2-assess-abcs-first",
    topic: "assess",
    prompt:
      "Suspected opioid OD, pulse present, breathing 4 and shallow. Naloxone is in your partner's hand. You:",
    choices: [
      "Hold the bag until the drug is in",
      "Ventilate now — the drug can be prepped while you bag",
      "Give oral glucose first",
      "Wait for a sat before any intervention",
    ],
    answer: 1,
    rationale:
      "ABCs before meds. Inadequate breathing gets a BVM first. Naloxone takes minutes to work; the brain needs oxygen during every one of them.",
    why: [
      "The brain does not pause for a mixing time.",
      "Correct. Bag and draw up in parallel.",
      "Glucose is a later check, not the failing ABC.",
      "You do not wait on a number to ventilate a rate of 4.",
    ],
    followUp: {
      prompt: "Bagging while naloxone is being prepared is:",
      choices: [
        "Wrong — one intervention at a time",
        "Right — ventilation continues while the drug is readied",
        "Wrong — naloxone replaces the bag",
      ],
      answer: 1,
      why: "The bag never stops for the med.",
    },
    keyPoints: [
      {
        text: "ABCs before meds: inadequate breathing → BVM first",
        terms: ["abc", "first", "bvm", "bag", "before"],
      },
      {
        text: "Naloxone takes minutes — oxygen the brain the whole time",
        terms: ["minute", "oxygen", "brain", "naloxone"],
      },
    ],
  },
  {
    id: "v2-assess-abuse",
    topic: "assess",
    prompt:
      "You think a child was abused. Which line belongs on the PCR?",
    choices: [
      "\"The mother is clearly guilty\"",
      "4 cm brown-yellow bruise on the left upper arm; child states, \"Daddy did it\"",
      "\"Injuries prove the boyfriend is a monster\"",
      "Nothing — charting abuse is defamation",
    ],
    answer: 1,
    rationale:
      "Charts hold measured findings and quoted words — never guilt conclusions. You still file the mandatory report. Good-faith reporting is protected; defamation is stating a false fact as fact.",
    why: [
      "Guilt conclusions do not belong on a medical record.",
      "Correct. Size, color, location, plus a quote.",
      "Name-calling is the same problem as a guilt verdict.",
      "Mandatory reporting is required, and it is not defamation.",
    ],
    followUp: {
      prompt: "Reporting a good-faith abuse suspicion is:",
      choices: [
        "Optional if the parent denies it",
        "Mandatory, and protected",
        "A reason to skip the PCR",
      ],
      answer: 1,
      why: "You report through the required channel and you still write an objective chart.",
    },
    keyPoints: [
      {
        text: "Chart objective findings and the patient's (or child's) words in quotes",
        terms: ["objective", "quote", "bruise", "measur"],
      },
      {
        text: "No guilt on the PCR; suspicions go through mandatory reporting",
        terms: ["guilt", "mandatory", "report"],
      },
    ],
  },
  {
    id: "v2-airway-sample",
    topic: "airway",
    prompt:
      "Unresponsive in an empty apartment, no wallet, no med list, no neighbors. SAMPLE history?",
    choices: [
      "Invent a history so the box is filled",
      "Skip it — there is truly no source — and let the exam talk",
      "Wait on scene until someone comes home",
      "Call the hospital and ask them to guess",
    ],
    answer: 1,
    rationale:
      "You skip history only when the patient is out AND no family, ID, or med list exists. Otherwise you pull SAMPLE from any source. The physical exam becomes your information.",
    why: [
      "Made-up history is a false chart.",
      "Correct. No source = no SAMPLE. Move.",
      "You do not delay a dying patient for a roommate.",
      "The ED cannot invent his history either.",
    ],
    followUp: {
      prompt: "He is out, but his wife is in the doorway. History?",
      choices: [
        "Skip it — he cannot answer",
        "Take SAMPLE from the wife",
        "Wait until he wakes",
      ],
      answer: 1,
      why: "Any source counts: family, bystanders, bracelets, med lists.",
    },
    keyPoints: [
      {
        text: "Skip SAMPLE only if he is out AND there is no family, ID, or med list",
        terms: ["skip", "no family", "no source", "unconscious"],
      },
      {
        text: "Otherwise pull history from anyone available; the exam fills the gaps",
        terms: ["wife", "family", "exam", "source"],
      },
    ],
  },
  {
    id: "v2-airway-nc",
    topic: "airway",
    prompt:
      "Mild SOB after a long walk, sats 94%, speaking full sentences. Best oxygen start?",
    choices: [
      "BVM — any SOB gets a bag",
      "Non-rebreather at 15 L",
      "Nasal cannula at 2–6 L/min",
      "No oxygen is ever allowed at 94%",
    ],
    answer: 2,
    rationale:
      "Cannula is the low-need comfort device: 1–6 L/min, about 24–44%. Real distress or hypoxia with adequate breathing steps up to an NRB at 10–15 L.",
    why: [
      "He is moving air. A bag is for failure.",
      "15 L is a lot of oxygen for mild, talking, 94%.",
      "Correct. Start low; you can always step up.",
      "94% can still get titrated oxygen — just not a firehose.",
    ],
    followUp: {
      prompt: "The nasal-cannula flow range is:",
      choices: ["1–6 L/min", "8–12 L/min", "10–15 L/min"],
      answer: 0,
      why: "1–6 L/min. 15 L is non-rebreather territory.",
    },
    keyPoints: [
      {
        text: "Cannula = 1–6 L/min (about 24–44%) for low-need patients",
        terms: ["cannula", "1", "6", "24", "44"],
      },
      {
        text: "Real hypoxia or distress with adequate breathing → NRB at 10–15 L",
        terms: ["nrb", "15", "10", "hypox"],
      },
    ],
  },
  {
    id: "v2-airway-cpap",
    topic: "airway",
    prompt:
      "Awake CHF, wet crackles, follows commands, BP 148/90, breathing 28. Best support?",
    choices: [
      "CPAP if your protocol allows it",
      "Immediate intubation by the EMT",
      "A paper bag",
      "Nothing — CPAP is only for asthma",
    ],
    answer: 0,
    rationale:
      "CPAP needs alert, follows commands, still breathing, systolic at least 90. Wet lungs in a working CHF patient are the classic indication. Kills: apnea, low BP, chest/face trauma, pneumothorax, vomiting.",
    why: [
      "Correct. He meets every CPAP green light.",
      "EMTs do not intubate.",
      "Never re-breathe a CHF patient.",
      "Asthma is not the only — or even the main — CPAP customer.",
    ],
    followUp: {
      prompt: "Mid-ride his systolic slides to 84. The CPAP:",
      choices: [
        "Stays — he started above 90",
        "Comes off — CPAP below 90 drops him further",
        "Gets turned up",
      ],
      answer: 1,
      why: "CPAP lowers blood pressure. Below 90 it comes off.",
    },
    keyPoints: [
      {
        text: "CPAP needs: alert, follows commands, still breathing, SBP at least 90",
        terms: ["alert", "command", "90", "cpap"],
      },
      {
        text: "Kills: apnea, hypotension, chest/face trauma, pneumothorax, vomiting",
        terms: ["apnea", "hypotens", "trauma", "pneumo", "vomit"],
      },
    ],
  },
  {
    id: "v2-airway-choke",
    topic: "airway",
    prompt:
      "A diner is silent, clutching his throat, no air moving. You:",
    choices: [
      "Coach a cough and wait",
      "Start 5 back blows and 5 abdominal thrusts, and repeat",
      "Do a blind finger sweep",
      "Put him on a non-rebreather",
    ],
    answer: 1,
    rationale:
      "Severe (silent, no air) gets 5 and 5, repeated. Mild (talking or coughing) gets coached coughs. Collapse = start compressions. Blind sweeps push food deeper.",
    why: [
      "No air means he cannot cough. That advice is for mild obstruction.",
      "Correct. Severe obstruction = back blows and abdominal thrusts.",
      "Blind sweeps are out.",
      "A mask does nothing if no air is moving.",
    ],
    followUp: {
      prompt: "He collapses during the thrusts. You:",
      choices: [
        "Keep doing abdominal thrusts on the floor",
        "Start chest compressions, pulse or not",
        "Check the mouth every 30 seconds and wait",
      ],
      answer: 1,
      why: "Choking collapse = compressions immediately — they double as your obstruction pump.",
    },
    keyPoints: [
      {
        text: "Severe (silent, no air) = 5 back blows + 5 abdominal thrusts, repeat",
        terms: ["5", "back blow", "abdominal", "thrust"],
      },
      {
        text: "Mild = coach the cough; collapse = start compressions",
        terms: ["cough", "mild", "collapse", "compress"],
      },
    ],
  },
  {
    id: "v2-airway-bvmrate",
    topic: "airway",
    prompt:
      "Adult with a pulse, you are bagging. The rate is:",
    choices: [
      "1 breath every 6 seconds (~10/min)",
      "1 breath every 2 seconds",
      "1 breath every 15 seconds",
      "Squeeze the bag flat as fast as you can",
    ],
    answer: 0,
    rationale:
      "Adult with a pulse: about 1 every 6 seconds. Child or infant: every 2–3 seconds. Squeeze only until the chest rises — over-ventilating drops BP and fills the stomach.",
    why: [
      "Correct. ~10 breaths a minute for the pulsatile adult.",
      "Every 2 seconds is too fast for an adult and closer to a pediatric rate.",
      "Every 15 seconds is only 4 a minute — not enough.",
      "A flat bag is how you vomit and hypotense him.",
    ],
    followUp: {
      prompt: "How hard do you squeeze?",
      choices: [
        "Flat, every time",
        "Just until the chest visibly rises",
        "Until the abdomen distends",
      ],
      answer: 1,
      why: "Visible chest rise only. More than that is harm.",
    },
    keyPoints: [
      {
        text: "Adult with a pulse: 1 breath every 6 seconds; child/infant every 2–3",
        terms: ["6 second", "10", "2–3", "2-3"],
      },
      {
        text: "Squeeze to visible chest rise only — over-ventilating drops BP and causes vomiting",
        terms: ["rise", "over", "stomach", "visible"],
      },
    ],
  },
  {
    id: "v2-circ-chf-side",
    topic: "circ",
    prompt:
      "Crackles and severe breathlessness, no ankle swelling. Which side of the heart failed?",
    choices: [
      "Right — backup into the body",
      "Left — backup into the lungs",
      "Neither — this is only asthma",
      "The vena cava independently",
    ],
    answer: 1,
    rationale:
      "Blood backs up BEHIND the side that failed. Left failure fills the lungs (crackles, SOB). Right failure fills the body (JVD, ankle edema).",
    why: [
      "Right failure is the body-side backup.",
      "Correct. Wet lungs = left.",
      "Asthma can wheeze; it does not classically crackle both bases like this.",
      "The cava is a pipe, not a pump that \"fails\" on its own here.",
    ],
    followUp: {
      prompt: "JVD and pitting ankle edema, lungs clearer. Side?",
      choices: ["Left", "Right", "Neither"],
      answer: 1,
      why: "Body-side backup is right-heart failure.",
    },
    keyPoints: [
      {
        text: "Blood backs up behind the side that failed",
        terms: ["back", "behind", "failed"],
      },
      {
        text: "Left → lungs (crackles, SOB); right → body (JVD, ankle edema)",
        terms: ["left", "right", "lung", "jvd", "edema"],
      },
    ],
  },
  {
    id: "v2-circ-tpma",
    topic: "circ",
    prompt: "The valve order blood follows is:",
    choices: [
      "Mitral → aortic → tricuspid → pulmonic",
      "Tricuspid → pulmonic → mitral → aortic",
      "Aortic → mitral → pulmonic → tricuspid",
      "Pulmonic → tricuspid → aortic → mitral",
    ],
    answer: 1,
    rationale:
      "T-P-M-A: right atrium through tricuspid to right ventricle, pulmonic to the lungs, pulmonary veins to left atrium, mitral to left ventricle, aortic out to the body.",
    why: [
      "That starts on the left and skips the right heart.",
      "Correct. Toilet Paper My Ass — tricuspid, pulmonic, mitral, aortic.",
      "That is backwards.",
      "Pulmonic is not the first valve blood sees from the vena cava.",
    ],
    followUp: {
      prompt: "Which vessels are the exception that carry deoxygenated blood?",
      choices: ["Pulmonary veins", "Pulmonary arteries", "Coronary arteries"],
      answer: 1,
      why: "Pulmonary arteries run right ventricle → lungs with deoxygenated blood.",
    },
    keyPoints: [
      {
        text: "Valve order T-P-M-A: tricuspid → pulmonic → mitral → aortic",
        terms: ["tpma", "tricuspid", "pulmonic", "mitral", "aortic"],
      },
      {
        text: "Pulmonary arteries carry deoxygenated blood — the artery exception",
        terms: ["deoxygen", "pulmonary arter", "exception"],
      },
    ],
  },
  {
    id: "v2-circ-output",
    topic: "circ",
    prompt: "Cardiac output equals:",
    choices: [
      "Heart rate minus stroke volume",
      "Stroke volume × heart rate",
      "Systolic pressure × 2",
      "Tidal volume × respiratory rate",
    ],
    answer: 1,
    rationale:
      "CO = SV × HR. Roughly 80 mL × 70 ≈ 5.6 L/min. Very fast rates shrink filling time, so stroke volume — and output — can fall.",
    why: [
      "You multiply, you do not subtract.",
      "Correct. Stroke volume times rate.",
      "Blood pressure is not the CO formula.",
      "That is minute ventilation — the breathing twin.",
    ],
    followUp: {
      prompt: "Heart rate jumps to 190. Why can output fall?",
      choices: [
        "Filling time shrinks, so stroke volume collapses",
        "The muscle gets stronger",
        "The blood gets thicker",
      ],
      answer: 0,
      why: "No time to fill = small stroke volume = less output despite the rate.",
    },
    keyPoints: [
      {
        text: "Cardiac output = stroke volume × heart rate (~80 mL × 70 ≈ 5.6 L/min)",
        terms: ["stroke volume", "heart rate", "80", "5.6"],
      },
      {
        text: "Very fast rates cut filling time → output can drop",
        terms: ["fill", "fast", "drop", "time"],
      },
    ],
  },
  {
    id: "v2-circ-radial",
    topic: "circ",
    prompt:
      "He is talking, but you cannot feel a radial pulse. Think:",
    choices: [
      "Normal — radials are often absent",
      "The pulse ox is broken",
      "Falling pressure — a shock clue",
      "He has no carotid either, so start CPR",
    ],
    answer: 2,
    rationale:
      "The radial disappears early as pressure falls. A talking patient with no radial is a shock flag — check the carotid and treat shock. You do not start CPR on a talking patient.",
    why: [
      "An absent radial in a sick patient is not a normal variant.",
      "This finding is your fingers, not a probe.",
      "Correct. Weak or absent radial + alive = low pressure.",
      "Talking means there is a pulse somewhere — find the carotid.",
    ],
    followUp: {
      prompt: "Unresponsive adult — which pulse do you use to confirm life?",
      choices: ["Radial", "Carotid", "Dorsalis pedis"],
      answer: 1,
      why: "Unresponsive adult or child → carotid. Awake → radial. Infant → brachial.",
    },
    keyPoints: [
      {
        text: "Awake → radial; unresponsive adult/child → carotid; infant → brachial",
        terms: ["radial", "carotid", "brachial"],
      },
      {
        text: "A weak or absent radial in a living patient = shock until proven otherwise",
        terms: ["absent", "weak", "shock", "pressure"],
      },
    ],
  },
  {
    id: "v2-circ-triad",
    topic: "circ",
    prompt: "The perfusion triad is:",
    choices: [
      "Airway, breathing, and a pulse ox",
      "Pump (heart), pipes (vessels), fluid (blood)",
      "Sodium, potassium, and calcium",
      "Red cells, white cells, and platelets only",
    ],
    answer: 1,
    rationale:
      "Perfusion needs a working pump, intact pipes, and enough fluid. Any one failing is shock. IV saline can fill volume but cannot carry oxygen the way red cells do.",
    why: [
      "Those are assessment tools, not the triad.",
      "Correct. Pump, pipes, fluid.",
      "Electrolytes matter, but they are not the triad.",
      "Those are blood components — one piece of the fluid leg.",
    ],
    followUp: {
      prompt: "IV fluid restores volume but cannot:",
      choices: [
        "Raise pressure at all",
        "Carry oxygen the way hemoglobin does",
        "Fill the pipes",
      ],
      answer: 1,
      why: "Saline has no hemoglobin. Only blood restores oxygen-carrying capacity.",
    },
    keyPoints: [
      {
        text: "Pump = heart, pipes = vessels, fluid = blood",
        terms: ["pump", "pipe", "fluid", "heart", "vessel"],
      },
      {
        text: "Any one failing = shock; IV fluid is not oxygen-carrying red cells",
        terms: ["shock", "fail", "iv", "oxygen", "red cell"],
      },
    ],
  },
  {
    id: "v2-body-hemophilia",
    topic: "body",
    prompt:
      "A hemophiliac has a small scalp laceration that will not quit. Why is that a big deal?",
    choices: [
      "Their skin is thinner than normal",
      "They are missing clotting factors, so bleeding does not stop on its own",
      "Their blood pressure always runs high",
      "Hemophilia prevents any clot, including at the hospital",
    ],
    answer: 1,
    rationale:
      "Missing factors (Hemophilia A = factor VIII) mean minor wounds bleed a long time. Firm uninterrupted pressure, no peeking, early transport — the hospital has the factor.",
    why: [
      "Skin thickness is not the disease.",
      "Correct. The clot cannot form without the missing factor.",
      "Pressure is not the core problem — clotting is.",
      "The hospital can replace factor. That is why you go.",
    ],
    followUp: {
      prompt: "Field management is:",
      choices: [
        "Peek every 30 seconds to check the clot",
        "Firm uninterrupted pressure and early transport",
        "A tourniquet on the neck",
      ],
      answer: 1,
      why: "Peeking restarts the bleed. Pressure stays; the ED has the factor.",
    },
    keyPoints: [
      {
        text: "Hemophilia = missing clotting factors — minor trauma bleeds a long time",
        terms: ["factor", "clot", "missing", "viii"],
      },
      {
        text: "Uninterrupted pressure, no peeking, early transport",
        terms: ["pressure", "peek", "transport"],
      },
    ],
  },
  {
    id: "v2-body-anaerobic",
    topic: "body",
    prompt:
      "A shock patient is covered with a blanket on a warm day. Why?",
    choices: [
      "Comfort only — it does nothing physiologic",
      "Anaerobic metabolism makes far less energy and sheds heat",
      "To hide injuries from bystanders",
      "Shock patients overheat and need insulation against that",
    ],
    answer: 1,
    rationale:
      "Hypoperfusion forces anaerobic metabolism: little energy, lactic acid, acidosis — and heat loss. Cover them to protect what little energy is left.",
    why: [
      "It is not just hospitality.",
      "Correct. They cannot spare the heat loss.",
      "Modesty is secondary.",
      "They lose heat; they do not overheat from shock itself.",
    ],
    followUp: {
      prompt: "The waste product of anaerobic metabolism is:",
      choices: ["Glucose", "Lactic acid", "Insulin"],
      answer: 1,
      why: "Lactic acid plus acidosis — that is the chemical signature of shock cells.",
    },
    keyPoints: [
      {
        text: "Hypoperfusion → anaerobic metabolism: less energy, lactic acid, acidosis",
        terms: ["anaerobic", "lactic", "acid", "energy"],
      },
      {
        text: "Heat loss comes with it — blanket shock patients even when it is warm",
        terms: ["heat", "blanket", "cover", "warm"],
      },
    ],
  },
  {
    id: "v2-body-receptors",
    topic: "body",
    prompt: "Albuterol opens lower airways by stimulating:",
    choices: [
      "Alpha receptors — vasoconstriction",
      "Beta-1 receptors — heart rate and squeeze",
      "Beta-2 receptors — bronchodilation",
      "Opioid receptors",
    ],
    answer: 2,
    rationale:
      "Alpha constricts vessels and raises BP. Beta-1 is the heart. Beta-2 opens bronchioles. Epinephrine hits all three — pressure up and airways open.",
    why: [
      "Alpha is the vessel-squeeze receptor.",
      "Beta-1 is why albuterol can make you tachycardic as a side effect, but it is not the airway target.",
      "Correct. Beta-2 = bronchodilation.",
      "Opioid receptors are naloxone's target, not albuterol's.",
    ],
    followUp: {
      prompt: "Beta blockers slow the heart by blocking:",
      choices: ["Alpha", "Beta-1", "Beta-2"],
      answer: 1,
      why: "Beta-1 is the cardiac receptor — block it and rate, squeeze, and BP fall.",
    },
    keyPoints: [
      {
        text: "Alpha = vasoconstriction; beta-1 = heart; beta-2 = bronchodilation",
        terms: ["alpha", "beta-1", "beta-2", "bronchodil"],
      },
      {
        text: "Epinephrine hits all three — pressure up AND airways open",
        terms: ["epi", "all three", "epipen"],
      },
    ],
  },
  {
    id: "v2-move-recovery",
    topic: "move",
    prompt:
      "Post-seizure, groggy, breathing adequately, no spine concern. Position?",
    choices: [
      "Recovery position",
      "Flat supine and leave him",
      "High Fowler",
      "Prone with no airway plan",
    ],
    answer: 0,
    rationale:
      "Recovery = unresponsive or groggy + breathing adequately + no spine concern. Gravity drains vomit. If breathing fails, he goes supine for the bag.",
    why: [
      "Correct. On his side, airway draining.",
      "Supine is for the patient you need to ventilate.",
      "Sitting a groggy post-ictal patient upright risks a slump.",
      "Prone is not your transport plan.",
    ],
    followUp: {
      prompt: "He stops breathing in the recovery position. You:",
      choices: [
        "Leave him on his side and watch",
        "Roll him supine and bag",
        "Sit him up",
      ],
      answer: 1,
      why: "Needs ventilations → supine so you can work the airway.",
    },
    keyPoints: [
      {
        text: "Recovery = unresponsive/groggy + adequate breathing + no spine concern",
        terms: ["recovery", "side", "lateral", "vomit"],
      },
      {
        text: "Needs a bag → supine",
        terms: ["supine", "bag", "ventilat"],
      },
    ],
  },
  {
    id: "v2-move-restrain",
    topic: "move",
    prompt:
      "A combative patient needs restraints. First you:",
    choices: [
      "Tie him prone so he cannot spit",
      "Rule out hypoxia, low sugar, and head injury as the real cause",
      "Use two people and hope",
      "Wait until the hospital to recheck circulation",
    ],
    answer: 1,
    rationale:
      "Agitation is a medical exam first. Then five people (one per limb plus one), supine only, and recheck ABCs and distal circulation the whole ride. Chart situation, intervention, outcome.",
    why: [
      "Prone restraint kills — positional asphyxia.",
      "Correct. Treat the cause if you can; then restrain safely.",
      "Five, not two.",
      "Circulation gets rechecked continuously, not at the bay doors.",
    ],
    followUp: {
      prompt: "A safe restraint takes how many people?",
      choices: ["Two", "Five", "Whoever is standing around"],
      answer: 1,
      why: "One per limb plus one. Supine only.",
    },
    keyPoints: [
      {
        text: "First rule out hypoxia, hypoglycemia, and head injury",
        terms: ["hypox", "sugar", "glucose", "head"],
      },
      {
        text: "Five people, supine only, recheck circulation — never prone",
        terms: ["five", "5", "supine", "prone", "recheck"],
      },
    ],
  },
  {
    id: "v2-move-scoop",
    topic: "move",
    prompt:
      "Suspected hip fracture, patient screaming if you try to roll him. Best device?",
    choices: [
      "Stair chair",
      "Scoop stretcher — splits so you do not have to roll",
      "A standing takedown as the default",
      "One-person extremity lift",
    ],
    answer: 1,
    rationale:
      "The scoop splits in half and captures a no-roll patient. Stair chairs are for sitting, walking-wounded stairs. Emergency drags are for fire or gunfire, not a controlled hip.",
    why: [
      "He cannot sit a stair chair on a broken hip.",
      "Correct. No-roll capture is the scoop's job.",
      "Standing takedowns are for a different problem.",
      "A one-person lift on a hip fracture is cruelty and bad medicine.",
    ],
    followUp: {
      prompt: "When IS an emergency drag justified?",
      choices: [
        "Whenever the carry feels heavy",
        "Immediate danger — fire, traffic, gunfire",
        "When the patient prefers it",
      ],
      answer: 1,
      why: "Emergency moves accept spine risk only when staying kills faster.",
    },
    keyPoints: [
      {
        text: "Scoop splits in half — hip fractures and other no-roll patients",
        terms: ["scoop", "split", "no roll", "hip"],
      },
      {
        text: "Stairs = stair chair; water = board or Stokes; everyday = the gurney",
        terms: ["stair", "stokes", "gurney", "device"],
      },
    ],
  },
  {
    id: "v2-meds-rights",
    topic: "meds",
    prompt: "Which of these is one of the five rights?",
    choices: [
      "Right hospital",
      "Right route",
      "Right insurance",
      "Right family member",
    ],
    answer: 1,
    rationale:
      "The five rights: patient, medication, dose, route, time. Time includes expiration and repeat intervals. After giving, chart name, dose, route, time, and the response.",
    why: [
      "Destination is not a medication right.",
      "Correct. Oral, sublingual, IM, inhaled — route is a right.",
      "Billing is not a right of medication administration.",
      "Family does not get a vote on the five rights.",
    ],
    followUp: {
      prompt: "\"Right time\" includes checking:",
      choices: [
        "The expiration date",
        "The pharmacy's hours",
        "When the patient last voted",
      ],
      answer: 0,
      why: "Expired meds fail the right-time check. So do doses given too soon.",
    },
    keyPoints: [
      {
        text: "Five rights: patient, medication, dose, route, time",
        terms: ["patient", "medication", "dose", "route", "time"],
      },
      {
        text: "After giving: chart name, dose, route, time, and the response",
        terms: ["chart", "response", "document"],
      },
    ],
  },
  {
    id: "v2-meds-narcan",
    topic: "meds",
    prompt:
      "Pinpoint pupils, RR 6, track marks. Naloxone will reverse:",
    choices: [
      "A Xanax (benzo) overdose",
      "An opioid overdose — heroin, fentanyl, oxycodone, morphine",
      "Alcohol alone",
      "Any cause of low respiratory rate",
    ],
    answer: 1,
    rationale:
      "Naloxone is an opioid antagonist. It does nothing for benzos or alcohol. It is benign if no opioid is aboard. Expect a combative wake-up. Intranasal works even if they are apneic.",
    why: [
      "Benzos need airway support, not naloxone.",
      "Correct. Opioids only.",
      "Alcohol is outside naloxone's reach.",
      "Low rate has many causes — naloxone is not a universal antidote.",
    ],
    followUp: {
      prompt: "Best field route for naloxone, per typical EMT protocol?",
      choices: [
        "Intranasal — mucosa absorbs it, no needle",
        "An oral tablet",
        "IV push only",
      ],
      answer: 0,
      why: "Intranasal skips needles and works while they are not breathing.",
    },
    keyPoints: [
      {
        text: "Naloxone reverses opioids only — heroin, fentanyl, oxycodone, morphine",
        terms: ["opioid", "fentanyl", "heroin", "antagonist"],
      },
      {
        text: "Useless for benzos or alcohol; watch for the combative wake-up",
        terms: ["benzo", "alcohol", "combative", "wake"],
      },
    ],
  },
  {
    id: "v2-meds-albuterol",
    topic: "meds",
    prompt:
      "Asthma, wheezing, talking in phrases. Albuterol works by:",
    choices: [
      "Constricting vessels (alpha)",
      "Slowing the heart (beta-1 block)",
      "Relaxing bronchial smooth muscle (beta-2 agonist)",
      "Blocking opioid receptors",
    ],
    answer: 2,
    rationale:
      "Albuterol is a beta-2 agonist — bronchodilation for asthma and wheezing. A nebulizer runs about 6 L/min. An MDI must fire on the inhale; kids need a spacer.",
    why: [
      "Alpha constriction does not open a wheeze.",
      "You do not want to block beta-1 here.",
      "Correct. Beta-2 opens the lower airways.",
      "That is naloxone.",
    ],
    followUp: {
      prompt: "The small-volume nebulizer runs on oxygen at about:",
      choices: ["2 L/min", "6 L/min", "15 L/min"],
      answer: 1,
      why: "About 6 L/min — enough to mist continuously into the mask.",
    },
    keyPoints: [
      {
        text: "Albuterol = beta-2 agonist → bronchodilation",
        terms: ["beta-2", "bronchodil", "relax", "wheez"],
      },
      {
        text: "SVN at ~6 L/min; MDI fires on the inhale (spacer for kids)",
        terms: ["6", "svn", "mdi", "spacer"],
      },
    ],
  },
  {
    id: "v2-meds-scope",
    topic: "meds",
    prompt:
      "Which of these is outside typical EMT scope?",
    choices: [
      "Chewed aspirin for ACS",
      "IM epinephrine for anaphylaxis",
      "IV dextrose",
      "Intranasal naloxone",
    ],
    answer: 2,
    rationale:
      "The EMT six: aspirin, nitro, oral glucose, epinephrine, naloxone, albuterol. IV meds, intubation, and IO are paramedic. Assist only with the patient's own prescription — not grandma's nitro.",
    why: [
      "Aspirin is core EMT.",
      "Epi-Pen / IM epi is core EMT.",
      "Correct. Anything through an IV — including dextrose — is ALS.",
      "IN naloxone is standard EMT in most systems.",
    ],
    followUp: {
      prompt: "Grandma offers her nitro for your patient's chest pain. You:",
      choices: [
        "Use it — same drug",
        "Decline — assist only the patient's own prescription",
        "Give half a tablet to be safe",
      ],
      answer: 1,
      why: "Assisted meds must belong to the patient.",
    },
    keyPoints: [
      {
        text: "The EMT six: aspirin, nitro, oral glucose, epinephrine, naloxone, albuterol",
        terms: ["six", "aspirin", "nitro", "glucose", "epi", "naloxone", "albuterol"],
      },
      {
        text: "IV meds, intubation, IO = paramedic; only the patient's own assisted meds",
        terms: ["iv", "paramedic", "als", "own", "prescription"],
      },
    ],
  },
];

const EXAM_BANKS: Record<ExamId, Question[]> = {
  "1": QUESTIONS,
  "2": QUESTIONS_V2,
};

const LETTERS = ["A", "B", "C", "D"] as const;

function choiceWhy(question: Question, index: number): string {
  return question.why[index];
}

function OptionButton({
  letter,
  text,
  why,
  status,
  revealed,
  disabled,
  onClick,
}: {
  letter: string;
  text: string;
  why: string;
  status: "idle" | "correct" | "wrong";
  revealed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const theme = useHostTheme();
  const background =
    status === "correct"
      ? theme.fill.tertiary
      : status === "wrong"
        ? theme.fill.secondary
        : theme.bg.elevated;
  const border =
    status === "correct"
      ? theme.accent.primary
      : status === "wrong"
        ? theme.stroke.primary
        : revealed
          ? theme.stroke.secondary
          : theme.stroke.tertiary;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 8,
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 8,
        border: `1px solid ${border}`,
        background,
        color: theme.text.primary,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span
          style={{
            flex: "0 0 22px",
            fontWeight: 600,
            color: status === "correct" ? theme.accent.primary : theme.text.secondary,
          }}
        >
          {letter}
        </span>
        <span style={{ flex: 1, lineHeight: "20px" }}>{text}</span>
      </span>
      {revealed ? (
        <span
          style={{
            paddingTop: 8,
            borderTop: `1px solid ${theme.stroke.tertiary}`,
            color: theme.text.secondary,
            fontSize: 13,
            lineHeight: "18px",
          }}
        >
          {why}
        </span>
      ) : null}
    </button>
  );
}

function WhyCard({
  question,
  selected,
}: {
  question: Question;
  selected: number;
}) {
  const correct = selected === question.answer;
  return (
    <Stack gap={10}>
      <Callout
        tone={correct ? "success" : "danger"}
        title={correct ? "Correct" : "Incorrect"}
      >
        {correct
          ? question.rationale
          : `You picked ${LETTERS[selected]}. ${choiceWhy(question, selected)}`}
      </Callout>
      {!correct ? (
        <Card>
          <CardHeader>{`Why ${LETTERS[question.answer]} is right`}</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text weight="semibold">
                {LETTERS[question.answer]}. {question.choices[question.answer]}
              </Text>
              <Text>{question.rationale}</Text>
            </Stack>
          </CardBody>
        </Card>
      ) : null}
    </Stack>
  );
}

function MiniOption({
  text,
  status,
  disabled,
  onClick,
}: {
  text: string;
  status: "idle" | "correct" | "wrong";
  disabled: boolean;
  onClick: () => void;
}) {
  const theme = useHostTheme();
  const border =
    status === "correct"
      ? theme.accent.primary
      : status === "wrong"
        ? theme.stroke.primary
        : theme.stroke.tertiary;
  const background =
    status === "correct"
      ? theme.fill.tertiary
      : status === "wrong"
        ? theme.fill.secondary
        : theme.bg.elevated;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "8px 12px",
        borderRadius: 8,
        border: `1px solid ${border}`,
        background,
        color: theme.text.primary,
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        lineHeight: "18px",
      }}
    >
      {text}
    </button>
  );
}

function ConceptCard({
  question,
  state,
  onChange,
}: {
  question: Question;
  state: ConceptState;
  onChange: (next: ConceptState) => void;
}) {
  const dispatch = useCanvasAction();
  const followUp = question.followUp;
  const keyPoints = question.keyPoints;
  const picked = state.followUpPick;
  const ready = state.explanation.trim().length >= 12;

  function coachPrompt(): string {
    return [
      "Coach me on this EMT quiz question. Be brief and direct.",
      `Question: ${question.prompt}`,
      `Correct answer: ${LETTERS[question.answer]}. ${question.choices[question.answer]}`,
      `Quiz rationale: ${question.rationale}`,
      `My own-words explanation: "${state.explanation.trim()}"`,
      "Tell me what I got right and what is missing or wrong, then give me a tight two-sentence version to remember.",
    ].join("\n");
  }

  return (
    <Card>
      <CardHeader>Lock it in</CardHeader>
      <CardBody>
        <Stack gap={14}>
          <Stack gap={8}>
            <Text weight="semibold">Quick check — same concept, new angle</Text>
            <Text>{followUp.prompt}</Text>
            <Stack gap={6}>
              {followUp.choices.map((choice, choiceIndex) => {
                let status: "idle" | "correct" | "wrong" = "idle";
                if (picked !== null) {
                  if (choiceIndex === followUp.answer) status = "correct";
                  else if (choiceIndex === picked) status = "wrong";
                }
                return (
                  <div key={`${question.id}-check-${String(choiceIndex)}`}>
                    <MiniOption
                      text={choice}
                      status={status}
                      disabled={picked !== null}
                      onClick={() =>
                        onChange({ ...state, followUpPick: choiceIndex })
                      }
                    />
                  </div>
                );
              })}
            </Stack>
            {picked !== null ? (
              <Callout
                tone={picked === followUp.answer ? "success" : "danger"}
                title={picked === followUp.answer ? "Right" : "Not quite"}
              >
                {followUp.why}
              </Callout>
            ) : null}
          </Stack>
          <Divider />
          <Stack gap={8}>
            <Text weight="semibold">Explain it back</Text>
            <Text tone="secondary" size="small">
              In your own words, why is {LETTERS[question.answer]} the answer?
              Write it like you are teaching a brand-new EMT.
            </Text>
            <TextArea
              value={state.explanation}
              onChange={(value) =>
                onChange({ ...state, explanation: value, graded: false })
              }
              placeholder="Type your explanation…"
              rows={3}
            />
            <Row gap={8}>
              <Button
                variant="secondary"
                disabled={!ready}
                onClick={() => onChange({ ...state, graded: true })}
              >
                Check my explanation
              </Button>
              <Button
                variant="ghost"
                disabled={!ready}
                onClick={() =>
                  dispatch({ type: "newComposerChat", userPrompt: coachPrompt() })
                }
              >
                Coach me in chat
              </Button>
            </Row>
            {state.graded && keyPoints.length > 0 ? (
              <Stack gap={8}>
                {keyPoints.map((point, pointIndex) => {
                  const covered = coversPoint(state.explanation, point);
                  return (
                    <div key={`${question.id}-point-${String(pointIndex)}`}>
                      <Row gap={8}>
                        <Pill size="sm" active={covered}>
                          {covered ? "Covered" : "Add this"}
                        </Pill>
                        <Text tone={covered ? "secondary" : "primary"}>
                          {point.text}
                        </Text>
                      </Row>
                    </div>
                  );
                })}
                <Text tone="tertiary" size="small">
                  This check matches key words, so judge yourself honestly — or
                  use Coach me in chat for a real grading.
                </Text>
              </Stack>
            ) : null}
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
}

function Recap() {
  return (
    <Stack gap={22}>
      <Callout tone="info" title="How to use this">
        Lock-in lines from the full EMT Notes for quiz sheet — lifespan through
        meds. Say the tables out loud, then run the quiz.
      </Callout>

      <H2>Lifespan</H2>
      <Text>
        Newborn reflexes: Moro, palmar grasp, rooting, sucking. Sunken fontanelle
        = dehydration. Bulging = ICP (meningitis or trauma). Posterior closes by
        ~3 months; anterior stays 9–18 months. Passive immunity until ages 4–6.
      </Text>
      <Text tone="secondary">
        Younger = higher HR/RR, lower BP. Preschoolers breathe with the
        diaphragm. Infant airway is an upside-down cone with a large tongue.
        Premature: lungs lag the heart. Adolescents match adult vitals (60–100,
        12–20, SBP at least 90). Reasoning: pre-conventional → conventional →
        post-conventional. Older (61+): atherosclerosis, stiffer lungs, bigger
        alveoli, weak cough/gag, Type 2 diabetes, hypothyroidism, gallstones.
      </Text>

      <H2>Terms</H2>
      <Table
        headers={["Piece", "Means"]}
        rows={[
          ["dys- / a-, an-", "Difficulty / without"],
          ["hyper- / hypo-", "High / low"],
          ["tachy- / brady-", "Fast / slow"],
          ["-itis / -algia / -megaly / -pathy", "Inflammation / pain / enlargement / disease"],
          ["phasia / phagia", "Speech / swallow"],
          ["cardio / hepat / nephr / neuro / thorac", "Heart / liver / kidney / nerve / chest"],
          ["proximal / distal", "Closer to core / farther — tourniquet and PMS"],
          ["Palmar method", "Patient’s palm ≈ 1% TBSA"],
        ]}
      />
      <Text tone="secondary">
        Directions are the patient’s, anatomic position, palms forward. Supine
        for shock. Fowler / High Fowler for dyspnea. Shock is a circulation
        problem. Cyanosis is hypoxia.
      </Text>

      <H2>Docs and comms</H2>
      <Text>
        Refusal: write everything. They do not have to sign — get a witness.
        Paper error: one line plus initials. Name the receiving nurse. You own
        your certification. 24-hour clock. CHART / SOAP / chronological.
        Courtesy notification on every transport. Closest most appropriate
        facility. Closed-loop orders. SBAR at the bedside. Plain language, not
        EMS codes.
      </Text>
      <Text tone="secondary">
        Base / mobile / portable. Simplex, duplex, multiplex. Repeaters. MDT.
        FCC. Open-ended first. Shannon Weaver “noise” includes culture
        (ethnocentrism vs cultural imposition). Hearing: face them or write.
        Vision: over-verbalize. Unconscious, no ID: exam first — you can still
        give naloxone.
      </Text>

      <H2>Assessment flow</H2>
      <Text>
        Scene. Primary (find and treat life threats). History (OPQRST + SAMPLE).
        Secondary + a full vital set. Field impression and the treatments that
        match it. Reassess until handoff.
      </Text>
      <Text tone="secondary">
        Scene: BSI, safety, MOI/NOI, number, resources. Law for abuse or a scene
        that is heating up. Primary is universal. History waits until they can
        answer. Unconscious with no bystanders, ID, or med list: skip SAMPLE and
        go to the exam.
      </Text>
      <Text>
        High priority / load-and-go: altered mind, airway you had to open or
        suction, you must ventilate, major bleed, shock, ACS-type pain,
        complicated birth. Golden hour = injury to surgery under 1 hour.
        Platinum 10 = arrive-to-drive with only essential ABC work.
      </Text>

      <H2>Sounds and openers</H2>
      <Table
        headers={["Finding", "Means", "Move"]}
        rows={[
          ["Snoring", "Tongue", "Open the airway"],
          ["Gurgling", "Fluid", "Suction"],
          ["Stridor", "Upper swelling", "Think anaphylaxis"],
          ["Wheeze", "Bronchoconstriction", "Chest piece; asthma"],
          ["Crackles", "Fluid in alveoli", "Pulmonary edema"],
          ["Rhonchi", "Mucus", "Pneumonia / congestion"],
          ["Talking / crying", "Patent airway", "Go to breathing"],
          ["Unconscious", "Not protected", "Open and clear first"],
        ]}
      />
      <Text tone="secondary">
        No-spine medical: head-tilt chin-lift. Possible spine or unsure: jaw
        thrust. OPA only if AVPU = U and no gag. NPA if they still gag — never
        through a traumatized head or face. Gag plus facial trauma: hands only.
      </Text>

      <H2>Numbers</H2>
      <Grid columns={2} gap={12}>
        <Table
          headers={["Adult", "Value"]}
          rows={[
            ["RR", "Adult 12–20; child 12–40; infant 30–60"],
            ["Pulse", "60–100"],
            ["Systolic", "90–120 (under 90 = shock concern)"],
            ["SpO₂ target", "94–99%"],
            ["Glucose", "80–120 (under 80 is low)"],
            ["GCS", "3–15 (15 = 4+5+6; none = 3)"],
            ["Peds min SBP <10", "2 × age + 70"],
          ]}
        />
        <Table
          headers={["Device", "Setting"]}
          rows={[
            ["NRB", "10–15 L/min, ~90–95%"],
            ["Cannula", "1–6 L/min, ~24–44% (usually 2–4)"],
            ["BVM O₂", "10–15 L/min all ages"],
            ["Adult bag", "1 every 6 sec (~10/min)"],
            ["Child / infant bag", "1 every 2–3 sec"],
            ["SVN", "6 L/min mist"],
            ["Suction", "10 sec max, then ventilate ~2 min"],
          ]}
        />
      </Grid>
      <Text tone="secondary">
        House-fire sat of 100% is not proof of oxygen — CO can fill the seats.
        Treat the patient, not a “good” number if they are in distress. Unstable
        reassess every 5 minutes. Stable every 15. Any big change: restart MS →
        A → B → C.
      </Text>

      <H2>Breathing patterns</H2>
      <Table
        headers={["Pattern", "Look", "Think"]}
        rows={[
          ["Agonal", "Rare gasping", "Arrest — CPR and bag"],
          ["Cheyne–Stokes", "Wax, wane, pause", "Brain"],
          ["Biot’s / ataxic", "No pattern", "Brainstem"],
          ["Kussmaul", "Deep and fast", "Acidosis — do not slam it"],
        ]}
      />
      <Text>
        Ventilation = air moving. Respiration = gas exchange. Oxygenation = O₂
        on hemoglobin. Normal inhale is negative pressure. A bag is positive
        pressure — over-squeeze means stomach air or a popped lung. C3–4–5
        keeps the diaphragm alive.
      </Text>

      <H2>Circulation</H2>
      <Text>
        Pump, pipes, fluid. CO = SV × HR. Minute volume = tidal volume × rate.
        T–P–M–A. Pulmonary arteries carry deoxygenated blood. Left fail backs
        into the lungs. Right fail backs into the body (JVD, edema).
      </Text>
      <Text tone="secondary">
        Compensated: tachycardic, cool/pale/clammy, BP still holds.
        Decompensated: systolic falls. Solid organs bleed. Hollow organs leak
        and infect. Carotid if unresponsive adult; radial if they talk; brachial
        on infants.
      </Text>
      <Table
        headers={["Receptor", "Does"]}
        rows={[
          ["Alpha", "Vasoconstriction, raises BP"],
          ["Beta-1", "Raises HR and squeeze"],
          ["Beta-2", "Bronchodilation"],
          ["Epi", "Hits all three"],
          ["Albuterol", "Beta-2 only"],
          ["Naloxone", "Opioid antagonist"],
        ]}
      />

      <H2>Position and board</H2>
      <Text>
        Shock: flat supine, no feet-up. Pregnancy ≥20 weeks: left lateral.
        Unresponsive and breathing, no spine: recovery. Needs a BVM: supine.
        Restraints: five people, supine only, after you thought about hypoxia,
        sugar, and head injury.
      </Text>
      <Text tone="secondary">
        Board straps: X on the torso, hips, legs, head last with blocks. Today
        SMR is symptoms, neuro, mechanism, and reliability. Scoop if they
        cannot roll. Stair chair for stairs. Gurney for everyday transport —
        still strap a walking patient.
      </Text>

      <Card>
        <CardHeader trailing="test-world defaults">EMT meds</CardHeader>
        <CardBody>
          <Table
            headers={["Drug", "When", "Hold / dose"]}
            rows={[
              [
                "Aspirin",
                "Possible ACS — platelets slippery, does not dissolve clots",
                "160–325 mg PO chewed",
              ],
              [
                "Nitro",
                "Cardiac chest pain",
                "0.4 mg SL, q5, max 3. Kill if SBP <100, -fil in 24h, head injury",
              ],
              [
                "Oral glucose",
                "Sugar <80 and they can swallow",
                "One tube PO. Out or gurgling = no",
              ],
              [
                "Epinephrine",
                "Anaphylaxis (airway, shock, or ≥2 systems)",
                "0.3 mg IM thigh (peds 0.15). Not simple asthma",
              ],
              [
                "Naloxone",
                "Opioid respiratory depression",
                "Prefer IN. Will not wake alcohol or benzos",
              ],
              [
                "Albuterol",
                "Asthma / bronchospasm",
                "MDI on inhale; SVN 6 L/min",
              ],
            ]}
          />
        </CardBody>
      </Card>
      <Text tone="secondary">
        Exam default if the stem did not give orders: contact medical control,
        give if approved, reassess. Inadequate breathing vs a drug: ventilate
        first. Error: treat the patient, call medical control, chart facts.
      </Text>
    </Stack>
  );
}

function dropIds<T>(current: Record<string, T>, ids: string[]): Record<string, T> {
  const next = { ...current };
  for (const id of ids) delete next[id];
  return next;
}

function Quiz() {
  const [examId] = useCanvasState<ExamId>("exam-id", "1");
  const [filter, setFilter] = useCanvasState<Filter>("sheet-filter", "all");
  const [answers, setAnswers] = useCanvasState<Record<string, number>>(
    "exam-answers",
    {},
  );
  const [indexes, setIndexes] = useCanvasState<Record<ExamId, number>>(
    "exam-indexes",
    { "1": 0, "2": 0 },
  );
  const [concept, setConcept] = useCanvasState<Record<string, ConceptState>>(
    "exam-concept",
    {},
  );
  const [retryByExam, setRetryByExam] = useCanvasState<Record<ExamId, string[]>>(
    "exam-retry",
    { "1": [], "2": [] },
  );

  const questions = EXAM_BANKS[examId];
  const retryIds = retryByExam[examId] ?? [];
  const index = indexes[examId] ?? 0;

  function setIndex(next: number) {
    setIndexes((current) => ({ ...current, [examId]: next }));
  }

  function setRetryIds(next: string[]) {
    setRetryByExam((current) => ({ ...current, [examId]: next }));
  }

  const pool = useMemo(() => {
    if (retryIds.length > 0) {
      return questions.filter((question) => retryIds.includes(question.id));
    }
    if (filter === "missed") {
      return questions.filter((question) => {
        const picked = answers[question.id];
        return picked !== undefined && picked !== question.answer;
      });
    }
    if (filter === "all") return questions;
    return questions.filter((question) => question.topic === filter);
  }, [answers, filter, questions, retryIds]);

  const showingResults = pool.length > 0 && index >= pool.length;
  const safeIndex = pool.length === 0 ? 0 : Math.min(index, pool.length - 1);
  const question = showingResults ? undefined : pool[safeIndex];
  const answeredCount = pool.filter((item) => answers[item.id] !== undefined).length;
  const correctCount = pool.filter((item) => answers[item.id] === item.answer).length;
  const missedCount = questions.filter(
    (item) => answers[item.id] !== undefined && answers[item.id] !== item.answer,
  ).length;
  const selected = question ? answers[question.id] : undefined;
  const revealed = selected !== undefined;

  function chooseFilter(next: Filter) {
    setFilter(next);
    setRetryIds([]);
    setIndex(0);
  }

  function retakeIds(ids: string[], nextRetry: string[]) {
    setAnswers((current) => dropIds(current, ids));
    setConcept((current) => dropIds(current, ids));
    setRetryIds(nextRetry);
    setIndex(0);
  }

  function retakeQuestion(id: string) {
    setAnswers((current) => dropIds(current, [id]));
    setConcept((current) => dropIds(current, [id]));
  }

  function retakePool() {
    const ids = pool.map((item) => item.id);
    retakeIds(ids, retryIds.length > 0 ? ids : []);
  }

  function retakeMissed() {
    const ids = questions
      .filter(
        (item) =>
          answers[item.id] !== undefined && answers[item.id] !== item.answer,
      )
      .map((item) => item.id);
    if (ids.length === 0) return;
    retakeIds(ids, ids);
  }

  function retakeAll() {
    const ids = questions.map((item) => item.id);
    setAnswers((current) => dropIds(current, ids));
    setConcept((current) => dropIds(current, ids));
    setRetryIds([]);
    setFilter("all");
    setIndex(0);
  }

  return (
    <Stack gap={18}>
      <Row gap={8} wrap>
        <Pill active={filter === "all"} onClick={() => chooseFilter("all")}>
          All
        </Pill>
        {(Object.keys(TOPIC_LABEL) as Topic[]).map((topic) => (
          <span key={topic}>
            <Pill active={filter === topic} onClick={() => chooseFilter(topic)}>
              {TOPIC_LABEL[topic]}
            </Pill>
          </span>
        ))}
        <Pill
          active={filter === "missed" && retryIds.length === 0}
          disabled={missedCount === 0}
          onClick={() => chooseFilter("missed")}
        >
          Missed
        </Pill>
        {retryIds.length > 0 ? (
          <Pill active onClick={() => setRetryIds([])}>
            Retry set
          </Pill>
        ) : null}
        <Spacer />
        <Button variant="ghost" onClick={retakeAll}>
          Retake all
        </Button>
      </Row>

      <Grid columns={3} gap={12}>
        <Stat
          value={pool.length === 0 ? "0" : `${safeIndex + 1}/${pool.length}`}
          label="Current item"
        />
        <Stat
          value={`${correctCount}/${answeredCount}`}
          label="Score so far"
          tone={
            answeredCount === 0
              ? undefined
              : correctCount / answeredCount >= 0.8
                ? "success"
                : "warning"
          }
        />
        <Stat value={`${pool.length - answeredCount}`} label="Unanswered" />
      </Grid>

      {retryIds.length > 0 ? (
        <Callout tone="info" title={`Retrying ${retryIds.length} questions`}>
          These are cleared so you can answer them again. Tap Retry set to leave
          this pass.
        </Callout>
      ) : null}

      {pool.length === 0 ? (
        <Callout tone="info" title="No missed questions yet">
          Miss one and it lands here.
        </Callout>
      ) : showingResults ? (
        <Results
          pool={pool}
          answers={answers}
          onJump={(next) => setIndex(next)}
          onRetake={retakePool}
          onRetakeMissed={missedCount > 0 ? retakeMissed : undefined}
        />
      ) : question ? (
        <Stack gap={16}>
          <Pill size="sm" active>
            {TOPIC_LABEL[question.topic]}
          </Pill>
          <H2>{question.prompt}</H2>
          <Stack gap={8}>
            {question.choices.map((choice, choiceIndex) => {
              let status: "idle" | "correct" | "wrong" = "idle";
              if (revealed) {
                if (choiceIndex === question.answer) status = "correct";
                else if (choiceIndex === selected) status = "wrong";
              }
              return (
                <div key={question.id + String(choiceIndex)}>
                  <OptionButton
                    letter={LETTERS[choiceIndex]}
                    text={choice}
                    why={choiceWhy(question, choiceIndex)}
                    status={status}
                    revealed={revealed}
                    disabled={revealed}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: choiceIndex,
                      }))
                    }
                  />
                </div>
              );
            })}
          </Stack>
          {revealed && selected !== undefined ? (
            <Stack gap={12}>
              <WhyCard question={question} selected={selected} />
              <ConceptCard
                question={question}
                state={concept[question.id] ?? EMPTY_CONCEPT}
                onChange={(next) =>
                  setConcept((current) => ({ ...current, [question.id]: next }))
                }
              />
            </Stack>
          ) : (
            <Text tone="tertiary" size="small">
              Tap an answer. Every choice then shows why it is right or wrong.
            </Text>
          )}
          <Row gap={8}>
            <Button
              variant="secondary"
              disabled={safeIndex === 0}
              onClick={() => setIndex(safeIndex - 1)}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              disabled={!revealed}
              onClick={() => setIndex(safeIndex + 1)}
            >
              {safeIndex === pool.length - 1 ? "See results" : "Next"}
            </Button>
            {revealed ? (
              <Button variant="ghost" onClick={() => retakeQuestion(question.id)}>
                Answer again
              </Button>
            ) : null}
          </Row>
        </Stack>
      ) : null}
    </Stack>
  );
}

function Results({
  pool,
  answers,
  onJump,
  onRetake,
  onRetakeMissed,
}: {
  pool: Question[];
  answers: Record<string, number>;
  onJump: (index: number) => void;
  onRetake: () => void;
  onRetakeMissed?: () => void;
}) {
  const correct = pool.filter((question) => answers[question.id] === question.answer);
  const missed = pool.filter((question) => answers[question.id] !== question.answer);
  const percent = Math.round((correct.length / pool.length) * 100);

  return (
    <Stack gap={16}>
      <Callout
        tone={percent >= 80 ? "success" : percent >= 60 ? "warning" : "danger"}
        title={`${correct.length} of ${pool.length} correct (${percent}%)`}
      >
        {percent >= 80
          ? "Solid set. Retake it cold, or run Missed if you want the hard ones again."
          : "Read the miss table, then retake the misses or the whole set."}
      </Callout>
      <Row gap={8}>
        <Button variant="primary" onClick={onRetake}>
          Retake this set
        </Button>
        {onRetakeMissed && missed.length > 0 ? (
          <Button variant="secondary" onClick={onRetakeMissed}>
            Retake missed
          </Button>
        ) : null}
      </Row>
      {missed.length > 0 ? (
        <Card>
          <CardHeader trailing={`${missed.length} to restudy`}>Missed questions</CardHeader>
          <CardBody>
            <Table
              headers={["Question", "Your answer", "Correct", "Why"]}
              rows={missed.map((question) => {
                const picked = answers[question.id];
                return [
                  question.prompt,
                  picked === undefined ? "—" : question.choices[picked],
                  question.choices[question.answer],
                  question.rationale,
                ];
              })}
            />
          </CardBody>
        </Card>
      ) : (
        <Text>No misses in this set.</Text>
      )}
      <Divider />
      <H2>Jump back</H2>
      <Row gap={8} wrap>
        {pool.map((question, questionIndex) => (
          <span key={question.id}>
            <Button
              variant={
                answers[question.id] === question.answer ? "secondary" : "primary"
              }
              onClick={() => onJump(questionIndex)}
            >
              {questionIndex + 1}
            </Button>
          </span>
        ))}
      </Row>
    </Stack>
  );
}

function RecallQuiz() {
  const dispatch = useCanvasAction();
  const [examId] = useCanvasState<ExamId>("exam-id", "1");
  const [filter, setFilter] = useCanvasState<Filter>("sheet-filter", "all");
  const [entries, setEntries] = useCanvasState<Record<string, RecallEntry>>(
    "recall-entries",
    {},
  );
  const [indexes, setIndexes] = useCanvasState<Record<ExamId, number>>(
    "recall-indexes",
    { "1": 0, "2": 0 },
  );
  const [retryByExam, setRetryByExam] = useCanvasState<Record<ExamId, string[]>>(
    "recall-retry",
    { "1": [], "2": [] },
  );

  const questions = EXAM_BANKS[examId];
  const retryIds = retryByExam[examId] ?? [];
  const index = indexes[examId] ?? 0;

  function setIndex(next: number) {
    setIndexes((current) => ({ ...current, [examId]: next }));
  }

  function setRetryIds(next: string[]) {
    setRetryByExam((current) => ({ ...current, [examId]: next }));
  }

  const pool = useMemo(() => {
    if (retryIds.length > 0) {
      return questions.filter((question) => retryIds.includes(question.id));
    }
    if (filter === "missed") {
      return questions.filter((question) => entries[question.id]?.grade === "miss");
    }
    if (filter === "all") return questions;
    return questions.filter((question) => question.topic === filter);
  }, [entries, filter, questions, retryIds]);

  const showingResults = pool.length > 0 && index >= pool.length;
  const safeIndex = pool.length === 0 ? 0 : Math.min(index, pool.length - 1);
  const question = showingResults ? undefined : pool[safeIndex];
  const submittedCount = pool.filter((item) => entries[item.id]?.submitted).length;
  const solidCount = pool.filter((item) => entries[item.id]?.grade === "solid").length;
  const missedCount = questions.filter(
    (item) => entries[item.id]?.grade === "miss",
  ).length;
  const entry = question ? (entries[question.id] ?? EMPTY_RECALL) : EMPTY_RECALL;
  const ready = entry.text.trim().length >= RECALL_MIN_CHARS;
  const revealed = entry.submitted;

  function chooseFilter(next: Filter) {
    setFilter(next);
    setRetryIds([]);
    setIndex(0);
  }

  function patch(id: string, next: RecallEntry) {
    setEntries((current) => ({ ...current, [id]: next }));
  }

  function retakeIds(ids: string[], nextRetry: string[]) {
    setEntries((current) => dropIds(current, ids));
    setRetryIds(nextRetry);
    setIndex(0);
  }

  function retakePool() {
    const ids = pool.map((item) => item.id);
    retakeIds(ids, retryIds.length > 0 ? ids : []);
  }

  function retakeMissed() {
    const ids = questions
      .filter((item) => entries[item.id]?.grade === "miss")
      .map((item) => item.id);
    if (ids.length === 0) return;
    retakeIds(ids, ids);
  }

  function retakeAll() {
    const ids = questions.map((item) => item.id);
    setEntries((current) => dropIds(current, ids));
    setRetryIds([]);
    setFilter("all");
    setIndex(0);
  }

  function submit(currentQuestion: Question) {
    const text = (entries[currentQuestion.id] ?? EMPTY_RECALL).text;
    patch(currentQuestion.id, {
      text,
      submitted: true,
      grade: autoRecallGrade(text, currentQuestion),
    });
  }

  function coachPrompt(currentQuestion: Question, text: string): string {
    return [
      "Coach me on this EMT recall question. Be brief and direct.",
      "There were no multiple-choice options. I had to write the answer.",
      `Question: ${currentQuestion.prompt}`,
      `Model answer: ${currentQuestion.choices[currentQuestion.answer]}`,
      `Rationale: ${currentQuestion.rationale}`,
      `What I wrote: "${text.trim()}"`,
      "Tell me what I got right, what I missed or got wrong, and give me a tight two-sentence version to remember.",
    ].join("\n");
  }

  return (
    <Stack gap={18}>
      <Row gap={8} wrap>
        <Pill active={filter === "all"} onClick={() => chooseFilter("all")}>
          All
        </Pill>
        {(Object.keys(TOPIC_LABEL) as Topic[]).map((topic) => (
          <span key={topic}>
            <Pill active={filter === topic} onClick={() => chooseFilter(topic)}>
              {TOPIC_LABEL[topic]}
            </Pill>
          </span>
        ))}
        <Pill
          active={filter === "missed" && retryIds.length === 0}
          disabled={missedCount === 0}
          onClick={() => chooseFilter("missed")}
        >
          Missed
        </Pill>
        {retryIds.length > 0 ? (
          <Pill active onClick={() => setRetryIds([])}>
            Retry set
          </Pill>
        ) : null}
        <Spacer />
        <Button variant="ghost" onClick={retakeAll}>
          Retake all
        </Button>
      </Row>

      <Grid columns={3} gap={12}>
        <Stat
          value={pool.length === 0 ? "0" : `${safeIndex + 1}/${pool.length}`}
          label="Current item"
        />
        <Stat
          value={`${solidCount}/${submittedCount}`}
          label="Solid so far"
          tone={
            submittedCount === 0
              ? undefined
              : solidCount / submittedCount >= 0.8
                ? "success"
                : "warning"
          }
        />
        <Stat value={`${pool.length - submittedCount}`} label="Unanswered" />
      </Grid>

      {retryIds.length > 0 ? (
        <Callout tone="info" title={`Retrying ${retryIds.length} questions`}>
          Write them again from memory. Tap Retry set to leave this pass.
        </Callout>
      ) : null}

      {pool.length === 0 ? (
        <Callout tone="info" title="No missed recall items yet">
          Mark one off after you write it, and it lands here.
        </Callout>
      ) : showingResults ? (
        <RecallResults
          pool={pool}
          entries={entries}
          onJump={(next) => setIndex(next)}
          onRetake={retakePool}
          onRetakeMissed={missedCount > 0 ? retakeMissed : undefined}
        />
      ) : question ? (
        <Stack gap={16}>
          <Pill size="sm" active>
            {TOPIC_LABEL[question.topic]}
          </Pill>
          <H2>{question.prompt}</H2>
          <Text tone="secondary" size="small">
            No choices. Write the action, the definition, or what this finding
            means — like you are talking to your partner on scene.
          </Text>
          <TextArea
            value={entry.text}
            onChange={(value) =>
              patch(question.id, {
                text: value,
                submitted: false,
                grade: "unset",
              })
            }
            placeholder="Type your answer…"
            rows={4}
          />
          <Row gap={8}>
            <Button
              variant="primary"
              disabled={!ready}
              onClick={() => submit(question)}
            >
              {revealed ? "Check again" : "Check my answer"}
            </Button>
            {revealed ? (
              <Button
                variant="ghost"
                onClick={() =>
                  dispatch({
                    type: "newComposerChat",
                    userPrompt: coachPrompt(question, entry.text),
                  })
                }
              >
                Coach me in chat
              </Button>
            ) : null}
          </Row>
          {revealed ? (
            <Stack gap={12}>
              <Callout
                tone={entry.grade === "solid" ? "success" : "warning"}
                title={
                  entry.grade === "solid"
                    ? "You hit the key points"
                    : "Compare yours to the model"
                }
              >
                {question.choices[question.answer]}
              </Callout>
              <Card>
                <CardHeader>Model answer</CardHeader>
                <CardBody>
                  <Stack gap={8}>
                    <Text>{question.rationale}</Text>
                    <Text tone="tertiary" size="small">
                      Keyword check is a hint, not a real grader. Mark yourself
                      honestly, or use Coach me in chat.
                    </Text>
                  </Stack>
                </CardBody>
              </Card>
              <Stack gap={8}>
                {question.keyPoints.map((point, pointIndex) => {
                  const covered = coversPoint(entry.text, point);
                  return (
                    <div key={`${question.id}-recall-${String(pointIndex)}`}>
                      <Row gap={8}>
                        <Pill size="sm" active={covered}>
                          {covered ? "Covered" : "Add this"}
                        </Pill>
                        <Text tone={covered ? "secondary" : "primary"}>
                          {point.text}
                        </Text>
                      </Row>
                    </div>
                  );
                })}
              </Stack>
              <Row gap={8}>
                <Button
                  variant={entry.grade === "solid" ? "primary" : "secondary"}
                  onClick={() =>
                    patch(question.id, { ...entry, grade: "solid" })
                  }
                >
                  I had this
                </Button>
                <Button
                  variant={entry.grade === "miss" ? "primary" : "secondary"}
                  onClick={() =>
                    patch(question.id, { ...entry, grade: "miss" })
                  }
                >
                  I missed it
                </Button>
              </Row>
            </Stack>
          ) : null}
          <Row gap={8}>
            <Button
              variant="secondary"
              disabled={safeIndex === 0}
              onClick={() => setIndex(safeIndex - 1)}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              disabled={!revealed}
              onClick={() => setIndex(safeIndex + 1)}
            >
              {safeIndex === pool.length - 1 ? "See results" : "Next"}
            </Button>
            {revealed ? (
              <Button
                variant="ghost"
                onClick={() => patch(question.id, EMPTY_RECALL)}
              >
                Write again
              </Button>
            ) : null}
          </Row>
        </Stack>
      ) : null}
    </Stack>
  );
}

function RecallResults({
  pool,
  entries,
  onJump,
  onRetake,
  onRetakeMissed,
}: {
  pool: Question[];
  entries: Record<string, RecallEntry>;
  onJump: (index: number) => void;
  onRetake: () => void;
  onRetakeMissed?: () => void;
}) {
  const solid = pool.filter((question) => entries[question.id]?.grade === "solid");
  const missed = pool.filter((question) => entries[question.id]?.grade === "miss");
  const percent =
    pool.length === 0 ? 0 : Math.round((solid.length / pool.length) * 100);

  return (
    <Stack gap={16}>
      <Callout
        tone={percent >= 80 ? "success" : percent >= 60 ? "warning" : "danger"}
        title={`${solid.length} of ${pool.length} marked solid (${percent}%)`}
      >
        Read the miss table, rewrite the weak ones, or retake the set cold.
      </Callout>
      <Row gap={8}>
        <Button variant="primary" onClick={onRetake}>
          Retake this set
        </Button>
        {onRetakeMissed && missed.length > 0 ? (
          <Button variant="secondary" onClick={onRetakeMissed}>
            Retake missed
          </Button>
        ) : null}
      </Row>
      {missed.length > 0 ? (
        <Card>
          <CardHeader trailing={`${missed.length} to restudy`}>
            Missed recall items
          </CardHeader>
          <CardBody>
            <Table
              headers={["Question", "You wrote", "Model answer"]}
              rows={missed.map((question) => [
                question.prompt,
                entries[question.id]?.text.trim() || "—",
                question.choices[question.answer],
              ])}
            />
          </CardBody>
        </Card>
      ) : (
        <Text>No misses marked in this set.</Text>
      )}
      <Divider />
      <H2>Jump back</H2>
      <Row gap={8} wrap>
        {pool.map((question, questionIndex) => (
          <span key={question.id}>
            <Button
              variant={
                entries[question.id]?.grade === "solid" ? "secondary" : "primary"
              }
              onClick={() => onJump(questionIndex)}
            >
              {questionIndex + 1}
            </Button>
          </span>
        ))}
      </Row>
    </Stack>
  );
}

export default function EmtNotesQuiz() {
  const [mode, setMode] = useCanvasState<Mode>("sheet-mode", "recap");
  const [examId, setExamId] = useCanvasState<ExamId>("exam-id", "1");
  const examSize = EXAM_BANKS[examId].length;

  return (
    <Stack gap={20}>
      <Stack gap={8}>
        <H1>EMT notes recap + quiz</H1>
        <Text tone="secondary">
          Two full 94-question exams on the same material, different stems.
          Quiz is multiple choice. Recall hides the choices — you write the
          answer, then compare it to the model and get coached.
        </Text>
        <Row gap={8} wrap>
          <Pill active={mode === "recap"} onClick={() => setMode("recap")}>
            Recap
          </Pill>
          <Pill active={mode === "quiz"} onClick={() => setMode("quiz")}>
            Quiz
          </Pill>
          <Pill active={mode === "recall"} onClick={() => setMode("recall")}>
            Recall
          </Pill>
          <Spacer />
          {(Object.keys(EXAM_LABEL) as ExamId[]).map((id) => (
            <span key={id}>
              <Pill active={examId === id} onClick={() => setExamId(id)}>
                {EXAM_LABEL[id]} · {EXAM_BANKS[id].length}
              </Pill>
            </span>
          ))}
        </Row>
        {mode === "quiz" || mode === "recall" ? (
          <Text tone="tertiary" size="small">
            {EXAM_LABEL[examId]} · {examSize} questions ·{" "}
            {mode === "recall" ? "write-in" : "multiple choice"}. Progress stays
            on each exam and mode when you switch.
          </Text>
        ) : null}
      </Stack>
      {mode === "recap" ? (
        <Recap />
      ) : mode === "recall" ? (
        <RecallQuiz />
      ) : (
        <Quiz />
      )}
    </Stack>
  );
}
