import NavBar from './NavBar'

export default function Layout({ children, title, back, actions }) {
  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <header className="sticky top-0 z-30 bg-green-700 text-white shadow-md safe-top">
        <div className="flex items-center gap-3 px-4 h-14">
          {back && (
            <button onClick={back} className="text-white/80 hover:text-white -ml-1 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="flex-1 text-lg font-semibold truncate">{title || 'FieldBook'}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </header>

      <main className="flex-1 pb-20">
        {children}
      </main>

      <NavBar />
    </div>
  )
}
