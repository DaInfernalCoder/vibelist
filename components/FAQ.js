"use client";

import { useRef, useState } from "react";

// <FAQ> component is a lsit of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList

const faqList = [
  {
    question: "How quickly can I create and publish a waitlist?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          You can create and publish a beautiful waitlist in under 10 minutes!
          Our no-code platform is designed for speed - simply customize your
          template, add your branding, and publish. No technical skills
          required.
        </p>
      </div>
    ),
  },
  {
    question: "What&apos;s included in my VibeList purchase?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>With your one-time purchase, you get:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Unlimited waitlist creation</li>
          <li>Unlimited user signups</li>
          <li>Beautiful customizable templates</li>
          <li>Real-time analytics dashboard</li>
          <li>CSV export of signup data</li>
          <li>Custom branding and colors</li>
          <li>24/7 support</li>
          <li>Lifetime access (no recurring fees)</li>
        </ul>
      </div>
    ),
  },
  {
    question: "Can I customize the look and feel of my waitlist?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Absolutely! You can customize everything including colors, fonts,
          logo, hero text, button text, success messages, and more. Our
          real-time preview lets you see changes instantly as you design your
          perfect waitlist page.
        </p>
      </div>
    ),
  },
  {
    question: "How do I track signups and analytics?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Your dashboard provides real-time analytics including total signups,
          daily signup trends, referral sources, and more. You can export all
          signup data as CSV for external analysis or email marketing campaigns.
        </p>
      </div>
    ),
  },
  {
    question: "Is there a limit on the number of signups I can collect?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          No limits! Collect unlimited signups across unlimited waitlists.
          Whether you get 10 signups or 10,000, your waitlist will handle the
          traffic without any additional costs.
        </p>
      </div>
    ),
  },
  {
    question: "Can I create multiple waitlists for different products?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Yes! Create as many waitlists as you need for different product ideas,
          features, or market segments. Each waitlist gets its own unique URL
          and separate analytics tracking.
        </p>
      </div>
    ),
  },
  {
    question: "Do I need technical skills to use VibeList?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Not at all! VibeList is designed to be &quot;braindead simple&quot; -
          no coding, no complex setup, no technical knowledge required. If you
          can use basic web forms, you can create professional waitlists with
          VibeList.
        </p>
      </div>
    ),
  },
  {
    question: "Can I get a refund if I&apos;m not satisfied?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Yes! We offer a 7-day money-back guarantee. If VibeList doesn&apos;t
          meet your expectations, simply reach out to our support team within 7
          days of purchase for a full refund.
        </p>
      </div>
    ),
  },
  {
    question: "How is this different from other waitlist tools?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          VibeList focuses on extreme simplicity and speed for founders who want
          to validate ideas quickly. Unlike complex subscription-based tools, we
          offer lifetime access for a one-time payment, beautiful templates
          out-of-the-box, and a validation-focused approach designed
          specifically for indie founders.
        </p>
      </div>
    ),
  },
  {
    question: "What happens to my data if I want to export it?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          You own your data completely. Export all signup information (emails,
          names, timestamps, referral sources) as CSV files anytime. Use this
          data for email marketing, customer research, or import into other
          tools.
        </p>
      </div>
    ),
  },
  {
    question: "Do you provide customer support?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Yes! We provide 24/7 support to help you succeed. Whether you need
          help setting up your waitlist, customizing your design, or
          understanding your analytics, our team is here to help.
        </p>
      </div>
    ),
  },
  {
    question: "I have another question not covered here",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          No problem! Reach out to us at{" "}
          <a
            href="mailto:dattasumit2019@gmail.com"
            className="text-primary hover:underline"
          >
            dattasumit2019@gmail.com
          </a>{" "}
          and we&apos;ll get back to you quickly. We&apos;re here to help you
          validate your ideas and build successful waitlists.
        </p>
      </div>
    ),
  },
];

const Item = ({ item }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="bg-base-100" id="faq">
      <div className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
