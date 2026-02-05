import React from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts";

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose dark:prose-invert">
          <h2>1. Introduction</h2>
          <p>
            EduPrep ("we," "us," "our," or "Company") is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you visit our website.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We may collect information about you in a variety of ways. The
            information we may collect on the Site includes:
          </p>
          <ul>
            <li>
              <strong>Personal Data:</strong> Name, email address, phone number,
              password, and other information you voluntarily provide.
            </li>
            <li>
              <strong>Device Information:</strong> IP address, browser type,
              operating system, and referring URLs.
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited, time spent on pages,
              and actions taken on the website.
            </li>
          </ul>

          <h2>3. Use of Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with
            a smooth, efficient, and customized experience. Specifically, we may
            use information collected about you via the Site to:
          </p>
          <ul>
            <li>Create and manage your account</li>
            <li>
              Deliver targeted advertising, coupons, newsletters, and other
              information regarding promotions and updates
            </li>
            <li>Email regarding an order confirmation</li>
            <li>
              Fulfill and manage purchases, orders, payments, and other
              transactions related to the Site
            </li>
            <li>
              Generate a personal profile about you in order to better serve you
            </li>
          </ul>

          <h2>4. Disclosure of Your Information</h2>
          <p>We may share your information in the following situations:</p>
          <ul>
            <li>
              <strong>By Law or to Protect Rights:</strong> If we believe the
              release of information is necessary to comply with the law.
            </li>
            <li>
              <strong>Third-Party Service Providers:</strong> We may share your
              information with parties who perform services for us.
            </li>
            <li>
              <strong>Affiliates:</strong> We may share your information with
              our affiliates for purposes consistent with this Privacy Policy.
            </li>
          </ul>

          <h2>5. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to
            help protect your personal information. While we have taken
            reasonable steps to secure the personal information you provide to
            us, please be aware that no security measures are perfect or
            impenetrable.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at:
          </p>
          <ul>
            <li>Email: privacy@eduprep.com</li>
            <li>Address: Your Company Address Here</li>
          </ul>

          <h2>7. Changes to This Privacy Policy</h2>
          <p>
            EduPrep reserves the right to modify this privacy policy at any
            time. We encourage users to frequently check this page for any
            changes to stay informed about how we are helping to protect the
            personal information we collect. You acknowledge and agree that it
            is your responsibility to review this privacy policy periodically
            and become aware of modifications.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
