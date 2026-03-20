import avatar from "@/assets/avatar.svg"; // Replace with your actual image

export default function About() {
  const technologies = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Frontend" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Vite", category: "Build Tool" },
    { name: "Supabase", category: "Backend" },
    { name: "i18n", category: "Internationalization" },
  ];

  const socialLinks = [
    { name: "GitHub", icon: "🐙", href: "#", comingSoon: true },
    { name: "LinkedIn", icon: "💼", href: "#", comingSoon: true },
    { name: "Twitter", icon: "🐦", href: "#", comingSoon: true },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <article className="card card-lg">
        {/* Header Section */}
        <header className="flex items-center mb-8">
          <img
            src={avatar}
            alt="Profile picture of the Gain English creator"
            className="w-16 h-16 rounded-full border-2 border-primary-500 shadow-sm mr-4 flex-shrink-0"
          />
          <div>
            <h1 className="text-display heading-accent">
              About Golden Lantern Academy
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Building tools for language learners
            </p>
          </div>
        </header>

        {/* Personal Story Section */}
        <section className="mb-10">
          <h2 className="sr-only">My Story</h2>
          <p className="text-base md:text-lg text-text-light dark:text-text-dark mb-4 leading-relaxed">
            Golden Lantern Academy was created by someone who understands both the
            challenges of learning a language and the value of great tools.
            I have a background in web development, a TEFL certification, and a passion
            for building interactive, learner-friendly experiences.
          </p>

          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            This platform started as a side project — a way to combine my technical
            skills with my interest in education. My goal is to help English learners
            grow their vocabulary and confidence through fun,
            focused practice.
          </p>

          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            I'm currently preparing to live and teach abroad, and Golden Lantern Academy is part
            of that journey. I'm actively improving the site, learning as I go, and building
            it into something that can genuinely help others.
          </p>
        </section>

        {/* Skills & Technologies Section */}
        <section className="mb-10">
          <h2 className="text-display heading-accent mb-6">
            Skills & Technologies
          </h2>
          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            This platform is built with modern web technologies to ensure a fast, 
            accessible, and engaging learning experience:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {technologies.map((tech) => (
              <div
                key={tech.name}
                className="card text-center"
              >
                <div className="font-medium text-text-light dark:text-text-dark text-sm">
                  {tech.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {tech.category}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social Links Section */}
        <section className="mb-8">
          <h2 className="text-display heading-accent mb-6">
            Connect With Me
          </h2>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-6">
            {socialLinks.map((social) => (
              <div
                key={social.name}
                className="relative group"
                role="button"
                tabIndex={0}
                aria-label={`${social.name} profile (coming soon)`}
              >
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed">
                  <span className="text-lg" role="img" aria-hidden="true">
                    {social.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {social.name}
                  </span>
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Coming Soon
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="text-display heading-accent mb-4">
            Get In Touch
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Want to share feedback, ideas, or just say hi?
          </p>
          <a
            href="mailto:youremail@example.com"
            className="inline-block bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
            aria-label="Send email to the creator of Gain English"
          >
            Contact Me
          </a>
        </section>
      </article>
    </div>
  );
}
