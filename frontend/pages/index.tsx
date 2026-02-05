/**
 * EduPrep Landing Page - Dynamic Version
 * All content loaded from configuration for easy updates
 */

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useLandingData } from "../lib/hooks/useLandingData";
import DynamicIcon, { colorClasses } from "../components/ui/DynamicIcon";

export default function Home() {
  const { data: config, isLoading } = useLandingData();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % config.testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [config.testimonials.length]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{config.meta.title}</title>
        <meta name="description" content={config.meta.description} />
        <meta name="keywords" content={config.meta.keywords.join(", ")} />
        <meta property="og:title" content={config.meta.title} />
        <meta property="og:description" content={config.meta.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Navigation */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled
              ? "bg-white/95 backdrop-blur-md shadow-lg"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 lg:h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {config.footer.company.name}
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-8">
                <Link
                  href="#features"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Pricing
                </Link>
                <Link
                  href="/qbank"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Question Bank
                </Link>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Login
                </Link>
                <Link
                  href={config.hero.primaryCTA.href}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25"
                >
                  {config.hero.primaryCTA.text}
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <DynamicIcon name={mobileMenuOpen ? "x" : "menu"} size={24} />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-t shadow-lg">
              <div className="px-4 py-4 space-y-3">
                <Link
                  href="#features"
                  className="block py-2 text-gray-600 hover:text-blue-600"
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="block py-2 text-gray-600 hover:text-blue-600"
                >
                  Pricing
                </Link>
                <Link
                  href="/qbank"
                  className="block py-2 text-gray-600 hover:text-blue-600"
                >
                  Question Bank
                </Link>
                <Link
                  href="/login"
                  className="block py-2 text-gray-600 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  href={config.hero.primaryCTA.href}
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold"
                >
                  {config.hero.primaryCTA.text}
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-32 lg:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              {/* Trust Badge */}
              <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <DynamicIcon
                  name="star"
                  size={16}
                  className="mr-2 text-amber-500"
                />
                Trusted by 500K+ students worldwide
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                {config.hero.headline}
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
                {config.hero.subheadline}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link
                  href={config.hero.primaryCTA.href}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center"
                >
                  {config.hero.primaryCTA.text}
                  <DynamicIcon name="arrow-right" size={20} className="ml-2" />
                </Link>
                <Link
                  href={config.hero.secondaryCTA.href}
                  className="w-full sm:w-auto bg-white text-gray-700 px-8 py-4 rounded-full font-semibold text-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center"
                >
                  <DynamicIcon
                    name="play-circle"
                    size={20}
                    className="mr-2 text-blue-600"
                  />
                  {config.hero.secondaryCTA.text}
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
                {config.hero.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
                {config.valueProposition.subtitle}
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-6">
                {config.valueProposition.title}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {config.valueProposition.description}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {config.valueProposition.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100"
                >
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <DynamicIcon
                      name={highlight.icon}
                      size={28}
                      className="text-blue-600"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {highlight.title}
                  </h3>
                  <p className="text-gray-600">{highlight.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
                Features
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our comprehensive platform gives you all the tools needed to
                master your exam
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {config.features.map((feature) => {
                const colors = colorClasses[feature.color] || colorClasses.blue;
                return (
                  <div
                    key={feature.id}
                    className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                  >
                    <div
                      className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <DynamicIcon
                        name={feature.icon}
                        size={28}
                        className={colors.text}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Exam Simulator Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
                  Realistic Simulation
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-6">
                  {config.examSimulator.title}
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  {config.examSimulator.description}
                </p>

                <div className="space-y-4">
                  {config.examSimulator.modes.map((mode, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DynamicIcon
                          name={mode.icon}
                          size={24}
                          className="text-blue-600"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {mode.name}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/test"
                  className="inline-flex items-center mt-8 text-blue-600 font-semibold hover:text-blue-700"
                >
                  Try a Practice Test
                  <DynamicIcon name="arrow-right" size={20} className="ml-2" />
                </Link>
              </div>

              {/* Simulator Preview */}
              <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl">
                <div className="bg-gray-800 rounded-lg p-4">
                  {/* Mock Test Header */}
                  <div className="flex justify-between items-center mb-4 text-white text-sm">
                    <span>Question 15 of 40</span>
                    <span className="bg-amber-500 px-3 py-1 rounded text-gray-900 font-medium">
                      32:15 remaining
                    </span>
                  </div>
                  {/* Mock Question */}
                  <div className="bg-gray-700 rounded-lg p-4 text-gray-200 text-sm">
                    <p className="mb-4">
                      A 65-year-old man presents with progressive shortness of
                      breath...
                    </p>
                    <div className="space-y-2">
                      {["A", "B", "C", "D", "E"].map((letter) => (
                        <div
                          key={letter}
                          className={`p-3 rounded ${
                            letter === "B" ? "bg-blue-600" : "bg-gray-600"
                          } hover:bg-gray-500 cursor-pointer transition`}
                        >
                          {letter}. Option text here
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics Preview Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900 to-blue-950 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Analytics Preview Image */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <div className="space-y-4">
                  {/* Mock Chart Bars */}
                  <div className="flex items-end space-x-2 h-40">
                    {[60, 75, 55, 80, 90, 70, 85].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">78%</div>
                      <div className="text-xs text-blue-200">Your Score</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">65%</div>
                      <div className="text-xs text-blue-200">Peer Avg</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">Top 15%</div>
                      <div className="text-xs text-blue-200">Percentile</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-blue-300 font-semibold text-sm uppercase tracking-wider">
                  Data-Driven Learning
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold mt-3 mb-6">
                  {config.analyticsPreview.title}
                </h2>
                <p className="text-lg text-blue-200 mb-8">
                  {config.analyticsPreview.description}
                </p>

                <div className="space-y-4">
                  {config.analyticsPreview.metrics.map((metric, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DynamicIcon
                          name={metric.icon}
                          size={24}
                          className="text-blue-300"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">{metric.name}</h4>
                        <p className="text-blue-200 text-sm">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
                Testimonials
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-6">
                Trusted by Future Healthcare Professionals
              </h2>
            </div>

            {/* Testimonial Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {config.testimonials.slice(0, 3).map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all"
                >
                  {/* Rating Stars */}
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <DynamicIcon
                        key={i}
                        name="star"
                        size={20}
                        className="text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
                Pricing
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-4">
                {config.pricing.title}
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                {config.pricing.subtitle}
              </p>
              <p className="text-sm text-blue-600">
                {config.pricing.activationNote}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {config.pricing.plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl p-6 ${
                    plan.highlighted
                      ? "ring-2 ring-blue-600 shadow-xl scale-105"
                      : "border border-gray-200 shadow-sm"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <DynamicIcon
                          name="check"
                          size={18}
                          className="text-green-500 mr-2 flex-shrink-0 mt-0.5"
                        />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                      plan.highlighted
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
                FAQ
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-4">
                {config.faq.title}
              </h2>
              <p className="text-lg text-gray-600">{config.faq.subtitle}</p>
            </div>

            <div className="space-y-4">
              {config.faq.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === item.id ? null : item.id)
                    }
                    className="w-full px-6 py-4 text-left flex justify-between items-center"
                  >
                    <span className="font-semibold text-gray-900">
                      {item.question}
                    </span>
                    <DynamicIcon
                      name={
                        expandedFaq === item.id ? "chevron-up" : "chevron-down"
                      }
                      size={20}
                      className="text-gray-400"
                    />
                  </button>
                  {expandedFaq === item.id && (
                    <div className="px-6 pb-4 text-gray-600">{item.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {config.cta.title}
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              {config.cta.description}
            </p>
            <Link
              href={config.cta.buttonHref}
              className="inline-flex items-center bg-white text-blue-600 px-10 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl"
            >
              {config.cta.buttonText}
              <DynamicIcon name="arrow-right" size={24} className="ml-2" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <Link href="/" className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">E</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {config.footer.company.name}
                  </span>
                </Link>
                <p className="text-gray-400 mb-6">
                  {config.footer.company.description}
                </p>

                {/* Social Links */}
                <div className="flex space-x-4">
                  {config.footer.social.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition"
                    >
                      <DynamicIcon name={social.icon} size={18} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Links */}
              {config.footer.links.map((section) => (
                <div key={section.title}>
                  <h4 className="text-white font-semibold mb-4">
                    {section.title}
                  </h4>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="text-gray-400 hover:text-white transition"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                {config.footer.legal.copyright}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                {config.footer.legal.badges.map((badge) => (
                  <span
                    key={badge}
                    className="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-400"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
