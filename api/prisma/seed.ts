// ============================================================
// SEEDER — datos iniciales al clonar el proyecto
// ============================================================
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Permisos de administración: CRUD completo por recurso
const ADMIN_RESOURCES = ['users', 'roles'] as const;
const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;
const ACTION_LABEL: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
};

// Permisos de perfil propio (para el rol Usuario)
const PROFILE_PERMISSIONS = [
  { name: 'profile.view', description: 'Ver perfil propio' },
  { name: 'profile.edit', description: 'Editar perfil propio' },
];

async function main() {
  console.log('🌱 Sembrando Mi SetList...');

  // ----------------------------------------------------------
  // 1) PERMISOS
  // ----------------------------------------------------------
  for (const res of ADMIN_RESOURCES) {
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
  for (const p of PROFILE_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name, group: 'profile', description: p.description },
    });
  }
  const allPermissions = await prisma.permission.findMany();

  // ----------------------------------------------------------
  // 2) ROLES por defecto
  // ----------------------------------------------------------
  const admin = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: { name: 'Administrador', description: 'Acceso total al sistema' },
  });
  const usuario = await prisma.role.upsert({
    where: { name: 'Usuario' },
    update: {},
    create: {
      name: 'Usuario',
      description: 'Rol por defecto para cuentas nuevas',
    },
  });

  // Administrador: TODOS los permisos (sync)
  await prisma.rolePermission.deleteMany({ where: { roleId: admin.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: admin.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // 🆕 Usuario: permisos de perfil propio (nunca queda vacío)
  const profilePerms = allPermissions.filter((p) => p.group === 'profile');
  await prisma.rolePermission.deleteMany({ where: { roleId: usuario.id } });
  await prisma.rolePermission.createMany({
    data: profilePerms.map((p) => ({ roleId: usuario.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // ----------------------------------------------------------
  // 3) USUARIOS iniciales
  // ----------------------------------------------------------
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

  // Asegura que Demo tenga el rol Usuario
  const demo = await prisma.user.findUnique({
    where: { email: 'demo@misetlist.app' },
  });
  if (demo) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: demo.id, roleId: usuario.id } },
      update: {},
      create: { userId: demo.id, roleId: usuario.id },
    });
  }

  // 🆕 Asegura que TODO usuario sin rol reciba "Usuario"
  const usersWithoutRole = await prisma.user.findMany({
    where: { roles: { none: {} } },
    select: { id: true },
  });
  if (usersWithoutRole.length > 0) {
    await prisma.userRole.createMany({
      data: usersWithoutRole.map((u) => ({ userId: u.id, roleId: usuario.id })),
      skipDuplicates: true,
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
