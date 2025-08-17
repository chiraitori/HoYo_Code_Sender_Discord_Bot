'use client';

import Aurora from '@/components/Aurora';
import FluidGlassHeader from '@/components/FluidGlassHeader';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
      <Aurora 
        colorStops={["rgb(111, 98, 157)", "rgb(60, 69, 128)", "rgb(39, 37, 91)"]}
        blend={0.3}
        amplitude={0.8}
        speed={0.3}
      />
      <FluidGlassHeader />
      
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-xl border rounded-2xl p-8 md:p-12" style={{
            background: 'var(--gradient-card)',
            borderColor: 'rgba(111, 98, 157, 0.2)'
          }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent" style={{
              backgroundImage: `linear-gradient(to right, rgb(154, 145, 193), rgb(111, 98, 157), rgb(154, 145, 193))`
            }}>
              Privacy Policy
            </h1>
            
            <div className="space-y-8" style={{ color: 'rgba(213, 203, 225, 0.8)' }}>
              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'rgb(154, 145, 193)' }}>Information We Collect</h2>
                <p className="leading-relaxed">
                  When you use HoYo Code Sender, we collect minimal information necessary for the bot to function:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                  <li>Discord User ID and Username (for authentication)</li>
                  <li>Server (Guild) IDs where the bot is used</li>
                  <li>Channel IDs configured for code delivery</li>
                  <li>Bot configuration settings per server</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
                <p className="leading-relaxed">
                  Your information is used solely to:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                  <li>Provide bot functionality and deliver redemption codes</li>
                  <li>Authenticate users for dashboard access</li>
                  <li>Store server-specific bot configurations</li>
                  <li>Improve bot performance and reliability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Data Storage and Security</h2>
                <p className="leading-relaxed">
                  We take data security seriously. All data is stored securely and encrypted. We do not store message content, 
                  only the necessary IDs and configuration data required for bot operation.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Data Sharing</h2>
                <p className="leading-relaxed">
                  We do not sell, trade, or share your personal information with third parties. Your data is used exclusively 
                  for bot functionality and is never shared outside our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
                <p className="leading-relaxed">
                  Server configuration data is retained as long as the bot remains in your server. If the bot is removed, 
                  associated data may be retained for up to 30 days before automatic deletion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
                <p className="leading-relaxed">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                  <li>Request deletion of your data</li>
                  <li>Access information we store about you</li>
                  <li>Update your server configurations</li>
                  <li>Remove the bot from your server at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
                <p className="leading-relaxed">
                  We may update this privacy policy from time to time. Users will be notified of significant changes 
                  through our Discord server or bot announcements.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                <p className="leading-relaxed">
                  If you have questions about this privacy policy or your data, please contact us through our 
                  Discord support server or email us at privacy@example.com.
                </p>
              </section>

              <div className="mt-8 pt-8 border-t border-white/20 text-sm text-white/60">
                <p>Last updated: January 2025</p>
                <p>This privacy policy is effective as of the date listed above.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
