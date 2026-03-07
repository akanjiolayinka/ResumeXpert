import { MarketingLayout as Layout, PageHeader } from "@/components/layout";

export default function Terms() {
  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Terms of Service"
          description="Last updated: January 2025"
        />

        <div className="max-w-3xl mx-auto prose-resume">
          <section className="mb-8">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using ResumeXpert, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2>Description of Service</h2>
            <p>
              ResumeXpert provides tools for creating, optimizing, and analyzing resumes and cover 
              letters. Our services include resume builders, ATS scanning, cover letter generation, 
              and career guidance features.
            </p>
          </section>

          <section className="mb-8">
            <h2>User Responsibilities</h2>
            <ul>
              <li>
                <strong>Accurate information:</strong> You are responsible for ensuring that the 
                information you provide is accurate and truthful. We do not verify the accuracy of 
                user-provided content.
              </li>
              <li>
                <strong>Appropriate use:</strong> You agree not to use our services for any unlawful 
                purpose or to create fraudulent documents.
              </li>
              <li>
                <strong>Account security:</strong> If you create an account, you are responsible for 
                maintaining the security of your credentials.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>Intellectual Property</h2>
            <p>
              <strong>Your content:</strong> You retain ownership of all content you create using 
              our tools. You grant us a limited license to process your content solely for the 
              purpose of providing our services.
            </p>
            <p>
              <strong>Our content:</strong> ResumeXpert's website, tools, templates, and branding 
              are protected by intellectual property laws. You may not copy, modify, or distribute 
              our proprietary content without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2>Disclaimers</h2>
            <p>
              <strong>No employment guarantee:</strong> Our tools are designed to help improve your 
              job application materials, but we do not guarantee employment outcomes. Success in job 
              applications depends on many factors beyond resume quality.
            </p>
            <p>
              <strong>ATS scores:</strong> Our ATS scoring feature provides guidance based on common 
              patterns and best practices. Actual ATS systems vary, and our scores should be used as 
              general guidance, not guarantees.
            </p>
            <p>
              <strong>AI-generated content:</strong> Content suggestions are generated using algorithms 
              and should be reviewed and customized by you before use.
            </p>
          </section>

          <section className="mb-8">
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ResumeXpert shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages resulting from your 
              use of our services. Our total liability shall not exceed the amount you paid us in 
              the preceding 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2>Service Availability</h2>
            <p>
              We strive to maintain high availability of our services but do not guarantee 
              uninterrupted access. We may modify, suspend, or discontinue features at any time 
              with reasonable notice when possible.
            </p>
          </section>

          <section className="mb-8">
            <h2>Modifications to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of our services after 
              changes are posted constitutes acceptance of the modified terms. We will make 
              reasonable efforts to notify users of significant changes.
            </p>
          </section>

          <section className="mb-8">
            <h2>Termination</h2>
            <p>
              We reserve the right to terminate or suspend access to our services for users who 
              violate these terms or for any other reason at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2>Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              For questions about these terms, please contact us at{" "}
              <a href="mailto:legal@resumexpert.com" className="text-primary hover:underline">
                legal@resumexpert.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
