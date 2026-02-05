import React from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts";

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose dark:prose-invert">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing and using the EduPrep platform, you accept and agree to
            be bound by the terms and provision of this agreement.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the
            materials (information or software) on EduPrep's website for
            personal, non-commercial transitory viewing only. This is the grant
            of a license, not a transfer of title, and under this license you
            may not:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>
              Using the materials for any commercial purpose or for any public
              display
            </li>
            <li>
              Attempting to decompile or reverse engineer any software contained
              on the website
            </li>
            <li>
              Removing any copyright or other proprietary notations from the
              materials
            </li>
          </ul>

          <h2>3. Disclaimer</h2>
          <p>
            The materials on EduPrep's website are provided on an 'as is' basis.
            EduPrep makes no warranties, expressed or implied, and hereby
            disclaims and negates all other warranties including, without
            limitation, implied warranties or conditions of merchantability,
            fitness for a particular purpose, or non-infringement of
            intellectual property or other violation of rights.
          </p>

          <h2>4. Limitations</h2>
          <p>
            In no event shall EduPrep or its suppliers be liable for any damages
            (including, without limitation, damages for loss of data or profit,
            or due to business interruption) arising out of the use or inability
            to use the materials on the website.
          </p>

          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on EduPrep's website could include
            technical, typographical, or photographic errors. EduPrep does not
            warrant that any of the materials on its website are accurate,
            complete, or current.
          </p>

          <h2>6. Links</h2>
          <p>
            EduPrep has not reviewed all of the sites linked to its website and
            is not responsible for the contents of any such linked site. The
            inclusion of any link does not imply endorsement by EduPrep of the
            site. Use of any such linked website is at the user's own risk.
          </p>

          <h2>7. Modifications</h2>
          <p>
            EduPrep may revise these terms of service for its website at any
            time without notice. By using this website, you are agreeing to be
            bound by the then current version of these terms of service.
          </p>

          <h2>8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in
            accordance with the laws of the jurisdiction in which EduPrep
            operates, and you irrevocably submit to the exclusive jurisdiction
            of the courts located in that location.
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
