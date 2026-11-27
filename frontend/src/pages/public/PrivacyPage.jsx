import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher'

const UPDATED = '27 November 2026'

const CONTENT = {
  en: {
    title: 'Privacy policy',
    updated: `Last updated: ${UPDATED}`,
    back: 'Back to the app',
    sections: [
      {
        heading: 'What this app is',
        body: [
          'Diabetes Expert System is a screening and care-support tool. It helps you understand your diabetes risk and follow a care plan. It does not replace a doctor.',
        ],
      },
      {
        heading: 'What we collect',
        body: [
          'Account details: your name, email address and, if you sign in with Google, your Google profile name and photo.',
          'Health information you enter: gender, date of birth, height, weight, waist size, risk factors, symptoms, lab results and your assessment answers.',
          'Results the system produces from that information, and notes your care team adds.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To run your health assessments and show your results, care plan and progress.',
          'To let your care team (doctors and nurses using this system) review your results.',
          'We do not sell your data, use it for advertising, or share it with anyone outside your care team except where the law requires it.',
        ],
      },
      {
        heading: 'Google sign-in',
        body: [
          'If you choose "Continue with Google", we receive only your name, email address and profile photo from Google. We never see your Google password, and we do not access your Gmail, contacts or files.',
        ],
      },
      {
        heading: 'Where it is stored',
        body: [
          'Your data is stored in a secured cloud database. Connections are encrypted (HTTPS), and passwords are stored only in hashed form.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'You can view and update your health profile at any time from your profile page.',
          'To have your account and data deleted, ask using the contact below and it will be removed.',
        ],
      },
      {
        heading: 'Contact',
        body: ['For privacy questions or to delete your data, contact the clinic or the administrator who gave you access to this app.'],
      },
    ],
  },
  km: {
    title: 'គោលការណ៍ឯកជនភាព',
    updated: `ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ ${UPDATED}`,
    back: 'ត្រឡប់ទៅកម្មវិធី',
    sections: [
      {
        heading: 'អំពីកម្មវិធីនេះ',
        body: [
          'ប្រព័ន្ធជំនាញទឹកនោមផ្អែម គឺជាឧបករណ៍ពិនិត្យ និងជួយថែទាំ។ វាជួយអ្នកឱ្យយល់ពីហានិភ័យទឹកនោមផ្អែម និងអនុវត្តផែនការថែទាំ។ វាមិនជំនួសគ្រូពេទ្យទេ។',
        ],
      },
      {
        heading: 'ព័ត៌មានដែលយើងប្រមូល',
        body: [
          'ព័ត៌មានគណនី៖ ឈ្មោះ អាសយដ្ឋានអ៊ីមែល ហើយប្រសិនបើអ្នកចូលដោយ Google គឺឈ្មោះ និងរូបថតប្រវត្តិរូប Google របស់អ្នក។',
          'ព័ត៌មានសុខភាពដែលអ្នកបញ្ចូល៖ ភេទ ថ្ងៃខែឆ្នាំកំណើត កម្ពស់ ទម្ងន់ ទំហំចង្កេះ កត្តាហានិភ័យ រោគសញ្ញា លទ្ធផលមន្ទីរពិសោធន៍ និងចម្លើយការវាយតម្លៃរបស់អ្នក។',
          'លទ្ធផលដែលប្រព័ន្ធបង្កើតចេញពីព័ត៌មាននោះ និងកំណត់ចំណាំដែលក្រុមថែទាំរបស់អ្នកបន្ថែម។',
        ],
      },
      {
        heading: 'របៀបដែលយើងប្រើ',
        body: [
          'ដើម្បីដំណើរការការវាយតម្លៃសុខភាព និងបង្ហាញលទ្ធផល ផែនការថែទាំ និងវឌ្ឍនភាពរបស់អ្នក។',
          'ដើម្បីឱ្យក្រុមថែទាំរបស់អ្នក (គ្រូពេទ្យ និងគិលានុបដ្ឋាកដែលប្រើប្រព័ន្ធនេះ) ពិនិត្យលទ្ធផលរបស់អ្នក។',
          'យើងមិនលក់ទិន្នន័យរបស់អ្នក មិនប្រើវាសម្រាប់ការផ្សាយពាណិជ្ជកម្ម ហើយមិនចែករំលែកជាមួយអ្នកណាក្រៅពីក្រុមថែទាំរបស់អ្នកឡើយ លើកលែងតែច្បាប់តម្រូវ។',
        ],
      },
      {
        heading: 'ការចូលដោយ Google',
        body: [
          'ប្រសិនបើអ្នកជ្រើសរើស "បន្តជាមួយ Google" យើងទទួលបានតែឈ្មោះ អាសយដ្ឋានអ៊ីមែល និងរូបថតប្រវត្តិរូបរបស់អ្នកពី Google ប៉ុណ្ណោះ។ យើងមិនដែលឃើញពាក្យសម្ងាត់ Google របស់អ្នក ហើយយើងមិនចូលប្រើ Gmail ទំនាក់ទំនង ឬឯកសាររបស់អ្នកទេ។',
        ],
      },
      {
        heading: 'កន្លែងរក្សាទុក',
        body: [
          'ទិន្នន័យរបស់អ្នកត្រូវបានរក្សាទុកក្នុងមូលដ្ឋានទិន្នន័យពពកដែលមានសុវត្ថិភាព។ ការតភ្ជាប់ត្រូវបានអ៊ិនគ្រីប (HTTPS) ហើយពាក្យសម្ងាត់ត្រូវបានរក្សាទុកតែជាទម្រង់ hash ប៉ុណ្ណោះ។',
        ],
      },
      {
        heading: 'ជម្រើសរបស់អ្នក',
        body: [
          'អ្នកអាចមើល និងកែប្រែប្រវត្តិសុខភាពរបស់អ្នកបានគ្រប់ពេលពីទំព័រប្រវត្តិរូប។',
          'ដើម្បីលុបគណនី និងទិន្នន័យរបស់អ្នក សូមស្នើតាមទំនាក់ទំនងខាងក្រោម ហើយវានឹងត្រូវលុបចេញ។',
        ],
      },
      {
        heading: 'ទំនាក់ទំនង',
        body: ['សម្រាប់សំណួរអំពីឯកជនភាព ឬការលុបទិន្នន័យ សូមទាក់ទងគ្លីនិក ឬអ្នកគ្រប់គ្រងដែលបានផ្តល់សិទ្ធិឱ្យអ្នកប្រើកម្មវិធីនេះ។'],
      },
    ],
  },
}

export function PrivacyPage() {
  const { isKhmer } = useLanguage()
  const c = isKhmer ? CONTENT.km : CONTENT.en

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900">
          <ArrowLeft className="h-4 w-4" />
          {c.back}
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{c.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{c.updated}</p>

        <div className="mt-8 space-y-8">
          {c.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-slate-900">{section.heading}</h2>
              <ul className="mt-3 space-y-2 leading-relaxed text-slate-700">
                {section.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
