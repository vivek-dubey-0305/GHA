import { motion } from "framer-motion";
import PageLayout from "../../components/layout/PageLayout";
import { fadeInUp, staggerContainer, staggerItem } from "../../components/animations";
import { CheckCircle, Clock, Zap, AlertCircle } from "lucide-react";

export default function Refund() {
  const refundProcess = [
    {
      icon: CheckCircle,
      step: "Step 1: Submit Request",
      description: "Login to your account and navigate to 'My Courses'. Click on the course you want to refund and select 'Request Refund'.",
      time: "2 minutes"
    },
    {
      icon: AlertCircle,
      step: "Step 2: Provide Reason",
      description: "Tell us why you're requesting a refund. Your feedback helps us improve our courses and provide better quality.",
      time: "2 minutes"
    },
    {
      icon: Clock,
      step: "Step 3: Verification",
      description: "Our team reviews your request within 1-2 business days. We'll check your course access time and download status.",
      time: "1-2 days"
    },
    {
      icon: Zap,
      step: "Step 4: Processing",
      description: "Once approved, your refund is processed immediately. The amount will be credited back to your original payment method.",
      time: "3-5 days"
    },
  ];

  const policies = [
    {
      title: "14-Day Money-Back Guarantee",
      content: "Get a full refund if you request it within 14 days of purchase, regardless of course progress.",
      highlight: true,
    },
    {
      title: "What Qualifies for Refund",
      content: [
        "Course doesn't match the description or expectations",
        "Technical issues preventing course access",
        "Change of mind (within 14 days)",
        "Course content is outdated or incomplete",
        "Duplicate purchase by mistake",
      ]
    },
    {
      title: "Non-Refundable Cases",
      content: [
        "Refund requested after 14 days of purchase",
        "Course already completed (>80% progress)",
        "Certificate already earned and downloaded",
        "Combined with promotional coupons (50%+ discount)",
        "Fraudulent or suspicious transactions",
        "Purchased twice and used both courses",
      ]
    },
    {
      title: "Partial Refunds",
      content: "If you've completed 30-80% of the course, we may offer a 50% partial refund. This is reviewed case-by-case based on your usage and feedback.",
      highlight: true,
    },
    {
      title: "Bundle Courses",
      content: "You can refund individual courses within a bundle. If a refund is approved, only that course's portion will be refunded.",
    },
    {
      title: "Refund Timeline",
      content: "Refund requests are processed within 1-2 business days. Depending on your bank, the amount may take 3-5 business days to appear in your account.",
    },
  ];

  return (
    <PageLayout
      title="Refund Policy"
      description="We stand behind our quality. If you're not satisfied, we'll refund your money."
    >
      {/* Key Highlight */}
      <motion.div
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-12 p-8 rounded-lg bg-gradient-to-r from-green-500/20 to-transparent border-2 border-green-500/40"
      >
        <h2 className="text-2xl font-bold mb-4 text-green-400">✓ 14-Day Money-Back Guarantee</h2>
        <p className="text-lg text-gray-200">
          Not satisfied? Get a full refund within 14 days of purchase. No questions asked. We're confident in our quality, and we want you to be too.
        </p>
      </motion.div>

      {/* Refund Process */}
      <motion.section className="mb-20">
        <h2 className="text-3xl font-bold mb-12 text-yellow-500">How to Request a Refund</h2>
        
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {refundProcess.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div key={idx} variants={staggerItem}>
                <div className="relative p-6 rounded-lg bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/10 h-full">
                  {/* Step number */}
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-lg">
                    {idx + 1}
                  </div>

                  <Icon className="w-8 h-8 text-yellow-500 mb-4 mt-2" />
                  <h3 className="font-bold text-lg mb-3">{item.step}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{item.description}</p>
                  <p className="text-xs text-yellow-500 font-semibold">⏱️ {item.time}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 rounded-lg bg-blue-500/10 border border-blue-500/20"
        >
          <p className="text-gray-300">
            <strong>🔒 Secure Process:</strong> Your refund request is encrypted and processed securely. We only ask for information necessary to process your refund.
          </p>
        </motion.div>
      </motion.section>

      {/* Policies Grid */}
      <motion.section className="mb-20">
        <h2 className="text-3xl font-bold mb-12 text-yellow-500">Refund Policy Details</h2>
        
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          {policies.map((policy, idx) => (
            <motion.div
              key={idx}
              variants={staggerItem}
              className={`p-8 rounded-lg border ${
                policy.highlight 
                  ? 'bg-gradient-to-br from-yellow-500/15 to-transparent border-yellow-500/30'
                  : 'bg-gradient-to-br from-gray-800/20 to-transparent border-gray-700'
              }`}
            >
              <h3 className={`text-xl font-bold mb-4 ${policy.highlight ? 'text-yellow-500' : 'text-white'}`}>
                {policy.title}
              </h3>
              
              {Array.isArray(policy.content) ? (
                <ul className="space-y-2">
                  {policy.content.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3 text-gray-300">
                      <span className="text-yellow-500 mt-1 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 leading-relaxed">{policy.content}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* FAQ Mini */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-20"
      >
        <h2 className="text-3xl font-bold mb-12 text-yellow-500">Quick Answers</h2>
        
        <div className="space-y-6">
          {[
            {
              q: "What if I receive a partial refund?",
              a: "Partial refunds are offered when you've completed 30-80% of a course. This is determined after review, and you'll be notified of the exact amount."
            },
            {
              q: "How long until the refund appears in my account?",
              a: "Refunds are processed within 1-2 business days. Your bank may take an additional 3-5 business days to credit the amount."
            },
            {
              q: "Can I refund only one course from a bundle?",
              a: "Yes, you can refund individual courses from a bundle. Only that course's price will be refunded."
            },
            {
              q: "What about free courses?",
              a: "Free courses cannot be refunded as there's no charge. However, your access will be revoked after cancellation."
            },
            {
              q: "Can I refund after earning a certificate?",
              a: "No, refunds are not available after a certificate has been issued or downloaded."
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="pb-6 border-b border-gray-700 last:border-0"
            >
              <h4 className="font-bold text-lg mb-2 text-yellow-500">{item.q}</h4>
              <p className="text-gray-400 leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="text-center py-12 px-8 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20"
      >
        <h2 className="text-2xl font-bold mb-4">Need Help with Your Refund?</h2>
        <p className="text-gray-400 mb-6">
          Our support team is ready to assist you with any questions or concerns.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="mailto:refunds@greedhunteracademy.com" className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
            Email Support
          </a>
          <button className="px-6 py-3 border-2 border-yellow-500 text-yellow-500 font-bold rounded-lg hover:bg-yellow-500/10 transition-all">
            Live Chat
          </button>
        </div>
      </motion.section>
    </PageLayout>
  );
}
