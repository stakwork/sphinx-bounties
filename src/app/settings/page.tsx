/**
 * SETTINGS PAGE
 * Route: /settings
 *
 * Child pages to implement:
 * - profile/page.tsx             Profile settings
 * - notifications/page.tsx       Notification preferences
 * - security/page.tsx            Lightning auth settings
 * - connections/page.tsx         GitHub, Twitter integrations
 * - preferences/page.tsx         UI preferences
 *
 * Components: SettingsSidebar, SettingsForm, ToggleSwitch
 * API: PATCH /api/users/[id]
 * Models: User, Notification
 */

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings navigation */}
        <aside className="lg:col-span-1">
          <nav className="rounded-lg border p-4 space-y-2">
            <a href="/settings/profile" className="block px-3 py-2 rounded-md hover:bg-accent">
              Profile
            </a>
            <a
              href="/settings/notifications"
              className="block px-3 py-2 rounded-md hover:bg-accent"
            >
              Notifications
            </a>
            <a href="/settings/security" className="block px-3 py-2 rounded-md hover:bg-accent">
              Security
            </a>
            <a href="/settings/connections" className="block px-3 py-2 rounded-md hover:bg-accent">
              Connections
            </a>
          </nav>
        </aside>

        {/* Settings content */}
        <main className="lg:col-span-3">
          <div className="rounded-lg border p-6">
            <p className="text-muted-foreground">Select a settings category</p>
          </div>
        </main>
      </div>
    </div>
  );
}
