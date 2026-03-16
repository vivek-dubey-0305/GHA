import { useState } from "react";
import { motion } from "framer-motion";
import PageLayout from "../../components/layout/PageLayout";
import { fadeInUp, staggerContainer, staggerItem } from "../../components/animations";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "support@greedhunteracademy.com",
    description: "Response within 2 hours",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+1 (800) 123-4567",
    description: "Monday-Friday, 9 AM-6 PM EST",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "San Francisco, CA",
    description: "Visit us by appointment",
  },
  {
    icon: Clock,
    title: "Live Chat",
    value: "Available 24/7",
    description: "Chat with our support team",
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      
      // Reset submitted state after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    }, 1500);
  };

  return (
    <PageLayout
      title="Get in Touch"
      description="Have questions? We'd love to hear from you. Reach out anytime."
    >
      {/* Contact Methods */}
      <motion.section className="mb-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-12 text-center text-yellow-500"
        >
          Ways to Reach Us
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {contactMethods.map((method, idx) => {
            const Icon = method.icon;
            return (
              <motion.div
                key={idx}
                variants={staggerItem}
                whileHover={{ y: -8 }}
                className="p-6 rounded-lg border border-yellow-500/10 bg-gradient-to-br from-yellow-500/5 to-transparent hover:border-yellow-500/30 transition-all text-center"
              >
                <Icon className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">{method.title}</h3>
                <p className="text-yellow-400 mb-2 font-semibold">{method.value}</p>
                <p className="text-gray-400 text-sm">{method.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Main Contact Form */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="grid lg:grid-cols-2 gap-12 mb-20"
      >
        {/* Form */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Send us a Message</h2>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-lg bg-green-500/20 border-2 border-green-500/40 text-center"
            >
              <div className="text-5xl mb-4">✓</div>
              <h3 className="text-2xl font-bold mb-2 text-green-400">Message Sent!</h3>
              <p className="text-gray-300 mb-4">
                Thank you for reaching out. Our team will respond within 2 hours.
              </p>
              <p className="text-gray-400">
                You can expect a response to <strong>{formData.email}</strong>
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-sm font-semibold mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="Your name"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="+1 (800) 123-4567"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-semibold mb-2">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  <option value="">Select a subject</option>
                  <option value="Course Inquiry">Course Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing">Billing Question</option>
                  <option value="Refund Request">Refund Request</option>
                  <option value="Partnership">Partnership Opportunity</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-semibold mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  placeholder="Tell us how we can help..."
                />
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-yellow-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {loading ? "Sending..." : "Send Message"}
              </motion.button>
            </form>
          )}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div>
            <h3 className="text-2xl font-bold mb-4">Response Time</h3>
            <p className="text-gray-400 leading-relaxed">
              We aim to respond to all inquiries within 2 hours during business hours. For urgent matters, please call our phone number above.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Department Contacts</h3>
            <div className="space-y-4">
              {[
                { dept: "Support", email: "support@greedhunteracademy.com" },
                { dept: "Sales", email: "sales@greedhunteracademy.com" },
                { dept: "Billing", email: "billing@greedhunteracademy.com" },
                { dept: "Partnerships", email: "partnerships@greedhunteracademy.com" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-lg bg-gray-800/30 border border-gray-700"
                >
                  <p className="text-gray-400 text-sm">{item.dept}</p>
                  <a href={`mailto:${item.email}`} className="text-yellow-500 font-semibold hover:text-yellow-400 transition-colors">
                    {item.email}
                  </a>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Business Hours</h3>
            <div className="space-y-2 text-gray-400">
              <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
              <p>Saturday: 10:00 AM - 4:00 PM EST</p>
              <p>Sunday: Closed (Chat support available 24/7)</p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-lg bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/30"
          >
            <p className="text-gray-300">
              📍 <strong>Headquarters:</strong> San Francisco, CA
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Visiting by appointment only. Schedule a video call with our team instead.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Social Media Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="text-center py-12 px-8 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20"
      >
        <h2 className="text-2xl font-bold mb-6">Connect With Us</h2>
        <p className="text-gray-300 mb-8">Follow us on social media for updates, tips, and community highlights</p>
        <div className="flex gap-4 justify-center flex-wrap">
          {["Twitter", "LinkedIn", "Facebook", "Instagram", "Discord"].map((social) => (
            <motion.button
              key={social}
              whileHover={{ y: -3 }}
              className="px-6 py-2 bg-yellow-500/20 text-yellow-400 font-semibold rounded-lg border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors"
            >
              {social}
            </motion.button>
          ))}
        </div>
      </motion.section>
    </PageLayout>
  );
}
