export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Hotel Management System - Frontend
        </h1>
        <p className="text-center text-lg mb-4">
          Welcome to the Multi-Tenant Hotel Booking Platform
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Hotels</h2>
            <p className="text-muted-foreground">Browse available hotels</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Bookings</h2>
            <p className="text-muted-foreground">Manage your reservations</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Profile</h2>
            <p className="text-muted-foreground">View your profile</p>
          </div>
        </div>
      </div>
    </div>
  );
}
