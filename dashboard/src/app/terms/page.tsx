'use client';

import Aurora from '@/components/Aurora';
import FluidGlassHeader from '@/components/FluidGlassHeader';
import Footer from '@/components/Footer';

export default function TermsPage() {
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
              Terms of Service
            </h1>
            
            <div className="space-y-8" style={{ color: 'rgba(213, 203, 225, 0.8)' }}>
              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'rgb(154, 145, 193)' }}>Acceptance of Terms</h2>
                <p className="leading-relaxed">
                  By using HoYo Code Sender, you agree to these terms of service. If you do not agree to these terms, 
                  please do not use our bot or services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'rgb(154, 145, 193)' }}>Description of Service</h2>
                <p className="leading-relaxed">
                  HoYo Code Sender is a Discord bot that automatically delivers redemption codes for HoYoverse games 
                  including Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero. The service is provided free of charge.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">User Responsibilities</h2>
                <p className="leading-relaxed">You agree to:</p>
                <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                  <li>Use the bot in compliance with Discord's Terms of Service</li>
                  <li>Not abuse or spam the bot's commands</li>
                  <li>Not attempt to exploit or hack the bot</li>
                  <li>Respect other users and maintain appropriate conduct</li>
                  <li>Not use the bot for commercial purposes without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Prohibited Uses</h2>
                <p className="leading-relaxed">You may not:</p>
                <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                  <li>Attempt to reverse engineer or replicate the bot</li>
                  <li>Use the bot to violate any laws or regulations</li>
                  <li>Share or resell access to the bot</li>
                  <li>Use automated tools to interact with the bot excessively</li>
                  <li>Impersonate the bot developers or staff</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Service Availability</h2>
                <p className="leading-relaxed">
                  We strive to maintain high uptime, but we cannot guarantee 100% availability. The service may be 
                  temporarily unavailable for maintenance, updates, or due to circumstances beyond our control.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Code Accuracy</h2>
                <p className="leading-relaxed">
                  While we make every effort to provide accurate and valid redemption codes, we cannot guarantee that 
                  all codes will work or remain valid. Codes are sourced from official HoYoverse announcements and 
                  community sources.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Disclaimer</h2>
                <p className="leading-relaxed">
                  HoYo Code Sender is not affiliated with HoYoverse or any of their games. This is an independent 
                  community project. All game names, trademarks, and assets are property of their respective owners.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
                <p className="leading-relaxed">
                  The service is provided "as is" without warranties. We are not liable for any damages arising from 
                  the use or inability to use the bot, including but not limited to data loss or service interruptions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
                <p className="leading-relaxed">
                  We reserve the right to terminate or suspend access to the bot for violations of these terms or 
                  for any other reason at our discretion. Users may also terminate their use of the service at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
                <p className="leading-relaxed">
                  We may modify these terms at any time. Continued use of the service after changes constitutes 
                  acceptance of the new terms. Major changes will be announced through our Discord server.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
                <p className="leading-relaxed">
                  For questions about these terms or to report violations, please contact us through our Discord 
                  support server or email us at legal@example.com.
                </p>
              </section>

              <div className="mt-8 pt-8 border-t border-white/20 text-sm text-white/60">
                <p>Last updated: January 2025</p>
                <p>These terms are effective as of the date listed above.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
