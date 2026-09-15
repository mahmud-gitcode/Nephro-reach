**NephroReach**

**Dialysis Logs & Management Architecture**

*Developer Functional Guide — Treatment Log, Beyond the Chair, and Dialysis Management*

Purpose: clearly separate daily dialysis treatment documentation, between-treatment recovery tracking, and long-term dialysis management so patients do not enter the same information in multiple places.

# **1\. Core Navigation Structure**

**Dialysis Treatment Log** \= What happened during dialysis.  **Beyond the Chair** \= What happens after dialysis and between treatments.  **Dialysis Management** \= How the patient's overall dialysis care is organized.

These should be three separate main areas. Beyond the Chair should be its own tab, not a subsection of the Treatment Log or Dialysis Management.

# **2\. Dialysis Treatment Log**

This is the day-to-day treatment documentation area. It records what actually occurred during a specific dialysis treatment or PD exchange. Every treatment entry should have a date/time and become part of the patient's treatment history.

## **Home Hemodialysis / Hemodialysis Treatment Entry**

* Treatment date and start time  
* Prescribed treatment duration and actual treatment duration  
* Pre-treatment and post-treatment weight  
* Pre-treatment and post-treatment blood pressure  
* Pre-treatment and post-treatment heart rate  
* Temperature  
* Blood flow rate (mL/min)  
* Dialysate flow rate (mL/min)  
* UF goal (L)  
* Actual fluid removed (L)  
* Medications given during that treatment  
* Treatment complications or issues  
* Treatment status: completed, shortened, missed, or rescheduled  
* Treatment notes  
* Optional treatment-related access/site photo when there is a concern

## **Peritoneal Dialysis Treatment Entry**

* PD modality displayed from current prescription: CAPD, APD/Cycler, or other configured modality  
* Exchange/treatment time  
* Fill volume  
* Dwell time  
* Drain volume  
* Calculated ultrafiltration (UF)  
* Solution concentration/type  
* Medications added to solution when applicable  
* Effluent assessment: clear, slightly cloudy, cloudy, bloody, other  
* Fibrin: yes/no  
* Treatment issues/notes  
* Treatment status  
* Optional treatment-related catheter/exit-site photo

Important: the Treatment Log should focus on the treatment itself. Post-treatment recovery and symptoms that occur later belong in Beyond the Chair.

# **3\. Beyond the Chair — Separate Main Tab**

Beyond the Chair is NephroReach's between-treatment recovery tracking area. It follows what happens after the patient leaves the dialysis chair or finishes a home treatment and continues until the next treatment.

**Suggested page subtitle:** Track how you feel, recover, and manage your health between dialysis treatments.

## **Recovery Check-In**

* How do you feel after treatment / after getting home?  
* Recovery time: less than 1 hour; 1–2 hours; 2–4 hours; 4–6 hours; more than 6 hours; still not recovered  
* Time patient reports feeling back to normal  
* Fatigue/energy level  
* Ability to resume usual activities

## **Between-Treatment Tracking**

* Symptoms between treatments, such as dizziness, weakness, cramping, shortness of breath, swelling, nausea, headache, itching, or other configured symptoms  
* Between-treatment blood pressure  
* Between-treatment weight and fluid status  
* Urine output / 24-hour urine output when being tracked  
* Appetite and relevant wellness check-ins  
* Patient-entered notes about how they felt between treatments

## **Recovery Trends**

The system should be able to trend average recovery time, changes in recovery, symptom frequency, between-treatment weight changes, BP trends, and how the patient typically feels on treatment versus non-treatment days.

# **4\. Dialysis Management**

Dialysis Management is the patient's dialysis command center. It contains what is prescribed, planned, scheduled, coordinated, maintained, or communicated — not the details of each completed treatment.

## **Current Dialysis Prescription / Orders**

* Current modality  
* Treatment days  
* Scheduled treatment time(s)  
* Prescribed treatment duration  
* Current HD/HHD prescription parameters as appropriate  
* Current PD prescription: fill volume, dwell time, number of exchanges, solution types and other prescribed parameters  
* Current access type  
* Dialysis facility  
* Nephrologist/provider  
* Prescription last-updated date

## **Schedule & Reminders**

* Recurring treatment schedule  
* Patient-configurable reminder before treatment  
* Home visit appointments  
* Nurse/provider visits  
* Biomedical/water-system visits  
* Other dialysis-related appointments and reminders

## **Travel Dialysis Management**

Travel dialysis belongs under Dialysis Management. The patient should be able to submit a travel request with destination, travel dates, treatments needed while away, and required contact/details.

Workflow: Patient submits request → home dialysis facility receives alert → facility coordinates transient dialysis → facility updates request status → patient receives confirmation/status in NephroReach.

Suggested statuses: Submitted → Facility Reviewing → Records Sent → Placement Pending → Confirmed → Completed/Closed.

## **Questions & Communication With the Dialysis Team**

Move the general Communication With Care Team function into Dialysis Management.

* Recipient: Nurse, Nephrologist/NP/PA, Dietitian, Social Worker, Home Therapy Nurse, Access Coordinator, Other  
* Reason: Treatment, Symptoms, Medication, Access, Lab Results, Diet/Fluid, Supplies, Travel, Scheduling, Other  
* Message field and optional attachment/photo  
* Caregiver access only according to permissions granted by the patient

## **Supplies**

Both HHD and PD monthly supply checklists belong under Dialysis Management → Supplies. The checklist should automatically match the patient's modality and support quantities on hand, quantities needed, Low/Missing status, notes, monthly reminders, and supply requests.

## **Home Equipment / Machine & Water System**

For HHD, machine and water-system management belongs under Dialysis Management → Home Equipment. Include machine type/serial number, water system, disinfection history, filter changes, maintenance/service history, next due dates, and alerts.

## **Home Visits**

Home visits belong under Dialysis Management because they are appointments/care coordination. Include date, time, provider type, purpose, reminder, status, and notes.

## **Access / Exit-Site Management & Photos**

Use two photo behaviors: a photo related to a specific treatment concern can be attached to that Treatment Log entry; the longitudinal access/catheter/exit-site photo history should be accessible under Dialysis Management → Access & Site Management.

# **5\. Developer Placement Matrix**

| Dialysis Treatment Log | Beyond the Chair | Dialysis Management |
| :---- | :---- | :---- |
| Treatment date/time | Post-treatment recovery | Current dialysis prescription/orders |
| Treatment duration | Recovery time | Treatment schedule |
| Pre/post treatment weight | How patient feels after getting home | Treatment reminders |
| Pre/post BP, HR, temperature | Symptoms between treatments | Dialysis facility/care team |
| UF goal / actual fluid removed | Fatigue and energy | Travel dialysis requests/status |
| HD/HHD treatment parameters | Between-treatment BP | Home visits |
| PD exchanges and UF | Between-treatment weight/fluid | Supply management |
| PD effluent assessment | Urine output trends | HHD machine/water system |
| Medications during treatment | Recovery trends | Access/site management |
| Treatment complications | Between-treatment wellness notes | Questions/messages for care team |
| Completed/shortened/missed status | How long until back to normal | Caregiver permissions |
| Treatment notes | Non-treatment-day check-ins | Care coordination/documents |
| Treatment-related photo | — | Longitudinal access/site photo history |

# **6\. Backend Rules — Avoid Duplicate Data**

* The prescription is stored once in Dialysis Management. A new Treatment Log should automatically pull the prescribed settings as reference/default values.  
* The treatment schedule is stored in Dialysis Management and can generate expected treatment dates in the Treatment Log.  
* For PD, Dialysis Management stores the current prescription; the Treatment Log records what the patient actually performed.  
* Post-treatment values from the Treatment Log can become the starting point for Beyond the Chair without requiring re-entry.  
* The next pre-treatment weight can close the between-treatment interval, allowing NephroReach to calculate between-treatment weight change.  
* Data shown in multiple places should be referenced from the source record rather than copied into separate independent records.  
* Reports and exports should be able to combine Treatment Log, Beyond the Chair, and Dialysis Management data while preserving the source and timestamp of each record.

# **7\. Final Developer Rule**

**Dialysis Management \= what is planned, prescribed, organized, coordinated, or maintained.**  
**Dialysis Treatment Log \= what actually happened during dialysis.**  
**Beyond the Chair \= what happened after dialysis and between treatments.**

This separation should remain consistent across in-center hemodialysis, home hemodialysis, and peritoneal dialysis. The interface can adapt to modality, but the three functional concepts should remain distinct.