import Link from 'next/link';

export default function Header() {
  return (
    <header className="relative bg-gradient-to-r from-purple-800/90 to-purple-700/90 backdrop-blur-sm border-b border-purple-300/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-50 to-purple-100 bg-clip-text text-transparent">
                🎮
              </div>
              <div className="absolute inset-0 text-4xl animate-pulse opacity-50">🎮</div>
            </div>
            <Link 
              href="/" 
              className="text-2xl font-bold bg-gradient-to-r from-purple-50 to-purple-100 bg-clip-text text-transparent hover:from-purple-100 hover:to-purple-50 transition-all duration-300"
            >
              HoYo Code Sender
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-purple-50 hover:text-purple-100 transition-colors duration-300 font-medium"
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className="text-purple-50 hover:text-purple-100 transition-colors duration-300 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/codes" 
              className="text-purple-50 hover:text-purple-100 transition-colors duration-300 font-medium"
            >
              Live Codes
            </Link>
            <Link 
              href="/about" 
              className="text-purple-50 hover:text-purple-100 transition-colors duration-300 font-medium"
            >
              About
            </Link>
            <a
              href="https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-300 to-purple-100 text-purple-900 px-6 py-3 rounded-full font-bold hover:from-purple-100 hover:to-purple-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-300/50"
            >
              Add to Discord
            </a>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden text-purple-50 hover:text-purple-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
