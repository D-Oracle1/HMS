export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Admin Dashboard
        </h1>
        <p className="text-center text-lg mb-4">
          Manage your hotel operations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
            <p className="text-muted-foreground">Overview & Analytics</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Rooms</h2>
            <p className="text-muted-foreground">Manage rooms</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Bookings</h2>
            <p className="text-muted-foreground">View reservations</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Customers</h2>
            <p className="text-muted-foreground">Manage guests</p>
          </div>
        </div>
      </div>
    </div>
  );
}
