import { motion } from "framer-motion";
import PageLayout from "../../components/layout/PageLayout";
import { fadeInUp, staggerContainer, staggerItem } from "../../components/animations";

export default function Privacy() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: [
        "Account information (name, email, password) when you register",
        "Profile information (bio, profile picture, educational background)",
        "Course progress and learning data",
        "Payment information (processed securely by payment providers)",
        "Communication preferences and notifications settings",
        "Device information and usage analytics",
        "Cookies and similar tracking technologies",
      ]
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "To provide and improve our learning platform services",
        "To personalize your learning experience and recommendations",
        "To process payments and prevent fraudulent transactions",
        "To send you course updates, announcements, and educational content",
        "To respond to your queries and provide customer support",
        "To analyze user behavior and platform performance",
        "To comply with legal obligations and enforce our terms",
      ]
    },
    {
      title: "3. Data Protection & Security",
      content: [
        "We use industry-standard encryption (SSL/TLS) for data in transit",
        "Your password is hashed and never stored in plain text",
        "Access to sensitive data is restricted and logged",
        "We perform regular security audits and vulnerability assessments",
        "Our servers are located in secure, redundant data centers",
        "We comply with GDPR, CCPA, and other data protection regulations",
      ]
    },
    {
      title: "4. Third-Party Services",
      content: [
        "We use trusted third-party providers for payment processing",
        "Analytics services help us understand platform usage",
        "Video hosting services deliver course content",
        "Email services are used for communications",
        "Cloud storage providers secure our infrastructure",
        "These partners are bound by strict data protection agreements",
      ]
    },
    {
      title: "5. Your Rights & Choices",
      content: [
        "Right to access your personal data at any time",
        "Right to correct or update your information",
        "Right to delete your account and associated data",
        "Right to opt-out of marketing communications",
        "Right to data portability in a standard format",
        "Right to file a complaint with data protection authorities",
      ]
    },
    {
      title: "6. Data Retention",
      content: [
        "We retain your data as long as your account is active",
        "After account deletion, data is securely erased within 30 days",
        "Legal obligations may require us to retain certain records",
        "Billing records are retained for tax and compliance purposes",
        "Analytics data is anonymized after 24 months",
      ]
    },
    {
      title: "7. Children's Privacy",
      content: [
        "GreedHunterAcademy is not intended for children under 13",
        "We do not knowingly collect data from children under 13",
        "If we become aware of such data, we promptly delete it",
        "Parents may contact us to request deletion of a child's account",
        "Users between 13-18 have additional privacy protections",
      ]
    },
    {
      title: "8. Contact Us",
      content: [
        "Email: privacy@greedhunteracademy.com",
        "Address: GreedHunterAcademy, Privacy Team, [Address]",
        "Response time: We aim to respond within 7 business days",
        "For urgent matters, contact our Data Protection Officer",
      ]
    },
  ];

  return (
    <PageLayout
      title="Privacy Policy"
      description="Your privacy is important to us. Learn how we collect, use, and protect your data."
    >
      <motion.div
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-12 p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
      >
        <p className="text-gray-300 leading-relaxed">
          <strong>Last Updated:</strong> March 2024 | This Privacy Policy outlines how GreedHunterAcademy collects, uses, and protects your personal information. By using our platform, you consent to our privacy practices.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="space-y-12"
      >
        {sections.map((section, idx) => (
          <motion.div key={idx} variants={staggerItem}>
            <h2 className="text-2xl font-bold mb-4 text-yellow-500">{section.title}</h2>
            <ul className="space-y-3">
              {section.content.map((item, itemIdx) => (
                <motion.li
                  key={itemIdx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: itemIdx * 0.05 }}
                  className="flex items-start gap-3 text-gray-300 leading-relaxed"
                >
                  <span className="text-yellow-500 mt-1 flex-shrink-0">→</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mt-16 pt-8 border-t border-gray-700"
      >
        <p className="text-gray-400 text-sm leading-relaxed">
          We reserve the right to update this Privacy Policy at any time. Changes will be reflected on this page with an updated "Last Updated" date. Continued use of the platform after changes constitutes your acceptance of the updated policy.
        </p>
      </motion.div>
    </PageLayout>
  );
}
