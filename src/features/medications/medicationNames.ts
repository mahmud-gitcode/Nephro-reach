/* ==========================================================================
   Medication names to suggest while typing
   --------------------------------------------------------------------------
   The client (2026-10-12): "You start typing amlodipine, and amlodipine
   populates" — the phone autocorrects drug names into something else. Common
   medications for people on dialysis or with CKD, generic first with the
   brand in brackets, as the member's bottle may say either.

   A starting list only. With the backend this becomes a drug-database API
   (e.g. RxNorm) and every name a pharmacy dispenses can be found.
   ========================================================================== */

export const MEDICATION_NAMES: readonly string[] = [
  // Blood pressure and fluid
  "Amlodipine (Norvasc)",
  "Nifedipine (Procardia)",
  "Losartan (Cozaar)",
  "Valsartan (Diovan)",
  "Irbesartan (Avapro)",
  "Lisinopril (Zestril)",
  "Enalapril (Vasotec)",
  "Ramipril (Altace)",
  "Carvedilol (Coreg)",
  "Metoprolol tartrate (Lopressor)",
  "Metoprolol succinate (Toprol XL)",
  "Labetalol",
  "Hydralazine",
  "Clonidine (Catapres)",
  "Minoxidil",
  "Doxazosin (Cardura)",
  "Furosemide (Lasix)",
  "Torsemide",
  "Bumetanide (Bumex)",
  "Spironolactone (Aldactone)",
  "Hydrochlorothiazide",
  "Chlorthalidone",
  "Midodrine",
  // Phosphate binders
  "Sevelamer carbonate (Renvela)",
  "Sevelamer hydrochloride (Renagel)",
  "Calcium acetate (PhosLo)",
  "Lanthanum carbonate (Fosrenol)",
  "Ferric citrate (Auryxia)",
  "Sucroferric oxyhydroxide (Velphoro)",
  "Tenapanor (Xphozah)",
  // Bone and mineral
  "Calcitriol (Rocaltrol)",
  "Paricalcitol (Zemplar)",
  "Doxercalciferol (Hectorol)",
  "Cinacalcet (Sensipar)",
  "Ergocalciferol (Vitamin D2)",
  "Cholecalciferol (Vitamin D3)",
  // Anemia and iron
  "Epoetin alfa (Epogen)",
  "Darbepoetin alfa (Aranesp)",
  "Iron sucrose (Venofer)",
  "Ferrous sulfate",
  // Potassium
  "Patiromer (Veltassa)",
  "Sodium zirconium cyclosilicate (Lokelma)",
  "Sodium polystyrene sulfonate (Kayexalate)",
  "Sodium bicarbonate",
  // Diabetes
  "Metformin (Glucophage)",
  "Insulin glargine (Lantus)",
  "Insulin lispro (Humalog)",
  "Insulin aspart (Novolog)",
  "Glipizide (Glucotrol)",
  "Linagliptin (Tradjenta)",
  "Semaglutide (Ozempic)",
  "Dulaglutide (Trulicity)",
  "Empagliflozin (Jardiance)",
  "Dapagliflozin (Farxiga)",
  "Canagliflozin (Invokana)",
  "Finerenone (Kerendia)",
  // Heart and blood
  "Atorvastatin (Lipitor)",
  "Rosuvastatin (Crestor)",
  "Simvastatin (Zocor)",
  "Aspirin",
  "Clopidogrel (Plavix)",
  "Apixaban (Eliquis)",
  "Warfarin (Coumadin)",
  // Transplant
  "Tacrolimus (Prograf)",
  "Mycophenolate (CellCept)",
  "Prednisone",
  // Everyday
  "Renal multivitamin (Nephro-Vite)",
  "Gabapentin (Neurontin)",
  "Pregabalin (Lyrica)",
  "Difelikefalin (Korsuva)",
  "Hydroxyzine (Atarax)",
  "Omeprazole (Prilosec)",
  "Pantoprazole (Protonix)",
  "Famotidine (Pepcid)",
  "Allopurinol (Zyloprim)",
  "Febuxostat (Uloric)",
  "Levothyroxine (Synthroid)",
  "Sertraline (Zoloft)",
  "Acetaminophen (Tylenol)",
  "Ondansetron (Zofran)",
];
