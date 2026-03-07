import { MarketingLayout as Layout, PageHeader } from "@/components/layout";

export default function Privacy() {
  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Privacy Policy"
          description="Last updated: January 2025"
        />

        <div className="max-w-3xl mx-auto prose-resume">
          <section className="mb-8">
            <h2>Overview</h2>
            <p>
              ResumeXpert is committed to protecting your privacy. This policy explains how we handle 
              your information when you use our resume building and career assistance tools.
            </p>
          </section>

          <section className="mb-8">
            <h2>What We Collect</h2>
            <p>
              <strong>Information you provide:</strong> When you use our tools, you may enter personal 
              information such as your name, contact details, work history, and skills. This information 
              is used solely to generate your resume and related documents.
            </p>
            <p>
              <strong>Local storage:</strong> We use browser local storage to save your progress so you 
              can return to your work. This data stays on your device and is not transmitted to our servers.
            </p>
            <p>
              <strong>Usage analytics:</strong> We may collect anonymous usage data to improve our 
              services, such as which features are most used. This data cannot be used to identify you.
            </p>
          </section>

          <section className="mb-8">
            <h2>How We Use Your Information</h2>
            <ul>
              <li>To generate resumes, cover letters, and career guidance based on your input</li>
              <li>To save your progress locally so you can continue where you left off</li>
              <li>To improve our tools and user experience</li>
              <li>To respond to your inquiries if you contact us</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>Data Storage and Security</h2>
            <p>
              <strong>Client-side processing:</strong> Most of our tools process your data directly in 
              your browser. Your resume content is not stored on our servers unless you explicitly choose 
              to save it to an account (feature coming soon).
            </p>
            <p>
              <strong>Encryption:</strong> When data is transmitted, we use industry-standard encryption 
              (HTTPS/TLS) to protect it in transit.
            </p>
          </section>

          <section className="mb-8">
            <h2>Third-Party Services</h2>
            <p>
              We may use third-party services for analytics and infrastructure. These services have their 
              own privacy policies and we encourage you to review them. We do not sell your personal 
              information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2>Your Rights</h2>
            <ul>
              <li><strong>Access:</strong> You can view all data stored locally in your browser</li>
              <li><strong>Deletion:</strong> You can clear your local data at any time through browser settings or our "Clear Form" buttons</li>
              <li><strong>Portability:</strong> You can copy and export all generated content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>Cookies</h2>
            <p>
              We use essential cookies to ensure our website functions properly. We may use analytics 
              cookies to understand how visitors interact with our site. You can control cookie settings 
              through your browser preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2>Children's Privacy</h2>
            <p>
              Our services are not intended for children under 13. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected such information, 
              please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify users of significant 
              changes by posting a notice on our website. Your continued use of our services after 
              changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have questions about this privacy policy or our data practices, please contact us 
              at <a href="mailto:privacy@resumexpert.com" className="text-primary hover:underline">privacy@resumexpert.com</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
