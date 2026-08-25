// ============================================================
// SEEDER — datos iniciales que se crean al clonar el proyecto
// ============================================================
// Se ejecuta con: npx prisma db seed
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

// Prisma 7.10+: el adapter es OBLIGATORIO (ya no es opcional)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const RESOURCES = ['users', 'roles'] as const;
const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;
const ACTION_LABEL: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
};

async function main() {
  console.log('🌱 Sembrando Mi SetList...');

  // 1) Permisos (CRUD por recurso)
  for (const res of RESOURCES) {
    for (const act of ACTIONS) {
      await prisma.permission.upsert({
        where: { name: `${res}.${act}` },
        update: {},
        create: {
          name: `${res}.${act}`,
          group: res,
          description: `${ACTION_LABEL[act]} ${res}`,
        },
      });
    }
  }
  const allPermissions = await prisma.permission.findMany();

  // 2) Roles por defecto
  const admin = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: { name: 'Administrador', description: 'Acceso total al sistema' },
  });

  await prisma.role.upsert({
    where: { name: 'Usuario' },
    update: {},
    create: { name: 'Usuario', description: 'Rol por defecto para cuentas nuevas' },
  });

  // Admin tiene TODOS los permisos (sync)
  await prisma.rolePermission.deleteMany({ where: { roleId: admin.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({
      roleId: admin.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // 3) Usuarios iniciales
  await prisma.user.upsert({
    where: { email: 'admin@misetlist.app' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@misetlist.app',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: admin.id }] },
    },
  });

  await prisma.user.upsert({
    where: { email: 'demo@misetlist.app' },
    update: {},
    create: {
      name: 'Demo',
      email: 'demo@misetlist.app',
      passwordHash: await bcrypt.hash('Demo123!', 10),
      emailVerifiedAt: new Date(),
    },
  });

  // Asegura que Demo tenga el rol "Usuario"
  const demo = await prisma.user.findUnique({ where: { email: 'demo@misetlist.app' } });
  const usuario = await prisma.role.findUnique({ where: { name: 'Usuario' } });
  if (demo && usuario) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: demo.id, roleId: usuario.id } },
      update: {},
      create: { userId: demo.id, roleId: usuario.id },
    });
  }

  console.log('✅ Seed completo:');
  console.log('   admin@misetlist.app / Admin123!  (Administrador)');
  console.log('   demo@misetlist.app  / Demo123!   (Usuario)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());