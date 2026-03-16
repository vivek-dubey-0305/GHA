import { motion } from "framer-motion";
import PageLayout from "../../components/layout/PageLayout";
import { fadeInUp, staggerContainer, staggerItem } from "../../components/animations";
import { Cookie } from "lucide-react";

export default function CookiePolicy() {
  const cookieTypes = [
    {
      type: "Essential Cookies",
      required: true,
      description: "These cookies are necessary for the website to function properly. They enable basic features like page navigation and access to secure areas.",
      examples: ["Session management", "Security tokens", "Login information"],
    },
    {
      type: "Performance Cookies",
      required: false,
      description: "These cookies help us understand how visitors use our website, allowing us to improve performance and user experience.",
      examples: ["Page load times", "User interaction patterns", "Error logging"],
    },
    {
      type: "Analytics Cookies",
      required: false,
      description: "We use analytics to track user behavior and improve our services. No personal identifying information is stored.",
      examples: ["Google Analytics", "Page views", "User demographics"],
    },
    {
      type: "Advertising Cookies",
      required: false,
      description: "These cookies are used by advertising partners to display relevant ads based on your interests.",
      examples: ["Interest-based ads", "Ad performance tracking", "Remarketing"],
    },
    {
      type: "Third-Party Cookies",
      required: false,
      description: "Third-party services like social media and video platforms may set their own cookies.",
      examples: ["Social media widgets", "Video players", "Embedded content"],
    },
  ];

  return (
    <PageLayout
      title="Cookie Policy"
      description="Learn how we use cookies to enhance your experience."
    >
      <motion.div
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-12 p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
      >
        <p className="text-gray-300 leading-relaxed">
          <strong>Last Updated:</strong> March 2024 | This Cookie Policy explains what cookies are, how we use them, and your choices regarding them.
        </p>
      </motion.div>

      {/* What are Cookies Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-6 text-yellow-500">What Are Cookies?</h2>
        <div className="bg-gradient-to-r from-yellow-500/5 to-transparent p-8 rounded-lg border border-yellow-500/10">
          <p className="text-gray-300 leading-relaxed text-lg mb-4">
            Cookies are small text files that are stored on your device when you visit our website. They help us remember your preferences, track your activity, and provide you with a personalized experience.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Cookies are harmless and contain no malicious code. They cannot access, transmit, or steal your personal information beyond what you voluntarily provide.
          </p>
        </div>
      </motion.section>

      {/* Types of Cookies */}
      <motion.section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-yellow-500">Types of Cookies We Use</h2>
        
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid gap-6"
        >
          {cookieTypes.map((cookie, idx) => (
            <motion.div
              key={idx}
              variants={staggerItem}
              whileHover={{ x: 10 }}
              className="p-6 rounded-lg border border-yellow-500/10 bg-gradient-to-r from-yellow-500/5 to-transparent hover:border-yellow-500/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <Cookie className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold">{cookie.type}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      cookie.required 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {cookie.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3">{cookie.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {cookie.examples.map((example, exIdx) => (
                      <span key={exIdx} className="px-3 py-1 bg-gray-800/50 text-gray-300 text-sm rounded">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Cookie Management Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-16 p-8 rounded-lg bg-gradient-to-r from-blue-500/5 to-transparent border border-blue-500/20"
      >
        <h2 className="text-2xl font-bold mb-6">How to Manage Cookies</h2>
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-yellow-500 mb-2">Browser Settings</h4>
            <p className="text-gray-300">Most browsers allow you to refuse cookies or alert you when cookies are sent. Visit your browser settings to adjust cookie preferences.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-yellow-500 mb-2">Cookie Consent</h4>
            <p className="text-gray-300">You can control non-essential cookies through our consent banner. Essential cookies cannot be disabled as they're required for platform functionality.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-yellow-500 mb-2">Third-Party Tools</h4>
            <p className="text-gray-300">Visit www.allaboutcookies.org or networkadvertising.org to learn more about cookies and opt-out options.</p>
          </div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="p-8 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20"
      >
        <h2 className="text-2xl font-bold mb-4">Questions About Cookies?</h2>
        <p className="text-gray-300 mb-4">
          If you have any questions about our cookie policy or how we use cookies, please reach out to us.
        </p>
        <p className="text-gray-400">
          <strong>Email:</strong> cookies@greedhunteracademy.com
        </p>
      </motion.section>
    </PageLayout>
  );
}
