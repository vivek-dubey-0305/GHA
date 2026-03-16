import { motion } from "framer-motion";
import PageLayout from "../../components/layout/PageLayout";
import { fadeInUp, staggerContainer, staggerItem } from "../../components/animations";

export default function Terms() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using GreedHunterAcademy, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you may not use our platform. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of changes."
    },
    {
      title: "2. User Accounts & Registration",
      content: "Users must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must provide accurate information during registration. GreedHunterAcademy is not liable for unauthorized access due to user negligence or credential sharing."
    },
    {
      title: "3. Intellectual Property Rights",
      content: "All course content, videos, materials, and platform design are protected by copyright and intellectual property laws. Users may not reproduce, distribute, or sell any content without explicit written permission. Personal use and learning are permitted, but commercial use is strictly prohibited. Unauthorized use may result in legal action and account termination."
    },
    {
      title: "4. User Conduct & Prohibited Activities",
      content: "Users must not engage in harassment, hateful speech, or discrimination. Cheating, plagiarism, or submitting others' work is prohibited. Users must not attempt to hack, exploit, or disrupt platform services. Sharing login credentials or reselling courses is not allowed. Violation of these policies may result in immediate account suspension or permanent ban."
    },
    {
      title: "5. Payment & Refund Policy",
      content: "All prices are in USD unless otherwise stated. Payments are processed securely through trusted payment providers. Refunds are available within 14 days of purchase for unused courses. Some courses may have different refund policies—always check before purchase. Fraudulent transactions will be investigated and may result in legal action."
    },
    {
      title: "6. Course Guarantees & Disclaimers",
      content: "We strive for course quality but do not guarantee specific job placements or salary increases. Course completion does not guarantee employment. Instructors are independent contractors, and GreedHunterAcademy is not responsible for their content quality. Students are responsible for verifying course eligibility and prerequisites before enrollment."
    },
    {
      title: "7. Limitation of Liability",
      content: "GreedHunterAcademy is provided 'as-is' without warranties. We are not liable for indirect, incidental, or consequential damages. Our maximum liability is limited to the amount you paid for the course. We do not guarantee uninterrupted service or error-free content."
    },
    {
      title: "8. Termination of Service",
      content: "GreedHunterAcademy reserves the right to suspend or terminate any account for violating these terms, engaging in illegal activity, or endangering our community. Terminated users may lose access to all courses and downloads. We may close services at any time without liability."
    },
    {
      title: "9. Dispute Resolution",
      content: "All disputes arising from these terms shall be governed by applicable law. Users agree to first attempt resolution through our support team. Unresolved disputes may proceed to mediation or arbitration as per jurisdiction laws. Legal action is a last resort."
    },
    {
      title: "10. Contact & Modifications",
      content: "For any questions about these terms, contact legal@greedhunteracademy.com. We may update these terms periodically. Continued use of the platform indicates your acceptance of updated terms."
    },
  ];

  return (
    <PageLayout
      title="Terms & Conditions"
      description="Please read these terms carefully before using our platform."
    >
      <motion.div
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-12 p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
      >
        <p className="text-gray-300 leading-relaxed">
          <strong>Last Updated:</strong> March 2024 | These Terms & Conditions govern your use of GreedHunterAcademy. By accessing our platform, you agree to comply with all terms outlined below.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="space-y-10"
      >
        {sections.map((section, idx) => (
          <motion.div key={idx} variants={staggerItem} className="pb-8 border-b border-gray-700 last:border-b-0">
            <h2 className="text-2xl font-bold mb-4 text-yellow-500">{section.title}</h2>
            <p className="text-gray-300 leading-relaxed text-lg">{section.content}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mt-16 pt-8 border-t-2 border-gray-600"
      >
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3">Important Notice</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            By creating an account or using any service on GreedHunterAcademy, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. If you have any concerns or questions, please contact our support team.
          </p>
        </div>
      </motion.div>
    </PageLayout>
  );
}
