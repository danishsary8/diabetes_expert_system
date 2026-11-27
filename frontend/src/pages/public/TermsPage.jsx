import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher'

const UPDATED = '27 November 2026'

const CONTENT = {
  en: {
    title: 'Terms of service',
    updated: `Last updated: ${UPDATED}`,
    back: 'Back to the app',
    sections: [
      {
        heading: 'Using this app',
        body: [
          'By creating an account or signing in, you agree to these terms. If you do not agree, please do not use the app.',
        ],
      },
      {
        heading: 'Not a medical diagnosis',
        body: [
          'Diabetes Expert System gives screening results and general health guidance. It does not diagnose disease and does not replace a doctor, nurse or emergency service.',
          'Always talk to a qualified health professional before starting, stopping or changing any treatment or medicine.',
          'If you feel very unwell — for example confusion, fainting, fast breathing or fruity-smelling breath — seek emergency care immediately. Do not wait for the app.',
        ],
      },
      {
        heading: 'Your account',
        body: [
          'Keep your login details private. You are responsible for activity under your account.',
          'Give accurate information. Results are only as reliable as the answers and numbers you enter.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          "Do not misuse the app: no attempts to access other people's data, disrupt the service, or use it for anything unlawful.",
        ],
      },
      {
        heading: 'Availability',
        body: [
          'We aim to keep the app available but cannot guarantee it will always work without interruption or errors. Features may change over time.',
        ],
      },
      {
        heading: 'Limitation of responsibility',
        body: [
          'The app is provided "as is". To the extent the law allows, we are not responsible for decisions made using its results without advice from a health professional.',
        ],
      },
      {
        heading: 'Privacy',
        body: ['How we handle your information is explained in our privacy policy.'],
        link: { to: '/privacy', label: 'Read the privacy policy' },
      },
      {
        heading: 'Changes and contact',
        body: [
          'We may update these terms; the date above shows the latest version. For questions, contact the clinic or the administrator who gave you access to this app.',
        ],
      },
    ],
  },
  km: {
    title: 'លក្ខខណ្ឌប្រើប្រាស់',
    updated: `ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ ${UPDATED}`,
    back: 'ត្រឡប់ទៅកម្មវិធី',
    sections: [
      {
        heading: 'ការប្រើប្រាស់កម្មវិធីនេះ',
        body: [
          'ដោយការបង្កើតគណនី ឬចូលប្រើ អ្នកយល់ព្រមនឹងលក្ខខណ្ឌទាំងនេះ។ ប្រសិនបើអ្នកមិនយល់ព្រម សូមកុំប្រើកម្មវិធីនេះ។',
        ],
      },
      {
        heading: 'មិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ',
        body: [
          'ប្រព័ន្ធជំនាញទឹកនោមផ្អែម ផ្តល់លទ្ធផលពិនិត្យ និងការណែនាំសុខភាពទូទៅ។ វាមិនធ្វើរោគវិនិច្ឆ័យជំងឺ ហើយមិនជំនួសគ្រូពេទ្យ គិលានុបដ្ឋាក ឬសេវាសង្គ្រោះបន្ទាន់ទេ។',
          'សូមពិគ្រោះជាមួយអ្នកជំនាញសុខាភិបាលជានិច្ច មុនពេលចាប់ផ្តើម បញ្ឈប់ ឬផ្លាស់ប្តូរការព្យាបាល ឬថ្នាំណាមួយ។',
          'ប្រសិនបើអ្នកមានអារម្មណ៍មិនស្រួលខ្លាំង ដូចជាច្របូកច្របល់ សន្លប់ ដកដង្ហើមញាប់ ឬដង្ហើមមានក្លិនផ្លែឈើ សូមទៅសង្គ្រោះបន្ទាន់ភ្លាមៗ។ កុំរង់ចាំកម្មវិធី។',
        ],
      },
      {
        heading: 'គណនីរបស់អ្នក',
        body: [
          'សូមរក្សាព័ត៌មានចូលប្រើរបស់អ្នកជាការសម្ងាត់។ អ្នកទទួលខុសត្រូវចំពោះសកម្មភាពក្នុងគណនីរបស់អ្នក។',
          'សូមផ្តល់ព័ត៌មានត្រឹមត្រូវ។ លទ្ធផលអាចទុកចិត្តបានតាមកម្រិតនៃចម្លើយ និងលេខដែលអ្នកបញ្ចូល។',
        ],
      },
      {
        heading: 'ការប្រើប្រាស់ដែលអនុញ្ញាត',
        body: [
          'កុំប្រើកម្មវិធីខុសគោលបំណង៖ កុំព្យាយាមចូលមើលទិន្នន័យអ្នកដទៃ រំខានសេវាកម្ម ឬប្រើវាសម្រាប់អ្វីដែលខុសច្បាប់។',
        ],
      },
      {
        heading: 'ភាពអាចប្រើបាន',
        body: [
          'យើងខិតខំរក្សាកម្មវិធីឱ្យដំណើរការជានិច្ច ប៉ុន្តែមិនអាចធានាថាវានឹងដំណើរការដោយគ្មានការរំខាន ឬកំហុសឡើយ។ មុខងារអាចផ្លាស់ប្តូរតាមពេលវេលា។',
        ],
      },
      {
        heading: 'ដែនកំណត់នៃការទទួលខុសត្រូវ',
        body: [
          'កម្មវិធីត្រូវបានផ្តល់ជូន "ដូចដែលវាមាន"។ តាមកម្រិតដែលច្បាប់អនុញ្ញាត យើងមិនទទួលខុសត្រូវចំពោះការសម្រេចចិត្តដែលធ្វើដោយប្រើលទ្ធផលរបស់វា ដោយគ្មានការណែនាំពីអ្នកជំនាញសុខាភិបាលឡើយ។',
        ],
      },
      {
        heading: 'ឯកជនភាព',
        body: ['របៀបដែលយើងគ្រប់គ្រងព័ត៌មានរបស់អ្នក ត្រូវបានពន្យល់នៅក្នុងគោលការណ៍ឯកជនភាព។'],
        link: { to: '/privacy', label: 'អានគោលការណ៍ឯកជនភាព' },
      },
      {
        heading: 'ការផ្លាស់ប្តូរ និងទំនាក់ទំនង',
        body: [
          'យើងអាចធ្វើបច្ចុប្បន្នភាពលក្ខខណ្ឌទាំងនេះ។ កាលបរិច្ឆេទខាងលើបង្ហាញកំណែចុងក្រោយ។ សម្រាប់សំណួរ សូមទាក់ទងគ្លីនិក ឬអ្នកគ្រប់គ្រងដែលបានផ្តល់សិទ្ធិឱ្យអ្នកប្រើកម្មវិធីនេះ។',
        ],
      },
    ],
  },
}

export function TermsPage() {
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
              {section.link ? (
                <Link to={section.link.to} className="mt-2 inline-block font-semibold text-primary-700 underline hover:text-primary-900">
                  {section.link.label}
                </Link>
              ) : null}
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
