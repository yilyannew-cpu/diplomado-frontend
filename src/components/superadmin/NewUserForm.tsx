export function NewUserForm() {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">Registro corporativo</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Da de alta nuevos empleados con sus credenciales de acceso al sistema.
      </p>
      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <Field label="Nombre completo" placeholder="Ej. María Restrepo" />
        <Field label="Correo corporativo" placeholder="usuario@burgercore.co" />
        <Field label="Teléfono" placeholder="+57 300 000 0000" />
        <Field label="Placa / vehículo" placeholder="Opcional para domiciliarios" />
        <div>
          <span className="mb-1.5 block text-xs font-medium">Rol asignado</span>
          <select className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm">
            <option>Cliente</option>
            <option>Admin Restaurante</option>
            <option>Domiciliario</option>
          </select>
        </div>
        <Field label="Contraseña temporal" placeholder="********" type="password" />
        <div className="md:col-span-2 flex justify-end">
          <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
            Crear cuenta
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
