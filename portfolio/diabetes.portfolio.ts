/**
 * Diabetes Expert System — portfolio entry, ready to paste.
 *
 * Shaped like the Bookly entry in Danish_portfolio/src/content/portfolio.ts
 * (same `Project` + `CaseStudy` fields), so it drops in next to it.
 * The "How I built it" parts (steps, practices, challenges, lessons) are left
 * empty on purpose: this case study shows the problem, what was built, the
 * screens, the numbers and what comes next.
 *
 * Every number below was checked against the code on 27 Nov 2026:
 *   59 rules and 99 clinical facts in the seeded knowledge base,
 *   219 backend tests passing, 2,695 strings in both en.json and km.json,
 *   5 built-in roles over 19 permissions.
 */

// 1) In src/lib/assets.ts, next to the Bookly glob:
//
//   const dx = import.meta.glob("@/assets/projects/diabetes/*.webp", {
//     eager: true,
//     import: "default",
//   }) as Record<string, string>;
//   const diabetes = (name: string) => dx[`/src/assets/projects/diabetes/${name}.webp`] ?? "";
//
//   and inside ASSETS.projects:
//     diabetesShot: diabetes,
//     diabetesShots: { home: diabetes("doctor-home"), phoneHome: diabetes("m-patient-home") },
//
// 2) Copy portfolio/screens/*.webp into src/assets/projects/diabetes/
//    and portfolio/cover/*.webp wherever the covers live.
//
// 3) `screens[].group` is "Customer" | "Staff" | "Admin" for Bookly. This project
//    needs "Patient" | "Doctor" | "Admin", so widen that union in CaseStudy.

export const diabetesProject = {
  id: "diabetes",
  title: "Diabetes Expert System",
  coverLine: "Early diabetes screening, in two languages",
  kind: "Clinical assistant · Team project",
  summary:
    "A bilingual English/Khmer system for early diabetes screening. Patients answer simple questions, a rule engine explains its result, and doctors review it and send a care plan. I contributed Google sign-in, UI improvements, and testing.",
  highlights: [
    "Explainable rule engine: 59 rules, each result shows why",
    "Patient, doctor and admin apps in English and Khmer",
    "Works on phone and laptop",
  ],
  stack: ["React", "Flask", "PostgreSQL", "Tailwind CSS", "JWT", "RBAC"],
  hosting: "Vercel & Railway",
  liveUrl: "https://diabetes-expert-system-3nk38gik3-danishs-projects-79a48970.vercel.app/",
  githubUrl: "https://github.com/danishsary8",
  award: "Award Winner · AI Expert System and Innovation 2026",
  team: true,
  imageAlt: "Diabetes Expert System doctor dashboard and patient home on a phone",

  caseStudy: {
    pitch:
      "Answer a few questions in English or Khmer, see your diabetes risk and the reasons behind it, and get a care plan your doctor has checked.",

    facts: [
      { label: "Role", value: "Team of 4" },
      { label: "Award", value: "AI Expert System 2026" },
      { label: "Languages", value: "English · ខ្មែរ" },
      { label: "Engine", value: "59 explainable rules" },
    ],

    problem:
      "Early diabetes is easy to miss. Most screening tools are English-only and give a score with no reason why, and doctors have no quick way to see who needs them first.",

    solution:
      "A screening assistant in both languages: a guided check-up, a result that shows its evidence, a review queue for doctors, and a care plan the patient can follow.",

    // Left empty on purpose (no "How I built it" section).
    steps: [],

    // One screen on the laptop and the phone at the same time, like Bookly.
    // Desktop 1440×900, phone 430×932 (shot at 1.2×, saved 516×1118).
    screens: [
      {
        group: "Patient",
        title: "Home",
        text: "Today's fasting glucose on a colour band, so patients see at a glance whether they're on track.",
        desktop: "patient-home",
        phone: "m-patient-home",
      },
      {
        group: "Patient",
        title: "Result with reasons",
        text: "Plain-language result, how confident the system is, and what to do next.",
        desktop: "result",
        phone: "m-result",
      },
      {
        group: "Patient",
        title: "Care plan",
        text: "Today's goals, medication times and appointments, built around the latest result.",
        desktop: "care-plan",
        phone: "m-care-plan",
      },
      {
        group: "Patient",
        title: "Dr. Bot",
        text: "A friendly assistant answers common diabetes questions in English and Khmer.",
        desktop: "assistant",
        phone: "m-assistant",
      },
      {
        group: "Patient",
        title: "In Khmer",
        text: "Every screen switches to Khmer with one tap.",
        desktop: "patient-home-km",
        phone: "m-patient-home-km",
      },
      {
        group: "Patient",
        title: "Diabetes guide",
        text: "Types of diabetes and 14 symptoms explained simply.",
        desktop: "guide",
        phone: "m-guide",
      },
      {
        group: "Doctor",
        title: "Dashboard",
        text: "Urgent patients, cases waiting for review and care plans, in one view.",
        desktop: "doctor-home",
        phone: "m-doctor-home",
      },
      {
        group: "Doctor",
        title: "Guided assessment",
        text: "One question at a time, with pictures. Answers already on file are filled in.",
        desktop: "assessment",
        phone: "m-assessment",
      },
      {
        group: "Doctor",
        title: "Review queue",
        text: "Check the system's result, add a note, and flag urgent cases.",
        desktop: "review",
        phone: "m-review",
      },
      {
        group: "Doctor",
        title: "Patient record",
        text: "Profile, visits, symptoms, labs and every past result for one patient.",
        desktop: "patient-record",
        phone: "m-patient-record",
      },
      {
        group: "Doctor",
        title: "Knowledge base",
        text: "Which rules fire most, and how sure the engine is on average.",
        desktop: "rules",
        phone: "m-rules",
      },
      {
        group: "Doctor",
        title: "Rule editor",
        text: "Doctors write rules as IF / AND / OR conditions, no code needed.",
        desktop: "rule-editor",
        phone: "m-rule-editor",
      },
      {
        group: "Admin",
        title: "Roles & permissions",
        text: "Five built-in roles, plus custom ones from 19 permissions.",
        desktop: "admin-roles",
        phone: "m-admin-roles",
      },
    ],

    stats: [
      { value: 59, label: "clinical rules" },
      { value: 99, label: "clinical facts" },
      { value: 219, label: "backend tests" },
      { value: 2695, label: "strings in Khmer" },
    ],

    // Left empty on purpose (no "How I built it" section).
    practices: [],
    challenges: [],
    lessons: [],

    // Future development plan.
    next: [
      "Dark mode on every screen",
      "Glucose reminders on Telegram",
      "Install it on a phone and use it offline",
      "Check the rules with doctors on real, anonymised cases",
    ],
  },
} as const;
