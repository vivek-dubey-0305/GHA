import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "../../components/layout/PageLayout";
import { fadeInUp, staggerContainer, staggerItem } from "../../components/animations";
import { ChevronDown, Search } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click the 'Sign Up' button on the homepage and fill in your details (name, email, password). Verify your email, and you're ready to start learning!"
      },
      {
        q: "Is GreedHunterAcademy free?",
        a: "We offer both free and premium courses. Free courses let you explore and learn basics, while premium courses provide certificates and advanced content."
      },
      {
        q: "Can I start learning immediately after registration?",
        a: "Yes! You can access free courses immediately after registration. Premium courses require payment before access."
      },
      {
        q: "Do I need any software or equipment?",
        a: "A computer with internet connection and a modern web browser are all you need. Some courses may require specific software, which we'll specify in the course details."
      }
    ]
  },
  {
    category: "Courses & Learning",
    questions: [
      {
        q: "How long does it take to complete a course?",
        a: "Course duration varies from 4 weeks for beginner courses to 12+ weeks for advanced programs. You can learn at your own pace with no time limits."
      },
      {
        q: "Can I download course materials?",
        a: "Yes, most courses allow you to download video lectures, PDFs, and code resources for offline learning."
      },
      {
        q: "What if I don't understand a concept?",
        a: "Post your questions in the course discussion forum. Instructors and fellow learners respond within 24 hours. You also have access to live Q&A sessions."
      },
      {
        q: "Can I take multiple courses simultaneously?",
        a: "Absolutely! You can enroll in as many courses as you want and learn at your own pace."
      },
      {
        q: "Do you offer project-based learning?",
        a: "Yes, most courses include real-world projects. You'll build a portfolio to showcase to employers."
      }
    ]
  },
  {
    category: "Certificates & Credentials",
    questions: [
      {
        q: "Will I get a certificate after completing a course?",
        a: "Yes, premium courses provide certificates upon completion. Free courses also offer certificates but without formal verification."
      },
      {
        q: "Are the certificates recognized by employers?",
        a: "Our certificates are recognized by leading tech companies. Your portfolio of projects matters more than the certificate itself."
      },
      {
        q: "Can I share my certificate online?",
        a: "Yes, you can download, print, or share certificates on LinkedIn and other platforms."
      }
    ]
  },
  {
    category: "Payments & Refunds",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept credit cards (Visa, MasterCard, Amex), debit cards, UPI, net banking, and digital wallets."
      },
      {
        q: "Is my payment information secure?",
        a: "Yes, we use industry-standard SSL encryption and PCI-DSS compliance. We never store your full card details."
      },
      {
        q: "What's your refund policy?",
        a: "We offer a 14-day money-back guarantee for unused courses. Contact support for refund requests."
      },
      {
        q: "Do you offer discounts?",
        a: "Yes! We frequently offer discounts (20-50% off) during sales, seasonal promotions, and for bulk orders."
      }
    ]
  },
  {
    category: "Account & Technical",
    questions: [
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login page, enter your email, and follow the instructions sent to your inbox."
      },
      {
        q: "Can I change my email address?",
        a: "Yes, go to Account Settings and update your email. You'll receive a verification email to confirm the change."
      },
      {
        q: "What browsers do you support?",
        a: "We support Chrome, Firefox, Safari, Edge, and other modern browsers. For the best experience, use the latest version."
      },
      {
        q: "Can I access courses on mobile?",
        a: "Yes, our platform is fully responsive. You can learn on iOS, Android, tablets, and desktop."
      },
      {
        q: "What if I encounter technical issues?",
        a: "Contact our support team at support@greedhunteracademy.com or use the live chat. We respond within 2 hours."
      }
    ]
  },
  {
    category: "Career Support",
    questions: [
      {
        q: "Do you help with job placement?",
        a: "Yes! We offer resume reviews, interview coaching, and job board access to premium members."
      },
      {
        q: "Can I connect with potential employers?",
        a: "Absolutely. Our partner companies actively recruit from our community. Your projects and portfolio are visible to them."
      },
      {
        q: "Is there career guidance available?",
        a: "Yes, our career advisors provide 1-on-1 guidance on skill development, portfolio building, and job hunting strategies."
      }
    ]
  },
];

function FAQItem({ question, answer, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="border border-yellow-500/10 rounded-lg overflow-hidden bg-gradient-to-r from-yellow-500/5 to-transparent"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-yellow-500/10 transition-colors text-left"
      >
        <h3 className="text-lg font-semibold pr-4">{question}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-yellow-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-yellow-500/10 bg-yellow-500/5"
          >
            <p className="p-6 text-gray-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openCategory, setOpenCategory] = useState(null);

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  const allQuestions = faqs.flatMap(cat => cat.questions);
  const hasSearchResults = searchTerm ? filteredFaqs.length > 0 : true;

  return (
    <PageLayout
      title="Frequently Asked Questions"
      description="Find answers to common questions about courses, payments, certificates, and more."
    >
      {/* Search Bar */}
      <motion.div
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-12"
      >
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/60 transition-colors"
          />
        </div>
        {searchTerm && (
          <p className="text-center text-gray-400 mt-3">
            Found {filteredFaqs.reduce((sum, cat) => sum + cat.questions.length, 0)} matching questions
          </p>
        )}
      </motion.div>

      {/* Quick Stats */}
      {!searchTerm && (
        <motion.div
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {[
            { icon: "❓", label: "Total Questions", value: allQuestions.length },
            { icon: "📚", label: "Categories", value: faqs.length },
            { icon: "⚡", label: "Quick Answers", value: "2 min read" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="p-6 rounded-lg bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/10 text-center"
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-yellow-500">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* FAQ Sections */}
      {hasSearchResults ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {(searchTerm ? filteredFaqs : faqs).map((category, catIdx) => (
            <motion.div key={catIdx} variants={staggerItem}>
              <h2 className="text-2xl font-bold mb-6 text-yellow-500 flex items-center gap-2">
                <span className="text-3xl">📖</span>
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, idx) => (
                  <FAQItem
                    key={idx}
                    question={item.q}
                    answer={item.a}
                    index={idx}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={{ once: true }}
          className="text-center py-16"
        >
          <p className="text-2xl font-bold mb-4">No results found</p>
          <p className="text-gray-400 mb-8">Try different search terms or browse categories above.</p>
          <button
            onClick={() => setSearchTerm("")}
            className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
          >
            Clear Search
          </button>
        </motion.div>
      )}

      {/* Divider */}
      <div className="my-16 border-t border-gray-700" />

      {/* Still Have Questions CTA */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="text-center py-12"
      >
        <h2 className="text-3xl font-bold mb-4">Didn't find your answer?</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Our support team is here to help! Reach out with any questions and we'll get back to you within 2 hours.
        </p>
        <button className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
          Contact Support
        </button>
      </motion.section>
    </PageLayout>
  );
}
