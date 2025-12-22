// Common medications used in Adult Family Homes
// This data is used for medication autocomplete and reference

export interface MedicationReference {
  name: string;
  genericName?: string;
  commonStrengths: string[];
  form: string;
  route: string;
  category: string;
  commonFrequencies: string[];
  defaultInstructions?: string;
}

export const COMMON_MEDICATIONS: MedicationReference[] = [
  // CARDIOVASCULAR - Blood Pressure & Heart
  { name: "Lisinopril", genericName: "lisinopril", commonStrengths: ["2.5mg", "5mg", "10mg", "20mg", "40mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with or without food" },
  { name: "Amlodipine", genericName: "amlodipine", commonStrengths: ["2.5mg", "5mg", "10mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD"], defaultInstructions: "Take at the same time each day" },
  { name: "Metoprolol", genericName: "metoprolol", commonStrengths: ["25mg", "50mg", "100mg", "200mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with food" },
  { name: "Atenolol", genericName: "atenolol", commonStrengths: ["25mg", "50mg", "100mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD"], defaultInstructions: "Take at the same time each day" },
  { name: "Losartan", genericName: "losartan", commonStrengths: ["25mg", "50mg", "100mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with or without food" },
  { name: "Hydrochlorothiazide", genericName: "hydrochlorothiazide", commonStrengths: ["12.5mg", "25mg", "50mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD"], defaultInstructions: "Take in the morning" },
  { name: "Furosemide", genericName: "furosemide", commonStrengths: ["20mg", "40mg", "80mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take in the morning to avoid nighttime urination" },
  { name: "Spironolactone", genericName: "spironolactone", commonStrengths: ["25mg", "50mg", "100mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with food" },
  { name: "Carvedilol", genericName: "carvedilol", commonStrengths: ["3.125mg", "6.25mg", "12.5mg", "25mg"], form: "tablet", route: "oral", category: "Cardiovascular", commonFrequencies: ["BID"], defaultInstructions: "Take with food" },
  { name: "Diltiazem", genericName: "diltiazem", commonStrengths: ["120mg", "180mg", "240mg", "300mg"], form: "capsule", route: "oral", category: "Cardiovascular", commonFrequencies: ["QD"], defaultInstructions: "Swallow whole, do not crush" },

  // CHOLESTEROL
  { name: "Atorvastatin", genericName: "atorvastatin", commonStrengths: ["10mg", "20mg", "40mg", "80mg"], form: "tablet", route: "oral", category: "Cholesterol", commonFrequencies: ["QD"], defaultInstructions: "Take in the evening" },
  { name: "Simvastatin", genericName: "simvastatin", commonStrengths: ["5mg", "10mg", "20mg", "40mg"], form: "tablet", route: "oral", category: "Cholesterol", commonFrequencies: ["QD"], defaultInstructions: "Take in the evening" },
  { name: "Rosuvastatin", genericName: "rosuvastatin", commonStrengths: ["5mg", "10mg", "20mg", "40mg"], form: "tablet", route: "oral", category: "Cholesterol", commonFrequencies: ["QD"], defaultInstructions: "May take any time of day" },
  { name: "Pravastatin", genericName: "pravastatin", commonStrengths: ["10mg", "20mg", "40mg", "80mg"], form: "tablet", route: "oral", category: "Cholesterol", commonFrequencies: ["QD"], defaultInstructions: "Take at bedtime" },

  // DIABETES
  { name: "Metformin", genericName: "metformin", commonStrengths: ["500mg", "850mg", "1000mg"], form: "tablet", route: "oral", category: "Diabetes", commonFrequencies: ["BID", "TID"], defaultInstructions: "Take with meals" },
  { name: "Glipizide", genericName: "glipizide", commonStrengths: ["5mg", "10mg"], form: "tablet", route: "oral", category: "Diabetes", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take 30 minutes before breakfast" },
  { name: "Glimepiride", genericName: "glimepiride", commonStrengths: ["1mg", "2mg", "4mg"], form: "tablet", route: "oral", category: "Diabetes", commonFrequencies: ["QD"], defaultInstructions: "Take with first main meal" },
  { name: "Januvia", genericName: "sitagliptin", commonStrengths: ["25mg", "50mg", "100mg"], form: "tablet", route: "oral", category: "Diabetes", commonFrequencies: ["QD"], defaultInstructions: "Take with or without food" },
  { name: "Jardiance", genericName: "empagliflozin", commonStrengths: ["10mg", "25mg"], form: "tablet", route: "oral", category: "Diabetes", commonFrequencies: ["QD"], defaultInstructions: "Take in the morning" },
  { name: "Lantus", genericName: "insulin glargine", commonStrengths: ["100 units/mL"], form: "injection", route: "subcutaneous", category: "Diabetes", commonFrequencies: ["QD"], defaultInstructions: "Inject at the same time each day" },
  { name: "Humalog", genericName: "insulin lispro", commonStrengths: ["100 units/mL"], form: "injection", route: "subcutaneous", category: "Diabetes", commonFrequencies: ["TID with meals"], defaultInstructions: "Inject 15 minutes before meals" },
  { name: "Novolog", genericName: "insulin aspart", commonStrengths: ["100 units/mL"], form: "injection", route: "subcutaneous", category: "Diabetes", commonFrequencies: ["TID with meals"], defaultInstructions: "Inject 5-10 minutes before meals" },

  // MENTAL HEALTH - Antidepressants
  { name: "Sertraline", genericName: "sertraline", commonStrengths: ["25mg", "50mg", "100mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD"], defaultInstructions: "Take in the morning or evening" },
  { name: "Escitalopram", genericName: "escitalopram", commonStrengths: ["5mg", "10mg", "20mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD"], defaultInstructions: "Take at the same time each day" },
  { name: "Fluoxetine", genericName: "fluoxetine", commonStrengths: ["10mg", "20mg", "40mg"], form: "capsule", route: "oral", category: "Mental Health", commonFrequencies: ["QD"], defaultInstructions: "Take in the morning" },
  { name: "Citalopram", genericName: "citalopram", commonStrengths: ["10mg", "20mg", "40mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD"], defaultInstructions: "Take in the morning or evening" },
  { name: "Trazodone", genericName: "trazodone", commonStrengths: ["50mg", "100mg", "150mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QHS"], defaultInstructions: "Take at bedtime with food" },
  { name: "Mirtazapine", genericName: "mirtazapine", commonStrengths: ["7.5mg", "15mg", "30mg", "45mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QHS"], defaultInstructions: "Take at bedtime" },
  { name: "Venlafaxine", genericName: "venlafaxine", commonStrengths: ["37.5mg", "75mg", "150mg"], form: "capsule", route: "oral", category: "Mental Health", commonFrequencies: ["QD"], defaultInstructions: "Take with food, swallow whole" },
  { name: "Duloxetine", genericName: "duloxetine", commonStrengths: ["20mg", "30mg", "60mg"], form: "capsule", route: "oral", category: "Mental Health", commonFrequencies: ["QD"], defaultInstructions: "Swallow whole, do not crush" },
  { name: "Bupropion", genericName: "bupropion", commonStrengths: ["75mg", "100mg", "150mg", "300mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD", "BID"], defaultInstructions: "Do not take close to bedtime" },

  // MENTAL HEALTH - Antipsychotics
  { name: "Quetiapine", genericName: "quetiapine", commonStrengths: ["25mg", "50mg", "100mg", "200mg", "300mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD", "BID", "QHS"], defaultInstructions: "Take with or without food" },
  { name: "Risperidone", genericName: "risperidone", commonStrengths: ["0.25mg", "0.5mg", "1mg", "2mg", "3mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with or without food" },
  { name: "Olanzapine", genericName: "olanzapine", commonStrengths: ["2.5mg", "5mg", "7.5mg", "10mg", "15mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD", "QHS"], defaultInstructions: "Take at the same time each day" },
  { name: "Aripiprazole", genericName: "aripiprazole", commonStrengths: ["2mg", "5mg", "10mg", "15mg", "20mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD"], defaultInstructions: "Take at the same time each day" },
  { name: "Haloperidol", genericName: "haloperidol", commonStrengths: ["0.5mg", "1mg", "2mg", "5mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["QD", "BID", "TID"], defaultInstructions: "Take with food" },

  // MENTAL HEALTH - Anxiolytics/Sedatives
  { name: "Lorazepam", genericName: "lorazepam", commonStrengths: ["0.5mg", "1mg", "2mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["BID", "TID", "PRN"], defaultInstructions: "May cause drowsiness" },
  { name: "Alprazolam", genericName: "alprazolam", commonStrengths: ["0.25mg", "0.5mg", "1mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["TID", "PRN"], defaultInstructions: "May cause drowsiness" },
  { name: "Clonazepam", genericName: "clonazepam", commonStrengths: ["0.5mg", "1mg", "2mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["BID", "TID"], defaultInstructions: "Do not stop abruptly" },
  { name: "Buspirone", genericName: "buspirone", commonStrengths: ["5mg", "7.5mg", "10mg", "15mg"], form: "tablet", route: "oral", category: "Mental Health", commonFrequencies: ["BID", "TID"], defaultInstructions: "Take at the same times each day" },

  // DEMENTIA/ALZHEIMER'S
  { name: "Donepezil", genericName: "donepezil", commonStrengths: ["5mg", "10mg", "23mg"], form: "tablet", route: "oral", category: "Dementia", commonFrequencies: ["QD"], defaultInstructions: "Take at bedtime" },
  { name: "Memantine", genericName: "memantine", commonStrengths: ["5mg", "10mg", "28mg ER"], form: "tablet", route: "oral", category: "Dementia", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with or without food" },
  { name: "Rivastigmine", genericName: "rivastigmine", commonStrengths: ["1.5mg", "3mg", "4.5mg", "6mg"], form: "capsule", route: "oral", category: "Dementia", commonFrequencies: ["BID"], defaultInstructions: "Take with meals" },
  { name: "Exelon Patch", genericName: "rivastigmine patch", commonStrengths: ["4.6mg/24hr", "9.5mg/24hr", "13.3mg/24hr"], form: "patch", route: "transdermal", category: "Dementia", commonFrequencies: ["QD"], defaultInstructions: "Apply to clean, dry skin. Rotate sites." },

  // PAIN MEDICATIONS
  { name: "Acetaminophen", genericName: "acetaminophen", commonStrengths: ["325mg", "500mg", "650mg", "1000mg"], form: "tablet", route: "oral", category: "Pain", commonFrequencies: ["Q4-6H PRN", "TID", "QID"], defaultInstructions: "Do not exceed 3000mg daily" },
  { name: "Ibuprofen", genericName: "ibuprofen", commonStrengths: ["200mg", "400mg", "600mg", "800mg"], form: "tablet", route: "oral", category: "Pain", commonFrequencies: ["Q6-8H PRN", "TID"], defaultInstructions: "Take with food" },
  { name: "Naproxen", genericName: "naproxen", commonStrengths: ["220mg", "250mg", "375mg", "500mg"], form: "tablet", route: "oral", category: "Pain", commonFrequencies: ["BID", "Q12H PRN"], defaultInstructions: "Take with food" },
  { name: "Tramadol", genericName: "tramadol", commonStrengths: ["50mg", "100mg"], form: "tablet", route: "oral", category: "Pain", commonFrequencies: ["Q4-6H PRN", "TID", "QID"], defaultInstructions: "May cause drowsiness" },
  { name: "Gabapentin", genericName: "gabapentin", commonStrengths: ["100mg", "300mg", "400mg", "600mg", "800mg"], form: "capsule", route: "oral", category: "Pain/Nerve", commonFrequencies: ["TID"], defaultInstructions: "May cause drowsiness" },
  { name: "Pregabalin", genericName: "pregabalin", commonStrengths: ["25mg", "50mg", "75mg", "100mg", "150mg"], form: "capsule", route: "oral", category: "Pain/Nerve", commonFrequencies: ["BID", "TID"], defaultInstructions: "Take with or without food" },
  { name: "Lidocaine Patch", genericName: "lidocaine 5%", commonStrengths: ["5%"], form: "patch", route: "topical", category: "Pain", commonFrequencies: ["QD"], defaultInstructions: "Apply to intact skin. 12 hours on, 12 hours off." },
  { name: "Diclofenac Gel", genericName: "diclofenac", commonStrengths: ["1%"], form: "gel", route: "topical", category: "Pain", commonFrequencies: ["QID"], defaultInstructions: "Apply to affected area. Wash hands after." },

  // GASTROINTESTINAL
  { name: "Omeprazole", genericName: "omeprazole", commonStrengths: ["10mg", "20mg", "40mg"], form: "capsule", route: "oral", category: "Gastrointestinal", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take 30 minutes before breakfast" },
  { name: "Pantoprazole", genericName: "pantoprazole", commonStrengths: ["20mg", "40mg"], form: "tablet", route: "oral", category: "Gastrointestinal", commonFrequencies: ["QD"], defaultInstructions: "Take before a meal" },
  { name: "Famotidine", genericName: "famotidine", commonStrengths: ["10mg", "20mg", "40mg"], form: "tablet", route: "oral", category: "Gastrointestinal", commonFrequencies: ["BID", "QHS"], defaultInstructions: "Take with or without food" },
  { name: "Docusate Sodium", genericName: "docusate", commonStrengths: ["100mg", "250mg"], form: "capsule", route: "oral", category: "Gastrointestinal", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with a full glass of water" },
  { name: "Senna", genericName: "sennosides", commonStrengths: ["8.6mg", "17.2mg"], form: "tablet", route: "oral", category: "Gastrointestinal", commonFrequencies: ["QHS", "BID"], defaultInstructions: "Take at bedtime for morning effect" },
  { name: "Polyethylene Glycol", genericName: "MiraLAX", commonStrengths: ["17g"], form: "powder", route: "oral", category: "Gastrointestinal", commonFrequencies: ["QD"], defaultInstructions: "Mix in 8 oz of liquid" },
  { name: "Metoclopramide", genericName: "metoclopramide", commonStrengths: ["5mg", "10mg"], form: "tablet", route: "oral", category: "Gastrointestinal", commonFrequencies: ["QID"], defaultInstructions: "Take 30 minutes before meals and at bedtime" },
  { name: "Ondansetron", genericName: "ondansetron", commonStrengths: ["4mg", "8mg"], form: "tablet", route: "oral", category: "Gastrointestinal", commonFrequencies: ["Q8H PRN", "TID"], defaultInstructions: "May dissolve on tongue or swallow" },

  // THYROID
  { name: "Levothyroxine", genericName: "levothyroxine", commonStrengths: ["25mcg", "50mcg", "75mcg", "88mcg", "100mcg", "112mcg", "125mcg", "150mcg"], form: "tablet", route: "oral", category: "Thyroid", commonFrequencies: ["QD"], defaultInstructions: "Take on empty stomach, 30-60 min before breakfast" },
  { name: "Synthroid", genericName: "levothyroxine", commonStrengths: ["25mcg", "50mcg", "75mcg", "88mcg", "100mcg", "125mcg"], form: "tablet", route: "oral", category: "Thyroid", commonFrequencies: ["QD"], defaultInstructions: "Take on empty stomach in the morning" },

  // BLOOD THINNERS
  { name: "Warfarin", genericName: "warfarin", commonStrengths: ["1mg", "2mg", "2.5mg", "3mg", "4mg", "5mg", "7.5mg", "10mg"], form: "tablet", route: "oral", category: "Anticoagulant", commonFrequencies: ["QD"], defaultInstructions: "Take at the same time each day. Requires regular INR monitoring." },
  { name: "Eliquis", genericName: "apixaban", commonStrengths: ["2.5mg", "5mg"], form: "tablet", route: "oral", category: "Anticoagulant", commonFrequencies: ["BID"], defaultInstructions: "Take with or without food" },
  { name: "Xarelto", genericName: "rivaroxaban", commonStrengths: ["10mg", "15mg", "20mg"], form: "tablet", route: "oral", category: "Anticoagulant", commonFrequencies: ["QD"], defaultInstructions: "Take with evening meal" },
  { name: "Aspirin", genericName: "aspirin", commonStrengths: ["81mg", "325mg"], form: "tablet", route: "oral", category: "Antiplatelet", commonFrequencies: ["QD"], defaultInstructions: "Take with food" },
  { name: "Plavix", genericName: "clopidogrel", commonStrengths: ["75mg"], form: "tablet", route: "oral", category: "Antiplatelet", commonFrequencies: ["QD"], defaultInstructions: "Take with or without food" },

  // RESPIRATORY
  { name: "Albuterol Inhaler", genericName: "albuterol", commonStrengths: ["90mcg/puff"], form: "inhaler", route: "inhalation", category: "Respiratory", commonFrequencies: ["Q4-6H PRN"], defaultInstructions: "Shake well before use. 2 puffs PRN." },
  { name: "Fluticasone Inhaler", genericName: "fluticasone", commonStrengths: ["44mcg", "110mcg", "220mcg"], form: "inhaler", route: "inhalation", category: "Respiratory", commonFrequencies: ["BID"], defaultInstructions: "Rinse mouth after use" },
  { name: "Tiotropium", genericName: "Spiriva", commonStrengths: ["18mcg"], form: "capsule for inhalation", route: "inhalation", category: "Respiratory", commonFrequencies: ["QD"], defaultInstructions: "Use HandiHaler device. Do not swallow capsules." },
  { name: "Montelukast", genericName: "montelukast", commonStrengths: ["4mg", "5mg", "10mg"], form: "tablet", route: "oral", category: "Respiratory", commonFrequencies: ["QD"], defaultInstructions: "Take in the evening" },
  { name: "Prednisone", genericName: "prednisone", commonStrengths: ["1mg", "2.5mg", "5mg", "10mg", "20mg", "50mg"], form: "tablet", route: "oral", category: "Corticosteroid", commonFrequencies: ["QD", "Taper schedule"], defaultInstructions: "Take with food. Do not stop abruptly." },

  // SEIZURE/MOOD STABILIZERS
  { name: "Levetiracetam", genericName: "levetiracetam", commonStrengths: ["250mg", "500mg", "750mg", "1000mg"], form: "tablet", route: "oral", category: "Anticonvulsant", commonFrequencies: ["BID"], defaultInstructions: "Take with or without food" },
  { name: "Phenytoin", genericName: "phenytoin", commonStrengths: ["30mg", "100mg"], form: "capsule", route: "oral", category: "Anticonvulsant", commonFrequencies: ["QD", "TID"], defaultInstructions: "Take with food. Do not stop abruptly." },
  { name: "Valproic Acid", genericName: "valproate", commonStrengths: ["125mg", "250mg", "500mg"], form: "capsule", route: "oral", category: "Anticonvulsant", commonFrequencies: ["BID", "TID"], defaultInstructions: "Take with food" },
  { name: "Lamotrigine", genericName: "lamotrigine", commonStrengths: ["25mg", "100mg", "150mg", "200mg"], form: "tablet", route: "oral", category: "Anticonvulsant", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with or without food" },
  { name: "Lithium", genericName: "lithium carbonate", commonStrengths: ["150mg", "300mg", "450mg", "600mg"], form: "capsule", route: "oral", category: "Mood Stabilizer", commonFrequencies: ["BID", "TID"], defaultInstructions: "Take with food. Maintain consistent salt/water intake. Requires regular lab monitoring." },

  // VITAMINS & SUPPLEMENTS
  { name: "Vitamin D3", genericName: "cholecalciferol", commonStrengths: ["400 IU", "1000 IU", "2000 IU", "5000 IU", "50000 IU"], form: "tablet", route: "oral", category: "Vitamin", commonFrequencies: ["QD", "Weekly"], defaultInstructions: "Take with food for better absorption" },
  { name: "Vitamin B12", genericName: "cyanocobalamin", commonStrengths: ["100mcg", "500mcg", "1000mcg", "2500mcg"], form: "tablet", route: "oral", category: "Vitamin", commonFrequencies: ["QD"], defaultInstructions: "May take with or without food" },
  { name: "Folic Acid", genericName: "folic acid", commonStrengths: ["400mcg", "800mcg", "1mg"], form: "tablet", route: "oral", category: "Vitamin", commonFrequencies: ["QD"], defaultInstructions: "Take with or without food" },
  { name: "Calcium + Vitamin D", genericName: "calcium carbonate with D3", commonStrengths: ["600mg/400IU", "600mg/800IU"], form: "tablet", route: "oral", category: "Supplement", commonFrequencies: ["BID"], defaultInstructions: "Take with food" },
  { name: "Ferrous Sulfate", genericName: "iron", commonStrengths: ["325mg"], form: "tablet", route: "oral", category: "Supplement", commonFrequencies: ["QD", "BID", "TID"], defaultInstructions: "Take on empty stomach. May take with vitamin C for absorption." },
  { name: "Potassium Chloride", genericName: "potassium", commonStrengths: ["10mEq", "20mEq"], form: "tablet", route: "oral", category: "Electrolyte", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with food and a full glass of water" },
  { name: "Magnesium Oxide", genericName: "magnesium", commonStrengths: ["400mg", "500mg"], form: "tablet", route: "oral", category: "Supplement", commonFrequencies: ["QD", "BID"], defaultInstructions: "Take with food" },

  // ANTIBIOTICS (common for AFH residents)
  { name: "Amoxicillin", genericName: "amoxicillin", commonStrengths: ["250mg", "500mg", "875mg"], form: "capsule", route: "oral", category: "Antibiotic", commonFrequencies: ["BID", "TID"], defaultInstructions: "Take with or without food. Complete full course." },
  { name: "Amoxicillin-Clavulanate", genericName: "Augmentin", commonStrengths: ["500mg/125mg", "875mg/125mg"], form: "tablet", route: "oral", category: "Antibiotic", commonFrequencies: ["BID"], defaultInstructions: "Take at the start of a meal" },
  { name: "Ciprofloxacin", genericName: "ciprofloxacin", commonStrengths: ["250mg", "500mg", "750mg"], form: "tablet", route: "oral", category: "Antibiotic", commonFrequencies: ["BID"], defaultInstructions: "Take with plenty of water. Avoid dairy products." },
  { name: "Sulfamethoxazole-Trimethoprim", genericName: "Bactrim DS", commonStrengths: ["800mg/160mg"], form: "tablet", route: "oral", category: "Antibiotic", commonFrequencies: ["BID"], defaultInstructions: "Take with plenty of water" },
  { name: "Nitrofurantoin", genericName: "Macrobid", commonStrengths: ["100mg"], form: "capsule", route: "oral", category: "Antibiotic", commonFrequencies: ["BID"], defaultInstructions: "Take with food" },

  // URINARY/BLADDER
  { name: "Tamsulosin", genericName: "tamsulosin", commonStrengths: ["0.4mg"], form: "capsule", route: "oral", category: "Urinary", commonFrequencies: ["QD"], defaultInstructions: "Take 30 minutes after the same meal each day" },
  { name: "Finasteride", genericName: "finasteride", commonStrengths: ["5mg"], form: "tablet", route: "oral", category: "Urinary", commonFrequencies: ["QD"], defaultInstructions: "Take with or without food" },
  { name: "Oxybutynin", genericName: "oxybutynin", commonStrengths: ["5mg", "10mg", "15mg"], form: "tablet", route: "oral", category: "Urinary", commonFrequencies: ["BID", "TID"], defaultInstructions: "May cause dry mouth and constipation" },
  { name: "Tolterodine", genericName: "tolterodine", commonStrengths: ["2mg", "4mg"], form: "capsule", route: "oral", category: "Urinary", commonFrequencies: ["QD"], defaultInstructions: "May cause dry mouth" },

  // TOPICAL/SKIN
  { name: "Triamcinolone Cream", genericName: "triamcinolone 0.1%", commonStrengths: ["0.025%", "0.1%", "0.5%"], form: "cream", route: "topical", category: "Dermatologic", commonFrequencies: ["BID", "TID"], defaultInstructions: "Apply thin layer to affected area" },
  { name: "Hydrocortisone Cream", genericName: "hydrocortisone", commonStrengths: ["0.5%", "1%", "2.5%"], form: "cream", route: "topical", category: "Dermatologic", commonFrequencies: ["BID", "TID"], defaultInstructions: "Apply to affected area" },
  { name: "Mupirocin Ointment", genericName: "mupirocin 2%", commonStrengths: ["2%"], form: "ointment", route: "topical", category: "Antibiotic", commonFrequencies: ["TID"], defaultInstructions: "Apply to affected area" },
  { name: "Silver Sulfadiazine", genericName: "silver sulfadiazine 1%", commonStrengths: ["1%"], form: "cream", route: "topical", category: "Wound Care", commonFrequencies: ["QD", "BID"], defaultInstructions: "Apply 1/16 inch layer to wound" },
  { name: "Nystatin Powder", genericName: "nystatin", commonStrengths: ["100,000 units/g"], form: "powder", route: "topical", category: "Antifungal", commonFrequencies: ["BID", "TID"], defaultInstructions: "Apply to affected area" },
  { name: "Clotrimazole Cream", genericName: "clotrimazole 1%", commonStrengths: ["1%"], form: "cream", route: "topical", category: "Antifungal", commonFrequencies: ["BID"], defaultInstructions: "Apply to affected area" },

  // EYE DROPS
  { name: "Artificial Tears", genericName: "lubricant eye drops", commonStrengths: ["0.5%"], form: "solution", route: "ophthalmic", category: "Eye Care", commonFrequencies: ["PRN", "QID"], defaultInstructions: "Instill 1-2 drops in affected eye(s)" },
  { name: "Latanoprost", genericName: "latanoprost", commonStrengths: ["0.005%"], form: "solution", route: "ophthalmic", category: "Eye Care", commonFrequencies: ["QHS"], defaultInstructions: "Instill 1 drop in affected eye(s) at bedtime" },
  { name: "Timolol Eye Drops", genericName: "timolol", commonStrengths: ["0.25%", "0.5%"], form: "solution", route: "ophthalmic", category: "Eye Care", commonFrequencies: ["BID"], defaultInstructions: "Instill 1 drop in affected eye(s)" },
];

// Helper function to search medications by name
export function searchMedications(query: string, limit: number = 10): MedicationReference[] {
  const lowerQuery = query.toLowerCase();
  return COMMON_MEDICATIONS
    .filter(med =>
      med.name.toLowerCase().includes(lowerQuery) ||
      (med.genericName && med.genericName.toLowerCase().includes(lowerQuery))
    )
    .slice(0, limit);
}

// Helper function to get medications by category
export function getMedicationsByCategory(category: string): MedicationReference[] {
  return COMMON_MEDICATIONS.filter(med => med.category === category);
}

// Get unique categories
export function getMedicationCategories(): string[] {
  return Array.from(new Set(COMMON_MEDICATIONS.map(med => med.category)));
}
