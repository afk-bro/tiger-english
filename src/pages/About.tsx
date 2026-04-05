import { useTranslation } from 'react-i18next';
import avatar from "@/assets/TE-logo.png";
import { SITE_GITHUB_URL, SITE_CONTACT_EMAIL } from "@/lib/siteConfig";

export default function About() {
  const { t } = useTranslation();

  const technologies = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Frontend" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Vite", category: "Build Tool" },
    { name: "Supabase", category: "Backend" },
    { name: "i18n", category: "Internationalization" },
  ];

  const socialLinks = [
    { name: "GitHub", icon: "🐙", href: SITE_GITHUB_URL },
    { name: "LinkedIn", icon: "💼", href: "#", comingSoon: true },
    { name: "Twitter", icon: "🐦", href: "#", comingSoon: true },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <article className="card card-lg">
        <header className="flex items-center mb-8">
          <img
            src={avatar}
            alt={t('about.connect.avatar_alt')}
            className="w-16 h-16 rounded-full border-2 border-primary-500 shadow-sm mr-4 flex-shrink-0"
          />
          <div>
            <h1 className="text-display heading-accent">
              {t('about.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('about.tagline')}
            </p>
          </div>
        </header>

        <section className="mb-10">
          <h2 className="sr-only">My Story</h2>
          <p className="text-base md:text-lg text-text-light dark:text-text-dark mb-4 leading-relaxed">
            {t('about.story.p1')}
          </p>
          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            {t('about.story.p2')}
          </p>
          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            {t('about.story.p3')}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-display heading-accent mb-6">
            {t('about.skills.heading')}
          </h2>
          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            {t('about.skills.intro')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {technologies.map((tech) => (
              <div key={tech.name} className="card text-center">
                <div className="font-medium text-text-light dark:text-text-dark text-sm">
                  {tech.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t(`about.skills.categories.${tech.category}`, tech.category)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-display heading-accent mb-6">
            {t('about.connect.heading')}
          </h2>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-6">
            {socialLinks.map((social) => (
              <div key={social.name} className="relative group">
                {social.comingSoon ? (
                  <div
                    aria-disabled="true"
                    title={t('about.connect.coming_soon')}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed"
                  >
                    <span className="text-lg" role="img" aria-hidden="true">{social.icon}</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{social.name}</span>
                  </div>
                ) : (
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('about.connect.social_aria', { name: social.name })}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <span className="text-lg" role="img" aria-hidden="true">{social.icon}</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{social.name}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-display heading-accent mb-4">
            {t('about.connect.contact_heading')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('about.connect.contact_desc')}
          </p>
          <a
            href={`mailto:${SITE_CONTACT_EMAIL}`}
            className="inline-block bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
            aria-label={t('about.connect.contact_button')}
          >
            {t('about.connect.contact_button')}
          </a>
        </section>
      </article>
    </div>
  );
}
